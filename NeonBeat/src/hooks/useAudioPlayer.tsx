import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Track = {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album?: string | null;
  artwork?: string | null;
  duration: number;
};

type PlaylistMap = Record<string, string[]>;

type AudioPlayerContextValue = {
  tracks: Track[];
  loading: boolean;
  permissionGranted: boolean;
  error?: string;
  currentTrack: Track | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  progress: number;
  isShuffle: boolean;
  favorites: Set<string>;
  playlists: PlaylistMap;
  playTrackById: (trackId: string, queue?: string[]) => Promise<void>;
  playFromCollection: (trackIds: string[], startIndex: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  seekTo: (millis: number) => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  addToPlaylist: (name: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (name: string, trackId: string) => Promise<void>;
  deletePlaylist: (name: string) => Promise<void>;
  refreshLibrary: () => Promise<void>;
  clearHistory: () => Promise<void>;
  clearFavorites: () => Promise<void>;
};

export const DEFAULT_PLAYLIST = 'Liked Songs';
const FAVORITES_KEY = 'neonbeat:favorites';
const PLAYLISTS_KEY = 'neonbeat:playlists';
const LAST_TRACK_KEY = 'neonbeat:last-track';
export const STORAGE_KEYS = {
  favorites: FAVORITES_KEY,
  playlists: PLAYLISTS_KEY,
  lastTrack: LAST_TRACK_KEY,
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

const resolveTitle = (title?: string | null, filename?: string | null) => {
  if (title && title.trim().length > 0) {
    return title;
  }
  if (!filename) {
    return 'Unknown Title';
  }
  return filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<string[]>([]);
  const playNextRef = useRef<() => Promise<void>>(async () => {});
  const pendingResumeRef = useRef<{ trackId: string; position: number } | null>(null);
  const lastStatusSaveRef = useRef<number>(0);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string>();
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<PlaylistMap>({ [DEFAULT_PLAYLIST]: [] });
  const [queueVersion, setQueueVersion] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const currentIndex = useMemo(() => {
    if (!currentTrackId) return -1;
    return queueRef.current.findIndex((id) => id === currentTrackId);
  }, [currentTrackId, queueVersion]);

  const currentTrack = useMemo<Track | null>(() => {
    if (!currentTrackId) return null;
    return tracks.find((track) => track.id === currentTrackId) ?? null;
  }, [tracks, currentTrackId]);

  const persistFavorites = useCallback(async (values: Set<string>) => {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(values)));
  }, []);

  const persistPlaylists = useCallback(async (values: PlaylistMap) => {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(values));
  }, []);

  const savePlaybackSnapshot = useCallback(
    async (trackId: string, position: number) => {
      const now = Date.now();
      if (now - lastStatusSaveRef.current < 2000) return;
      lastStatusSaveRef.current = now;
      await AsyncStorage.setItem(LAST_TRACK_KEY, JSON.stringify({ trackId, position }));
    },
    [],
  );

  const unloadSound = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
    } catch {
      /* noop */
    }
    try {
      await soundRef.current.unloadAsync();
    } catch {
      /* noop */
    }
    soundRef.current.setOnPlaybackStatusUpdate(null);
    soundRef.current = null;
  }, []);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if (status.error) {
          setError(status.error);
        }
        return;
      }
      setPositionMillis(status.positionMillis ?? 0);
      setDurationMillis(status.durationMillis ?? 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        void playNextRef.current();
      } else if (currentTrackId) {
        void savePlaybackSnapshot(currentTrackId, status.positionMillis ?? 0);
      }
    },
    [currentTrackId, savePlaybackSnapshot],
  );

  const loadAndPlayTrack = useCallback(
    async (track: Track, resumePosition?: number) => {
      await unloadSound();
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 500,
          positionMillis: resumePosition ?? 0,
        },
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(handlePlaybackStatus);
      setCurrentTrackId(track.id);
      setIsPlaying(true);
      await AsyncStorage.setItem(
        LAST_TRACK_KEY,
        JSON.stringify({ trackId: track.id, position: resumePosition ?? 0 }),
      );
    },
    [handlePlaybackStatus, unloadSound],
  );

  const playTrackById = useCallback(
    async (trackId: string, queue?: string[]) => {
      const track = tracks.find((item) => item.id === trackId);
      if (!track) return;

      if (queue && queue.length) {
        queueRef.current = queue;
        setQueueVersion((version) => version + 1);
      } else if (!queueRef.current.length) {
        queueRef.current = tracks.map((item) => item.id);
        setQueueVersion((version) => version + 1);
      }

      if (!queueRef.current.includes(trackId)) {
        queueRef.current = tracks.map((item) => item.id);
        setQueueVersion((version) => version + 1);
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      await loadAndPlayTrack(track);
    },
    [loadAndPlayTrack, tracks],
  );

  const playFromCollection = useCallback(
    async (trackIds: string[], startIndex: number) => {
      if (!trackIds.length) return;
      const safeIndex = Math.max(0, Math.min(trackIds.length - 1, startIndex));
      queueRef.current = trackIds;
      setQueueVersion((version) => version + 1);
      await playTrackById(trackIds[safeIndex], trackIds);
    },
    [playTrackById],
  );

  const playNext = useCallback(async () => {
    if (!queueRef.current.length) {
      queueRef.current = tracks.map((item) => item.id);
      setQueueVersion((version) => version + 1);
    }
    if (!queueRef.current.length) return;

    let nextId: string | undefined;
    if (isShuffle) {
      const candidates = queueRef.current.filter((id) => id !== currentTrackId);
      nextId = candidates[Math.floor(Math.random() * candidates.length)] ?? queueRef.current[0];
    } else {
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % queueRef.current.length;
      nextId = queueRef.current[nextIndex];
    }
    if (!nextId) return;
    await playTrackById(nextId);
  }, [currentIndex, currentTrackId, isShuffle, playTrackById, tracks]);

  const playPrevious = useCallback(async () => {
    if (!queueRef.current.length) {
      queueRef.current = tracks.map((item) => item.id);
      setQueueVersion((version) => version + 1);
    }
    if (!queueRef.current.length) return;

    let previousId: string | undefined;
    if (isShuffle) {
      const candidates = queueRef.current.filter((id) => id !== currentTrackId);
      previousId =
        candidates[Math.floor(Math.random() * candidates.length)] ??
        queueRef.current[queueRef.current.length - 1];
    } else {
      const prevIndex = currentIndex <= 0 ? queueRef.current.length - 1 : currentIndex - 1;
      previousId = queueRef.current[prevIndex];
    }
    if (!previousId) return;
    await playTrackById(previousId);
  }, [currentIndex, currentTrackId, isShuffle, playTrackById, tracks]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) {
      if (currentTrackId) {
        await playTrackById(currentTrackId);
      }
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    await Haptics.selectionAsync().catch(() => undefined);
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [currentTrackId, playTrackById]);

  const seekTo = useCallback(
    async (millis: number) => {
      if (!soundRef.current) return;
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      await soundRef.current.setPositionAsync(millis);
      if (currentTrackId) {
        await AsyncStorage.setItem(LAST_TRACK_KEY, JSON.stringify({ trackId: currentTrackId, position: millis }));
      }
    },
    [currentTrackId],
  );

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleFavorite = useCallback(
    async (trackId: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(trackId)) {
          next.delete(trackId);
        } else {
          next.add(trackId);
        }
        void persistFavorites(next);
        return next;
      });
    },
    [persistFavorites],
  );

  const createPlaylist = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPlaylists((prev) => {
        if (prev[trimmed]) return prev;
        const updated = { ...prev, [trimmed]: [] };
        void persistPlaylists(updated);
        return updated;
      });
    },
    [persistPlaylists],
  );

  const addToPlaylist = useCallback(
    async (name: string, trackId: string) => {
      setPlaylists((prev) => {
        const playlist = prev[name] ?? [];
        if (playlist.includes(trackId)) return prev;
        const updated = { ...prev, [name]: [...playlist, trackId] };
        void persistPlaylists(updated);
        return updated;
      });
    },
    [persistPlaylists],
  );

  const removeFromPlaylist = useCallback(
    async (name: string, trackId: string) => {
      setPlaylists((prev) => {
        const playlist = prev[name] ?? [];
        if (!playlist.includes(trackId)) return prev;
        const updated = { ...prev, [name]: playlist.filter((id) => id !== trackId) };
        void persistPlaylists(updated);
        return updated;
      });
    },
    [persistPlaylists],
  );

  const deletePlaylist = useCallback(
    async (name: string) => {
      if (name === DEFAULT_PLAYLIST) return;
      setPlaylists((prev) => {
        if (!prev[name]) return prev;
        const { [name]: _omit, ...rest } = prev;
        void persistPlaylists(rest);
        return rest;
      });
    },
    [persistPlaylists],
  );

  const loadPersistedState = useCallback(async () => {
    const [favoritesRaw, playlistsRaw, lastTrackRaw] = await Promise.all([
      AsyncStorage.getItem(FAVORITES_KEY),
      AsyncStorage.getItem(PLAYLISTS_KEY),
      AsyncStorage.getItem(LAST_TRACK_KEY),
    ]);

    if (favoritesRaw) {
      try {
        const stored = JSON.parse(favoritesRaw);
        setFavorites(new Set(Array.isArray(stored) ? stored : []));
      } catch {
        setFavorites(new Set());
      }
    }

    if (playlistsRaw) {
      try {
        const stored = JSON.parse(playlistsRaw) as PlaylistMap;
        setPlaylists((prev) => ({ ...prev, ...stored }));
      } catch {
        setPlaylists({ [DEFAULT_PLAYLIST]: [] });
      }
    }

    if (lastTrackRaw) {
      try {
        const snapshot = JSON.parse(lastTrackRaw);
        if (snapshot?.trackId) {
          pendingResumeRef.current = {
            trackId: snapshot.trackId,
            position: snapshot.position ?? 0,
          };
        }
      } catch {
        pendingResumeRef.current = null;
      }
    }
  }, []);

  const scanLibrary = useCallback(
    async (checkPermissions = false) => {
      try {
        if (checkPermissions) {
          const permission = await MediaLibrary.getPermissionsAsync(true);
          let granted = permission.granted || permission.accessPrivileges === 'all';
          if (!granted) {
            const request = await MediaLibrary.requestPermissionsAsync();
            granted = request.granted || request.accessPrivileges === 'all';
          }
          if (!isMountedRef.current) return;
          setPermissionGranted(granted);
          if (!granted) {
            setLoading(false);
            setError('Permission to access media library was denied.');
            return;
          }
        } else if (!permissionGranted) {
          return;
        }

        if (!isMountedRef.current) return;
        setError(undefined);
        setLoading(true);

        const fetched: Track[] = [];
        let page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          first: 200,
        });

        const consumeAssets = async (assets: MediaLibrary.Asset[]) => {
          for (const asset of assets) {
            const info = await MediaLibrary.getAssetInfoAsync(asset.id);
            const metadata = (info as Record<string, any>)?.metadata ?? {};
            fetched.push({
              id: asset.id,
              uri: info.localUri ?? asset.uri,
              filename: asset.filename,
              title: resolveTitle(metadata?.title, asset.filename),
              artist: metadata?.artist ?? 'Unknown Artist',
              album: metadata?.albumName ?? metadata?.album ?? info?.albumId ?? 'Unknown Album',
              artwork: metadata?.artwork ?? null,
              duration: Math.round(((info as MediaLibrary.AssetInfo)?.duration ?? asset.duration ?? 0) * 1000),
            });
          }
        };

        await consumeAssets(page.assets);
        while (page.hasNextPage) {
          page = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.audio,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
            first: 200,
            after: page.endCursor,
          });
          await consumeAssets(page.assets);
        }

        fetched.sort((a, b) => a.title.localeCompare(b.title));

        if (!isMountedRef.current) return;
        setTracks(fetched);
        queueRef.current = fetched.map((item) => item.id);
        setQueueVersion((version) => version + 1);
        setLoading(false);

        if (pendingResumeRef.current) {
          const { trackId, position } = pendingResumeRef.current;
          pendingResumeRef.current = null;
          const track = fetched.find((item) => item.id === trackId);
          if (track) {
            await loadAndPlayTrack(track, position);
          }
        }
      } catch (err) {
        console.error(err);
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Unable to load library.');
        setLoading(false);
      }
    },
    [loadAndPlayTrack, permissionGranted],
  );

  const refreshLibrary = useCallback(async () => {
    await scanLibrary(false);
  }, [scanLibrary]);

  const clearFavorites = useCallback(async () => {
    setFavorites(() => {
      const empty = new Set<string>();
      void persistFavorites(empty);
      return empty;
    });
  }, [persistFavorites]);

  const clearHistory = useCallback(async () => {
    pendingResumeRef.current = null;
    await AsyncStorage.removeItem(LAST_TRACK_KEY);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        });

        await loadPersistedState();
        await scanLibrary(true);
      } catch (err) {
        console.error(err);
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Unable to load library.');
        setLoading(false);
      }
    };

    void bootstrap();
  }, [loadPersistedState, scanLibrary]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' && currentTrackId !== null) {
        void savePlaybackSnapshot(currentTrackId, positionMillis);
      }
    });
    return () => subscription.remove();
  }, [currentTrackId, positionMillis, savePlaybackSnapshot]);

  useEffect(() => {
    return () => {
      void unloadSound();
    };
  }, [unloadSound]);

  const progress = useMemo(() => {
    if (!durationMillis || durationMillis <= 0) return 0;
    return Math.min(1, Math.max(0, positionMillis / durationMillis));
  }, [positionMillis, durationMillis]);

  const contextValue = useMemo<AudioPlayerContextValue>(
    () => ({
      tracks,
      loading,
      permissionGranted,
      error,
      currentTrack,
      isPlaying,
      positionMillis,
      durationMillis,
      progress,
      isShuffle,
      favorites,
      playlists,
      playTrackById,
      playFromCollection,
      togglePlay,
      playNext,
      playPrevious,
      toggleShuffle,
      seekTo,
      toggleFavorite,
      createPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      deletePlaylist,
      refreshLibrary,
      clearHistory,
      clearFavorites,
    }),
    [
      tracks,
      loading,
      permissionGranted,
      error,
      currentTrack,
      isPlaying,
      positionMillis,
      durationMillis,
      progress,
      isShuffle,
      favorites,
      playlists,
      playTrackById,
      playFromCollection,
      togglePlay,
      playNext,
      playPrevious,
      toggleShuffle,
      seekTo,
      toggleFavorite,
      createPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      deletePlaylist,
      refreshLibrary,
      clearHistory,
      clearFavorites,
    ],
  );

  return <AudioPlayerContext.Provider value={contextValue}>{children}</AudioPlayerContext.Provider>;
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

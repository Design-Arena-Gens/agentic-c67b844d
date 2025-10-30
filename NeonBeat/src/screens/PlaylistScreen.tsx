import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { DEFAULT_PLAYLIST, useAudioPlayer } from '../hooks/useAudioPlayer';
import SongCard from '../components/SongCard';

const LIKED_PLAYLIST = DEFAULT_PLAYLIST;

const PlaylistScreen: React.FC = () => {
  const navigation = useNavigation();
  const { playlists, favorites, tracks, createPlaylist, deletePlaylist, addToPlaylist, playFromCollection, toggleFavorite } =
    useAudioPlayer();

  const [playlistName, setPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(LIKED_PLAYLIST);
  const [isPickerVisible, setPickerVisible] = useState(false);

  const playlistEntries = useMemo(
    () =>
      Object.entries(playlists).sort(([a], [b]) => {
        if (a === LIKED_PLAYLIST) return -1;
        if (b === LIKED_PLAYLIST) return 1;
        return a.localeCompare(b);
      }),
    [playlists],
  );

  const selectedTracks = useMemo(() => {
    if (!selectedPlaylist) return [];
    if (selectedPlaylist === LIKED_PLAYLIST) {
      return tracks.filter((track) => favorites.has(track.id));
    }
    const ids = playlists[selectedPlaylist] ?? [];
    return tracks.filter((track) => ids.includes(track.id));
  }, [favorites, playlists, selectedPlaylist, tracks]);

  const availableTracks = useMemo(() => {
    if (!selectedPlaylist || selectedPlaylist === LIKED_PLAYLIST) {
      return tracks;
    }
    const currentIds = new Set(playlists[selectedPlaylist] ?? []);
    return tracks.filter((track) => !currentIds.has(track.id));
  }, [playlists, selectedPlaylist, tracks]);

  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) return;
    void createPlaylist(playlistName.trim());
    setPlaylistName('');
  };

  const handlePlayPlaylist = () => {
    if (!selectedTracks.length) return;
    void playFromCollection(
      selectedTracks.map((track) => track.id),
      0,
    ).then(() => navigation.navigate('Player' as never));
  };

  return (
    <LinearGradient colors={['#060608', '#0a0a0a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="px-6 pt-8">
          <Text className="text-white text-2xl font-bold">Playlists</Text>
          <Text className="text-[rgba(255,255,255,0.6)] mt-2">
            Curate glowing collections for every mood.
          </Text>

          <View className="mt-6 flex-row items-center gap-3">
            <TextInput
              value={playlistName}
              onChangeText={setPlaylistName}
              placeholder="New playlist name"
              placeholderTextColor="rgba(255,255,255,0.35)"
              className="flex-1 h-12 px-4 rounded-2xl border border-[rgba(255,255,255,0.15)] text-white"
            />
            <Pressable
              className="h-12 w-12 rounded-2xl items-center justify-center border border-[rgba(255,0,51,0.6)] bg-[rgba(255,0,51,0.12)]"
              onPress={handleCreatePlaylist}
            >
              <Ionicons name="add" size={24} color="#ff0033" />
            </Pressable>
          </View>
        </View>

        <Animated.ScrollView
          entering={FadeInUp.delay(200)}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 160 }}
        >
          <View className="flex-row flex-wrap justify-between">
            {playlistEntries.map(([name]) => {
              const isActive = name === selectedPlaylist;
              const trackCount =
                name === LIKED_PLAYLIST
                  ? favorites.size
                  : (playlists[name]?.length ?? 0);
              return (
                <Pressable
                  key={name}
                  onPress={() => setSelectedPlaylist(name)}
                  className="w-[48%] mb-5"
                >
                  <LinearGradient
                    colors={
                      isActive
                        ? ['rgba(255,0,51,0.55)', 'rgba(10,10,10,0.7)']
                        : ['rgba(20,20,20,0.75)', 'rgba(10,10,10,0.6)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      padding: 18,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: isActive ? 'rgba(255,0,51,0.8)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Ionicons
                      name={name === LIKED_PLAYLIST ? 'heart' : 'musical-notes'}
                      size={28}
                      color={isActive ? '#ff0033' : 'rgba(255,255,255,0.7)'}
                    />
                    <Text className="text-white text-lg font-semibold mt-4" numberOfLines={2}>
                      {name}
                    </Text>
                    <Text className="text-[rgba(255,255,255,0.6)] text-sm mt-2">
                      {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                    </Text>
                    {name !== LIKED_PLAYLIST && (
                      <Pressable
                        onPress={() => void deletePlaylist(name)}
                        className="mt-4 px-3 py-1 rounded-full bg-[rgba(255,0,51,0.15)] border border-[rgba(255,0,51,0.4)] self-start"
                      >
                        <Text className="text-[#ff0033] text-xs font-semibold">Delete</Text>
                      </Pressable>
                    )}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-6">
            <View className="flex-row items-center justify-between px-2">
              <View>
                <Text className="text-white text-lg font-semibold">{selectedPlaylist}</Text>
                <Text className="text-[rgba(255,255,255,0.55)] text-xs mt-1">
                  {selectedTracks.length} {selectedTracks.length === 1 ? 'song' : 'songs'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                {selectedPlaylist !== LIKED_PLAYLIST && (
                  <Pressable
                    className="px-4 py-2 rounded-full border border-[rgba(255,0,51,0.6)] bg-[rgba(255,0,51,0.15)]"
                    onPress={() => setPickerVisible(true)}
                  >
                    <Text className="text-[#ff0033] text-xs font-semibold">Add songs</Text>
                  </Pressable>
                )}
                <Pressable
                  className="px-4 py-2 rounded-full border border-[rgba(255,255,255,0.15)]"
                  onPress={handlePlayPlaylist}
                >
                  <Text className="text-white text-xs font-semibold">Play all</Text>
                </Pressable>
              </View>
            </View>

            {selectedTracks.length === 0 ? (
              <View className="items-center mt-10 px-6">
                <Text className="text-[rgba(255,255,255,0.6)] text-sm text-center">
                  {selectedPlaylist === LIKED_PLAYLIST
                    ? 'Tap the heart icon on any song to build your neon favorites.'
                    : 'Add songs from your library to craft this playlist.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={selectedTracks}
                keyExtractor={(item) => `${selectedPlaylist}-${item.id}`}
                renderItem={({ item, index }) => (
                  <SongCard
                    track={item}
                    index={index}
                    onPress={() => {
                      void playFromCollection(
                        selectedTracks.map((track) => track.id),
                        index,
                      ).then(() => navigation.navigate('Player' as never));
                    }}
                    isFavorite={favorites.has(item.id)}
                    onToggleFavorite={() => void toggleFavorite(item.id)}
                  />
                )}
                scrollEnabled={false}
                contentContainerStyle={{ paddingTop: 16 }}
              />
            )}
          </View>
        </Animated.ScrollView>

        <Modal
          transparent
          visible={isPickerVisible}
          onRequestClose={() => setPickerVisible(false)}
          animationType="fade"
        >
          <View className="flex-1 bg-[rgba(0,0,0,0.75)] justify-center px-6">
            <View className="rounded-3xl bg-[rgba(10,10,10,0.95)] border border-[rgba(255,0,51,0.35)] p-6">
              <Text className="text-white text-lg font-semibold">
                Add to {selectedPlaylist}
              </Text>
              <Text className="text-[rgba(255,255,255,0.6)] text-xs mt-1">
                Tap a song to include it in this playlist.
              </Text>
              <FlatList
                data={availableTracks}
                keyExtractor={(item) => `picker-${item.id}`}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      if (selectedPlaylist) {
                        void addToPlaylist(selectedPlaylist, item.id);
                      }
                    }}
                    className="mt-4 px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(20,20,20,0.7)]"
                  >
                    <Text className="text-white font-semibold">{item.title}</Text>
                    <Text className="text-[rgba(255,255,255,0.5)] text-xs mt-1">{item.artist}</Text>
                  </Pressable>
                )}
                style={{ maxHeight: 320, marginTop: 12 }}
              />
              <Pressable
                className="mt-6 px-4 py-3 rounded-full border border-[rgba(255,0,51,0.6)]"
                onPress={() => setPickerVisible(false)}
              >
                <Text className="text-[#ff0033] text-center font-semibold">Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default PlaylistScreen;

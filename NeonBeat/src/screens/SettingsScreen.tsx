import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DEFAULT_PLAYLIST, STORAGE_KEYS, useAudioPlayer } from '../hooks/useAudioPlayer';

type BusyAction = 'refresh' | 'favorites' | 'history' | null;

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = ({ label, value, icon }) => (
  <BlurView
    intensity={25}
    tint="dark"
    className="rounded-3xl border border-[rgba(255,0,51,0.25)] px-5 py-4 mr-4"
  >
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 rounded-2xl bg-[rgba(255,0,51,0.2)] items-center justify-center border border-[rgba(255,0,51,0.55)]">
        <Ionicons name={icon} size={22} color="#ff0033" />
      </View>
      <View>
        <Text className="text-white text-sm uppercase tracking-wider">{label}</Text>
        <Text className="text-white text-xl font-semibold mt-1">{value}</Text>
      </View>
    </View>
  </BlurView>
);

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    tracks,
    favorites,
    playlists,
    refreshLibrary,
    clearFavorites,
    clearHistory,
  } = useAudioPlayer();
  const [busy, setBusy] = useState<BusyAction>(null);

  const playlistCount = Object.keys(playlists).filter((name) => name !== DEFAULT_PLAYLIST).length;

  const handleAction = async (type: BusyAction, action: () => Promise<void>) => {
    if (busy) return;
    try {
      setBusy(type);
      await action();
    } catch (error) {
      Alert.alert('Something went wrong', (error as Error)?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <LinearGradient colors={['#070707', '#0b0b0b']} style={{ flex: 1, paddingBottom: Math.max(24, insets.bottom) }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.springify().damping(10)} className="mb-8">
          <Text className="text-white text-3xl font-bold">Settings</Text>
          <Text className="text-[rgba(255,255,255,0.7)] mt-2">
            Fine tune NeonBeat and keep your library glowing.
          </Text>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10">
          <StatCard label="Tracks" value={`${tracks.length}`} icon="musical-notes" />
          <StatCard label="Favorites" value={`${favorites.size}`} icon="heart" />
          <StatCard label="Playlists" value={`${playlistCount}`} icon="albums" />
        </ScrollView>

        <View className="space-y-4">
          <Pressable
            className="rounded-3xl border border-[rgba(255,0,51,0.5)] bg-[rgba(255,0,51,0.15)] px-6 py-5 flex-row items-center justify-between"
            onPress={() => handleAction('refresh', refreshLibrary)}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="refresh" size={22} color="#ff0033" />
              <View>
                <Text className="text-white text-base font-semibold">Rescan Library</Text>
                <Text className="text-[rgba(255,255,255,0.7)] text-xs mt-1">
                  Detect newly added music files instantly.
                </Text>
              </View>
            </View>
            {busy === 'refresh' ? (
              <ActivityIndicator color="#ff0033" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#ff3355" />
            )}
          </Pressable>

          <Pressable
            className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,20,20,0.85)] px-6 py-5 flex-row items-center justify-between"
            onPress={() =>
              handleAction('favorites', async () => {
                if (!favorites.size) return;
                await clearFavorites();
              })
            }
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="heart-dislike" size={22} color="#ffffff" />
              <View>
                <Text className="text-white text-base font-semibold">Clear Favorites</Text>
                <Text className="text-[rgba(255,255,255,0.7)] text-xs mt-1">
                  Remove all liked songs and start fresh.
                </Text>
              </View>
            </View>
            {busy === 'favorites' ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#ffffff" />
            )}
          </Pressable>

          <Pressable
            className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(20,20,20,0.85)] px-6 py-5 flex-row items-center justify-between"
            onPress={() => handleAction('history', clearHistory)}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="time" size={22} color="#ffffff" />
              <View>
                <Text className="text-white text-base font-semibold">Reset Last Session</Text>
                <Text className="text-[rgba(255,255,255,0.7)] text-xs mt-1">
                  Forget the last played song and position.
                </Text>
              </View>
            </View>
            {busy === 'history' ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#ffffff" />
            )}
          </Pressable>
        </View>

        <View className="mt-14 border border-[rgba(255,255,255,0.08)] rounded-3xl px-6 py-6 bg-[rgba(12,12,12,0.9)]">
          <Text className="text-white font-semibold text-lg">Storage Keys</Text>
          <Text className="text-[rgba(255,255,255,0.65)] text-xs mt-2">
            Data is stored securely on-device using AsyncStorage.
          </Text>
          <View className="mt-4 space-y-2">
            <Text className="text-[rgba(255,255,255,0.6)] text-xs">
              Favorites: <Text className="text-white">{STORAGE_KEYS.favorites}</Text>
            </Text>
            <Text className="text-[rgba(255,255,255,0.6)] text-xs">
              Playlists: <Text className="text-white">{STORAGE_KEYS.playlists}</Text>
            </Text>
            <Text className="text-[rgba(255,255,255,0.6)] text-xs">
              Last track: <Text className="text-white">{STORAGE_KEYS.lastTrack}</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default SettingsScreen;

import React from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const MiniPlayer: React.FC = () => {
  const { currentTrack, togglePlay, playNext, isPlaying, positionMillis, durationMillis } =
    useAudioPlayer();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  if (!currentTrack) {
    return null;
  }

  const progress = durationMillis ? positionMillis / durationMillis : 0;

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      exiting={FadeOutDown.duration(180)}
      style={{ paddingBottom: insets.bottom > 16 ? insets.bottom : 16 }}
    >
      <BlurView
        intensity={40}
        tint="dark"
        className="mx-4 rounded-3xl border border-[rgba(255,0,51,0.35)] overflow-hidden"
        style={{
          backgroundColor: 'rgba(10,10,10,0.85)',
          shadowColor: '#ff0033',
          shadowOpacity: 0.45,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync().catch(() => undefined);
            navigation.navigate('Player' as never);
          }}
          className="flex-row items-center px-4 py-3 gap-4"
        >
          <View className="h-12 w-12 rounded-2xl overflow-hidden border border-[rgba(255,0,51,0.32)]">
            <Image
              source={{ uri: currentTrack.artwork ?? 'https://cdn.jsdelivr.net/gh/isl-org/demo-assets/placeholder/placeholder-256x256.png' }}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold" numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text className="text-[rgba(255,255,255,0.55)] text-xs" numberOfLines={1}>
              {currentTrack.artist}
            </Text>
            <View className="mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.15)] overflow-hidden">
              <View
                style={{
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                  backgroundColor: '#ff0033',
                }}
                className="h-full rounded-full"
              />
            </View>
          </View>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
              void togglePlay();
            }}
            className="h-10 w-10 rounded-full items-center justify-center bg-[rgba(255,0,51,0.2)] border border-[rgba(255,0,51,0.45)]"
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#ff0033" />
          </Pressable>
          <Pressable
            onPress={() => void playNext()}
            className="h-10 w-10 rounded-full items-center justify-center border border-[rgba(255,255,255,0.15)] bg-[rgba(20,20,20,0.9)]"
          >
            <Ionicons name="play-skip-forward" size={20} color="#ffffff" />
          </Pressable>
        </Pressable>
      </BlurView>
    </Animated.View>
  );
};

export default MiniPlayer;

import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { formatTime } from '../utils/formatTime';

const ControlButton: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  size?: number;
  active?: boolean;
}> = ({ icon, onPress, size = 28, active }) => (
  <Pressable
    onPress={() => {
      void Haptics.selectionAsync().catch(() => undefined);
      onPress();
    }}
    className="h-14 w-14 rounded-full items-center justify-center"
    style={{
      backgroundColor: active ? 'rgba(255,0,51,0.25)' : 'rgba(20,20,20,0.95)',
      borderWidth: 1,
      borderColor: active ? 'rgba(255,0,51,0.85)' : 'rgba(255,255,255,0.08)',
      shadowColor: '#ff0033',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: active ? 0.85 : 0.4,
      shadowRadius: 12,
    }}
  >
    <Ionicons name={icon} size={size} color={active ? '#ff0033' : '#ffffff'} />
  </Pressable>
);

const PlayerControls: React.FC = () => {
  const {
    togglePlay,
    playNext,
    playPrevious,
    isPlaying,
    positionMillis,
    durationMillis,
    seekTo,
    isShuffle,
    toggleShuffle,
  } = useAudioPlayer();

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()} className="w-full px-6">
      <View className="mb-2 flex-row justify-between">
        <Text className="text-white text-xs font-medium">{formatTime(positionMillis)}</Text>
        <Text className="text-white text-xs font-medium">{formatTime(durationMillis)}</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={durationMillis || 1}
        minimumTrackTintColor="#ff0033"
        maximumTrackTintColor="rgba(255,255,255,0.25)"
        thumbTintColor="#ff3355"
        value={positionMillis}
        onSlidingComplete={(value) => {
          void seekTo(value);
        }}
      />
      <View className="mt-6 flex-row items-center justify-between px-4">
        <ControlButton icon="shuffle" onPress={toggleShuffle} size={22} active={isShuffle} />
        <ControlButton icon="play-skip-back" onPress={() => void playPrevious()} size={28} />
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            void togglePlay();
          }}
          className="h-20 w-20 rounded-full items-center justify-center"
          style={{
            backgroundColor: '#ff0033',
            shadowColor: '#ff3355',
            shadowOpacity: 0.9,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color="#0a0a0a" />
        </Pressable>
        <ControlButton icon="play-skip-forward" onPress={() => void playNext()} size={28} />
        <View className="h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(20,20,20,0.95)]">
          <Feather name="music" size={22} color="rgba(255,255,255,0.6)" />
        </View>
      </View>
    </Animated.View>
  );
};

export default PlayerControls;

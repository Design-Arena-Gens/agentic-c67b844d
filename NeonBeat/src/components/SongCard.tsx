import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Track } from '../hooks/useAudioPlayer';
import { Text } from 'react-native';

type Props = {
  track: Track;
  index: number;
  onPress: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
};

const artworkFallback =
  'https://cdn.jsdelivr.net/gh/isl-org/demo-assets/placeholder/placeholder-512x512.png';

export const SongCard: React.FC<Props> = ({ track, index, onPress, onToggleFavorite, isFavorite }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <LinearGradient
        colors={['rgba(255, 0, 51, 0.4)', 'rgba(10, 10, 10, 0.65)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 0, 51, 0.4)',
        }}
      >
        <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View
            className="h-16 w-16 rounded-2xl overflow-hidden border border-[rgba(255,0,51,0.4)] bg-[#12000a]"
            style={{ shadowColor: '#ff0033', shadowOpacity: 0.4, shadowRadius: 10 }}
          >
            <Image
              resizeMode="cover"
              source={{ uri: track.artwork ?? artworkFallback }}
              style={{ height: '100%', width: '100%' }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {track.title}
            </Text>
            <Text className="text-[rgba(255,255,255,0.5)] text-sm mt-1" numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            className="h-10 w-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: 'rgba(255, 0, 51, 0.15)',
              borderColor: 'rgba(255, 0, 51, 0.55)',
              borderWidth: 1,
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#ff0033' : 'rgba(255,255,255,0.75)'}
            />
          </Pressable>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
};

export default SongCard;

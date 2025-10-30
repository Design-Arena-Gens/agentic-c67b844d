import React, { useEffect } from 'react';
import { Dimensions, Image, Pressable, SafeAreaView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import PlayerControls from '../components/PlayerControls';
import Visualizer from '../components/Visualizer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');
const ART_SIZE = width * 0.58;
const RING_SIZE = ART_SIZE + 80;
const RADIUS = (RING_SIZE - 40) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PlayerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentTrack, progress, isPlaying, toggleFavorite, favorites } = useAudioPlayer();
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 450 });
  }, [progress, animatedProgress]);

  if (!currentTrack) {
    return (
      <LinearGradient colors={['#050505', '#0a0a0a']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 justify-center items-center px-10">
          <Text className="text-white font-semibold text-lg text-center">
            Choose a track from your library to start listening.
          </Text>
          <Pressable
            className="mt-8 px-6 py-3 rounded-full border border-[rgba(255,0,51,0.55)]"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-[#ff0033] font-semibold">Back to library</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, animatedProgress.value))),
  }));

  return (
    <LinearGradient colors={['#040404', '#0a0a0a']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 pt-4">
          <Pressable
            className="h-10 w-10 rounded-full border border-[rgba(255,255,255,0.15)] items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-down" size={22} color="white" />
          </Pressable>
          <Text className="text-white font-semibold text-base">Now Playing</Text>
          <Pressable
            className="h-10 w-10 rounded-full border border-[rgba(255,0,51,0.4)] items-center justify-center"
            onPress={() => void toggleFavorite(currentTrack.id)}
          >
            <Ionicons
              name={favorites.has(currentTrack.id) ? 'heart' : 'heart-outline'}
              size={22}
              color="#ff0033"
            />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center">
          <View className="mt-8 mb-6">
            <Visualizer isPlaying={isPlaying} />
          </View>
          <BlurView
            intensity={25}
            tint="dark"
            style={{
              height: RING_SIZE,
              width: RING_SIZE,
              borderRadius: RING_SIZE / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg height={RING_SIZE} width={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={10}
                fill="transparent"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#ff0033"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                animatedProps={animatedCircleProps}
                fill="transparent"
              />
            </Svg>
            <Image
              source={{
                uri:
                  currentTrack.artwork ??
                  'https://cdn.jsdelivr.net/gh/isl-org/demo-assets/placeholder/placeholder-512x512.png',
              }}
              style={{
                height: ART_SIZE,
                width: ART_SIZE,
                borderRadius: ART_SIZE / 2,
                borderWidth: 2,
                borderColor: 'rgba(255,0,51,0.45)',
              }}
              resizeMode="cover"
            />
          </BlurView>
          <View className="items-center mt-8 px-10">
            <Text className="text-white text-2xl font-semibold text-center" numberOfLines={2}>
              {currentTrack.title}
            </Text>
            <Text className="text-[rgba(255,255,255,0.55)] text-base mt-2" numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
        </View>

        <View className="pb-12">
          <PlayerControls />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default PlayerScreen;

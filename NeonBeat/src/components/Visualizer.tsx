import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  isPlaying: boolean;
  intensity?: number;
};

const Visualizer: React.FC<Props> = ({ isPlaying, intensity = 0.65 }) => {
  const animation = useRef<LottieView>(null);
  const animatedIntensity = useSharedValue(isPlaying ? intensity : 0.2);

  useEffect(() => {
    if (isPlaying) {
      animation.current?.play();
    } else {
      animation.current?.pause();
    }
    animatedIntensity.value = withTiming(isPlaying ? intensity : 0.2, { duration: 400 });
  }, [isPlaying, intensity, animatedIntensity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: animatedIntensity.value + 0.2,
    transform: [{ scale: 0.9 + animatedIntensity.value * 0.15 }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
      <LinearGradient
        colors={['rgba(255,0,51,0.35)', 'rgba(10,10,10,0.4)']}
        style={{
          width: 260,
          height: 260,
          borderRadius: 130,
          position: 'absolute',
          shadowColor: '#ff0033',
          shadowOpacity: 0.5,
          shadowRadius: 60,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      <View style={{ width: 220, height: 220 }}>
        <LottieView
          ref={animation}
          source={require('../assets/animations/neon_equalizer.json')}
          autoPlay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </Animated.View>
  );
};

export default Visualizer;

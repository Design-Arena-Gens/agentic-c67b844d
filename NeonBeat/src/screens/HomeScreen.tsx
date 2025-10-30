import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import SongCard from '../components/SongCard';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { tracks, loading, permissionGranted, error, favorites, toggleFavorite, playFromCollection } =
    useAudioPlayer();

  const glow = useSharedValue(0.4);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1600 }), -1, true);
  }, [glow]);

  const animatedGlow = useAnimatedStyle(() => ({
    textShadowRadius: 12 + glow.value * 30,
    textShadowColor: '#ff0033',
  }));

  const handlePlay = useCallback(
    (index: number) => {
      void playFromCollection(
        tracks.map((track) => track.id),
        index,
      ).then(() => {
        navigation.navigate('Player' as never);
      });
    },
    [navigation, playFromCollection, tracks],
  );

  const renderEmpty = () => {
    if (loading) {
      return null;
    }
    if (!permissionGranted) {
      return (
        <View className="mt-12 items-center">
          <Ionicons name="lock-closed" size={48} color="rgba(255,255,255,0.45)" />
          <Text className="text-white text-lg font-semibold mt-4 text-center">
            Permission required
          </Text>
          <Text className="text-[rgba(255,255,255,0.65)] text-sm text-center px-10 mt-2">
            Allow NeonBeat to access your media library so we can discover your local tracks.
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View className="mt-12 items-center">
          <Ionicons name="warning" size={48} color="#ff0033" />
          <Text className="text-white text-lg font-semibold mt-4 text-center">{error}</Text>
          <Text className="text-[rgba(255,255,255,0.65)] text-sm text-center px-10 mt-2">
            Try adding music files to your device or refreshing the library.
          </Text>
        </View>
      );
    }
    return (
      <View className="mt-16 items-center px-10">
        <Ionicons name="musical-notes-outline" size={52} color="rgba(255,255,255,0.4)" />
        <Text className="text-white text-lg font-semibold mt-4 text-center">No tracks yet</Text>
        <Text className="text-[rgba(255,255,255,0.65)] text-sm text-center mt-2">
          Drop MP3, WAV, or FLAC files onto your device. NeonBeat will pick them up automatically.
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#050505', '#0a0a0a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 140 }}
          ListHeaderComponent={
            <View className="mb-10">
              <Animated.Text
                style={animatedGlow}
                className="text-4xl font-extrabold text-[#ff0033] text-center tracking-widest"
              >
                NeonBeat
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                className="text-[rgba(255,255,255,0.75)] text-center mt-3"
              >
                Your personal neon soundscape
              </Animated.Text>
              {loading && (
                <View className="flex-row justify-center items-center mt-6 gap-3">
                  <ActivityIndicator color="#ff0033" />
                  <Text className="text-[rgba(255,255,255,0.65)] text-sm">Scanning your music…</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <SongCard
              track={item}
              index={index}
              onPress={() => handlePlay(index)}
              onToggleFavorite={() => void toggleFavorite(item.id)}
              isFavorite={favorites.has(item.id)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default HomeScreen;

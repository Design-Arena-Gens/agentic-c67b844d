import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

import HomeScreen from './src/screens/HomeScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import MiniPlayer from './src/components/MiniPlayer';
import { AudioPlayerProvider, useAudioPlayer } from './src/hooks/useAudioPlayer';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#ff0033',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      tabBarStyle: {
        backgroundColor: 'rgba(5,5,5,0.95)',
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingBottom: 6,
        paddingTop: 6,
      },
      tabBarIcon: ({ color, size }) => {
        const iconMap: Record<string, React.ReactNode> = {
          Home: <Ionicons name="home" size={size} color={color} />,
          Playlists: <Ionicons name="albums" size={size} color={color} />,
          Settings: <Feather name="settings" size={size} color={color} />,
        };
        return iconMap[route.name] ?? <Ionicons name="ellipse" size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Playlists" component={PlaylistScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const RootNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'fade_from_bottom',
      presentation: 'modal',
    }}
  >
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="Player" component={PlayerScreen} />
  </Stack.Navigator>
);

const MiniPlayerOverlay = () => {
  const { currentTrack } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <MiniPlayer />
    </View>
  );
};

const AppContent = () => {
  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#050505',
          card: '#050505',
          text: '#ffffff',
          border: 'rgba(255,255,255,0.05)',
          primary: '#ff0033',
        },
      }}
    >
      <View style={{ flex: 1 }}>
        <RootNavigator />
        <MiniPlayerOverlay />
      </View>
    </NavigationContainer>
  );
};

const App = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' }}>
        <ActivityIndicator color="#ff0033" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AudioPlayerProvider>
          <AppContent />
          <StatusBar style="light" />
        </AudioPlayerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

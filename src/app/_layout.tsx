import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PlaylistSelector } from "@/components/PlaylistSelector";
import { THEME } from "@/constants/colors";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { usePlayerStore } from "@/store/usePlayerStore";
import {
  setAudioModeAsync,
  useAudioPlaylist,
  useAudioPlaylistStatus,
} from "expo-audio";
import "./global.css";

export default function RootLayout() {
  const pathname = usePathname();
  const selectorVisible = usePlaylistStore((state) => state.selectorVisible);
  const trackToSelect = usePlaylistStore((state) => state.trackToSelect);
  const closeSelector = usePlaylistStore((state) => state.closeSelector);

  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const setPlaybackStatus = usePlayerStore((state) => state.setPlaybackStatus);
  const skipNext = usePlayerStore((state) => state.skipNext);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isHydrated = useRef(false);

  // Initialize a PERSISTENT player object
  // We don't pass currentTrack.url here to prevent the hook from re-creating the player
  const player = useAudioPlaylist();
  const status = useAudioPlaylistStatus(player);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // One-time Setup
  useEffect(() => {
    setPlayer(player);

    // Configure audio session for background playback
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(console.error);

    // Initial hydration if we have a saved track
    if (!isHydrated.current && currentTrack?.url) {
      const queue = usePlayerStore.getState().queue;
      player.clear();
      queue.forEach((t) => {
        player.add({
          uri: t.url,
          name: t.title,
        });
      });

      const targetIndex = usePlayerStore.getState().currentIndex;
      player.skipTo(targetIndex);

      isHydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // Sync Status and Handle Track Changes
  useEffect(() => {
    setPlaybackStatus(status);

    // Sync current track from native index
    const queue = usePlayerStore.getState().queue;
    const currentTrackFromQueue = queue[status.currentIndex];
    if (
      currentTrackFromQueue &&
      currentTrackFromQueue.id !== currentTrack?.id
    ) {
      usePlayerStore.setState({
        currentTrack: currentTrackFromQueue,
        currentIndex: status.currentIndex,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!fontsLoaded) return null;

  const isDetailScreen =
    pathname === "/player" ||
    pathname === "/search" ||
    pathname.startsWith("/collection/") ||
    pathname.startsWith("/playlists/");

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-darker">
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: THEME.darker },
              headerTintColor: THEME.white,
              headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
              contentStyle: { backgroundColor: THEME.darker },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="index"
              options={{ title: "Archive Audio", headerShown: false }}
            />
            <Stack.Screen
              name="search"
              options={{
                headerShown: false,
                presentation: "fullScreenModal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="library"
              options={{ title: "My Library", headerShown: false }}
            />
            <Stack.Screen
              name="stats"
              options={{ title: "Insights", headerShown: false }}
            />
            <Stack.Screen
              name="playlists/index"
              options={{ title: "Playlists", headerShown: false }}
            />
            <Stack.Screen
              name="playlists/[id]"
              options={{
                title: "Playlist",
                headerShown: false,
                animation: "slide_from_bottom",
                presentation: "fullScreenModal",
              }}
            />
            <Stack.Screen
              name="collection/[id]"
              options={{
                title: "Collection",
                headerShown: false,
                animation: "slide_from_bottom",
                presentation: "fullScreenModal",
              }}
            />
            <Stack.Screen
              name="player"
              options={{
                headerShown: false,
                animation: "slide_from_bottom",
                presentation: "fullScreenModal",
              }}
            />
          </Stack>
          {!isDetailScreen && <MiniPlayer />}
          {!isDetailScreen && <BottomNav />}
          <PlaylistSelector
            visible={selectorVisible}
            track={trackToSelect}
            onClose={closeSelector}
          />
        </View>
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

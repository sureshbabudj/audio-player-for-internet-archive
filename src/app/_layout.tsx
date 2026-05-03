import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PlaylistSelector } from "@/components/PlaylistSelector";
import { RightSidebar } from "@/components/RightSidebar";
import { Sidebar } from "@/components/Sidebar";
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
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useInitializePlayer } from "@/store/usePlayerStore";
import { setAudioModeAsync } from "expo-audio";
import "./global.css";

export default function RootLayout() {
  const pathname = usePathname();
  const selectorVisible = usePlaylistStore((state) => state.selectorVisible);
  const trackToSelect = usePlaylistStore((state) => state.trackToSelect);
  const closeSelector = usePlaylistStore((state) => state.closeSelector);

  // Initialize and sync the global audio player
  useInitializePlayer();

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

  // Configure audio session for background playback
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(console.error);
  }, []);

  if (!fontsLoaded) return null;

  const isDetailScreen =
    pathname === "/player" ||
    pathname === "/search" ||
    pathname.startsWith("/collection/") ||
    pathname.startsWith("/playlists/");

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-darker flex-row">
          {/* Sidebar - only on large screens */}
          <View className="hidden md:flex w-[280px]">
            <Sidebar />
          </View>

          <View className="flex-1 overflow-hidden flex-row bg-darker md:m-4 md:rounded-[40px] md:border md:border-white/5 md:bg-dark">
            <View className="flex-1">
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: THEME.darker,
                  },
                  headerTintColor: THEME.white,
                  headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
                  contentStyle: { backgroundColor: "transparent" },
                  animation: "slide_from_right",
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    title: "Archive Audio",
                    headerShown: false,
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="search"
                  options={{
                    headerShown: false,
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="library"
                  options={{
                    title: "My Library",
                    headerShown: false,
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="stats"
                  options={{
                    title: "Insights",
                    headerShown: false,
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    title: "Settings",
                    headerShown: false,
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="playlists/index"
                  options={{
                    title: "Playlists",
                    headerShown: false,
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="playlists/[id]"
                  options={{
                    title: "Playlist",
                    headerShown: false,
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="collection/[id]"
                  options={{
                    title: "Collection",
                    headerShown: false,
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="player"
                  options={{
                    headerShown: false,
                    animation: "slide_from_bottom",
                  }}
                />
              </Stack>
            </View>

            <View className="hidden xl:flex w-[350px] border-l border-white/5">
              <RightSidebar />
            </View>
          </View>

          {/* Mobile Navigation */}
          <View
            className="md:hidden absolute bottom-0 left-0 right-0"
            style={{ zIndex: isDetailScreen ? -1 : 1 }}
          >
            <MiniPlayer />
            <BottomNav />
          </View>

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

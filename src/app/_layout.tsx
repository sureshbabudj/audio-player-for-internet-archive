import { MiniPlayer } from "@/components/MiniPlayer";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "./global.css";

export default function RootLayout() {
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

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-darker">
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#080814" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
            contentStyle: { backgroundColor: "#080814" },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ title: "Archive Audio", headerShown: false }}
          />
          <Stack.Screen
            name="search"
            options={{
              title: "Search Archive.org",
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen name="library" options={{ title: "My Library" }} />
          <Stack.Screen
            name="playlists/index"
            options={{ title: "Playlists" }}
          />
          <Stack.Screen name="playlists/[id]" options={{ title: "Playlist" }} />
          <Stack.Screen
            name="player"
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
              presentation: "fullScreenModal",
            }}
          />
        </Stack>
        <MiniPlayer />
      </View>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

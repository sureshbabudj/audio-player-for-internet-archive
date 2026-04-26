import { THEME } from "@/constants/colors";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pause, Play, SkipForward } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function MiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, togglePlayPause, skipNext } =
    usePlayerStore();

  if (!currentTrack) return null;

  return (
    <View
      className="absolute left-0 right-0 px-6"
      style={{ bottom: insets.bottom + 80 }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/player" as any)}
        className="bg-surface/90 border border-white/10 rounded-[28px] overflow-hidden"
      >
        <View className="flex-row items-center px-4 py-3">
          {/* Thumbnail */}
          <View className="w-12 h-12 rounded-xl overflow-hidden mr-3 bg-surface-light">
            <Image
              source={{
                uri:
                  currentTrack.thumbnail ||
                  `https://archive.org/services/img/${currentTrack.identifier}`,
              }}
              placeholder={require("../../assets/images/splash-icon-dark.png")}
              className="w-full h-full"
              contentFit="cover"
              transition={200}
            />
          </View>

          {/* Info */}
          <View className="flex-1 mr-3">
            <View className="flex-row items-center">
              <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                {currentTrack.title}
              </Text>
            </View>
            <Text className="text-white/50 font-body text-xs" numberOfLines={1}>
              {currentTrack.creator || "Unknown Artist"}
            </Text>
          </View>

          {/* Controls */}
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              {isPlaying ? (
                <Pause size={24} color={THEME.white} fill={THEME.white} />
              ) : (
                <Play size={24} color={THEME.white} fill={THEME.white} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                skipNext();
              }}
            >
              <SkipForward size={24} color={THEME.white} fill={THEME.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

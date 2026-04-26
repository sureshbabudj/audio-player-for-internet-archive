import { THEME } from "@/constants/colors";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useRouter } from "expo-router";
import { Pause, Play, SkipForward } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function MiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);
  const skipNext = usePlayerStore((state) => state.skipNext);

  if (!currentTrack) return null;

  return (
    <View
      className="absolute left-0 right-0 px-0"
      style={{ bottom: insets.bottom + 70 }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/player" as any)}
        className="bg-darker border-t border-surface overflow-hidden"
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
              className="w-full h-full object-cover"
            />
          </View>

          {/* Info */}
          <View className="flex-1 mr-3">
            <View className="flex-row items-center">
              <Text
                className="text-white font-semibold text-sm"
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
            </View>
            <Text className="text-white/50 font-body text-xs" numberOfLines={1}>
              {currentTrack.creator || "Unknown Artist"}
            </Text>
          </View>

          {/* Controls */}
          <View className="flex-row items-center gap-x-2">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              <View className="rounded-full bg-primary/10 p-3">
                {isPlaying ? (
                  <Pause size={18} color={THEME.white} fill={THEME.white} />
                ) : (
                  <Play size={18} color={THEME.white} fill={THEME.white} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                skipNext();
              }}
            >
              <View className="rounded-full bg-primary/10 p-3">
                <SkipForward size={18} color={THEME.white} fill={THEME.white} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

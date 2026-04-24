import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useRouter } from "expo-router";
import { Heart, Pause, Play, SkipForward } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { WaveAnimation } from "./WaveAnimation";

export function MiniPlayer() {
  const router = useRouter();
  const { currentTrack, isPlaying, togglePlayPause, skipNext } =
    usePlayerStore();
  const { isInLibrary, addToLibrary, removeFromLibrary } = useLibraryStore();

  if (!currentTrack) return null;

  const saved = isInLibrary(currentTrack.id);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/player" as any)}
      className="absolute bottom-0 left-0 right-0 bg-surface border-t border-white/10"
    >
      <View className="flex-row items-center px-4 py-3">
        {/* Waveform */}
        <View className="mr-3">
          <WaveAnimation size="small" />
        </View>

        {/* Info */}
        <View className="flex-1 mr-3">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text className="text-white/50 font-body text-xs" numberOfLines={1}>
            {currentTrack.creator || "Unknown"}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (saved) removeFromLibrary(currentTrack.id);
              else addToLibrary(currentTrack);
            }}
          >
            <Heart
              size={20}
              color={saved ? "#FF6B35" : "#fff"}
              fill={saved ? "#FF6B35" : "none"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
          >
            {isPlaying ? (
              <Pause size={18} color="#fff" fill="#fff" />
            ) : (
              <Play size={18} color="#fff" fill="#fff" className="ml-0.5" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              skipNext();
            }}
          >
            <SkipForward size={20} color="#fff" fill="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/utils/time";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  Gauge,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WaveAnimation } from "./WaveAnimation";

export function AudioPlayer() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    repeatMode,
    isShuffled,
    volume,
    playbackSpeed,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    setRepeatMode,
    toggleShuffle,
    setVolume,
    setPlaybackSpeed,
  } = usePlayerStore();

  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibraryStore();
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);

  if (!currentTrack) return null;

  const saved = isInLibrary(currentTrack.id);

  const toggleSave = () => {
    if (saved) {
      removeFromLibrary(currentTrack.id);
    } else {
      addToLibrary(currentTrack);
    }
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <View className="flex-1 bg-darker px-6 pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-8">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronDown size={28} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white/60 font-medium text-sm uppercase tracking-widest">
          Now Playing
        </Text>
        <TouchableOpacity onPress={() => router.push("/playlists" as any)}>
          <ListMusic size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Wave Animation */}
      <View className="items-center justify-center mb-8">
        <WaveAnimation size="large" />
      </View>

      {/* Track Info */}
      <View className="mb-8">
        <Text
          className="text-white font-display text-2xl mb-2"
          numberOfLines={2}
        >
          {currentTrack.title}
        </Text>
        <Text className="text-white/60 font-body text-lg">
          {currentTrack.creator || "Unknown Artist"}
        </Text>
        {currentTrack.collection && (
          <Text className="text-primary font-medium text-sm mt-1">
            {currentTrack.collection[0]}
          </Text>
        )}
      </View>

      {/* Progress */}
      <View className="mb-6">
        <Slider
          value={position}
          minimumValue={0}
          maximumValue={duration || 1}
          minimumTrackTintColor="#FF6B35"
          maximumTrackTintColor="#252542"
          thumbTintColor="#FF6B35"
          onSlidingComplete={(value) => seekTo(value)}
        />
        <View className="flex-row justify-between mt-1">
          <Text className="text-white/40 font-body text-xs">
            {formatTime(position)}
          </Text>
          <Text className="text-white/40 font-body text-xs">
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-between mb-8">
        <TouchableOpacity onPress={toggleShuffle}>
          <Shuffle
            size={22}
            color={isShuffled ? "#FF6B35" : "#fff"}
            opacity={isShuffled ? 1 : 0.6}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={skipPrevious}>
          <SkipBack size={32} color="#fff" fill="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          className="w-20 h-20 rounded-full bg-primary items-center justify-center"
          style={styles.playButton}
        >
          {isPlaying ? (
            <Pause size={32} color="#fff" fill="#fff" />
          ) : (
            <Play
              size={32}
              color="#fff"
              fill="#fff"
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={skipNext}>
          <SkipForward size={32} color="#fff" fill="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setRepeatMode(
              repeatMode === "off"
                ? "all"
                : repeatMode === "all"
                  ? "one"
                  : "off",
            )
          }
        >
          <Repeat
            size={22}
            color={repeatMode !== "off" ? "#FF6B35" : "#fff"}
            opacity={repeatMode !== "off" ? 1 : 0.6}
          />
          {repeatMode === "one" && (
            <Text className="absolute -top-1 -right-1 text-primary text-[10px] font-bold">
              1
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View className="flex-row items-center justify-between px-4">
        <TouchableOpacity onPress={toggleSave}>
          <Heart
            size={24}
            color={saved ? "#FF6B35" : "#fff"}
            fill={saved ? "#FF6B35" : "none"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowSpeedOptions(!showSpeedOptions)}
        >
          <View className="flex-row items-center">
            <Gauge size={22} color="#fff" />
            <Text className="text-white font-bold text-sm ml-1">
              {playbackSpeed}x
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity>
          <Share2 size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Speed Options */}
      {showSpeedOptions && (
        <View className="flex-row justify-center mt-4 space-x-3">
          {speeds.map((speed) => (
            <TouchableOpacity
              key={speed}
              onPress={() => {
                setPlaybackSpeed(speed);
                setShowSpeedOptions(false);
              }}
              className={`px-4 py-2 rounded-full ${
                playbackSpeed === speed ? "bg-primary" : "bg-surface"
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  playbackSpeed === speed ? "text-white" : "text-white/60"
                }`}
              >
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Volume */}
      <View className="mt-6 flex-row items-center px-2">
        <Volume2 size={18} color="#fff" opacity={0.6} />
        <Slider
          value={volume}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#FF6B35"
          maximumTrackTintColor="#252542"
          thumbTintColor="#FF6B35"
          onValueChange={(value) => setVolume(value)}
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playButton: {
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

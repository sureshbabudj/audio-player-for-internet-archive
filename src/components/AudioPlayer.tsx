import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/utils/time";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  Globe,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AudioPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    queue,
    queueTitle,
    currentIndex,
    isPlaying,
    isBuffering,
    position,
    duration,
    repeatMode,
    isShuffled,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    setRepeatMode,
    toggleShuffle,
    playFromQueue,
  } = usePlayerStore();

  const { addToLibrary, removeFromLibrary, isInLibrary, toggleLike, isLiked } =
    useLibraryStore();

  const [slidingPosition, setSlidingPosition] = React.useState<number | null>(
    null,
  );
  const [showQueue, setShowQueue] = React.useState(false);

  if (!currentTrack) return null;

  const saved = isInLibrary(currentTrack.id);
  const liked = isLiked(currentTrack.id);

  const handleToggleLike = () => {
    toggleLike(currentTrack.id);
  };

  const displayPosition = slidingPosition !== null ? slidingPosition : position;

  return (
    <View
      className="flex-1 bg-darker"
      style={{
        paddingTop: Math.max(insets.top, 20),
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronDown size={28} color="#fff" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            Playing From
          </Text>
          <Text
            className="text-white font-display text-base text-primary"
            numberOfLines={1}
          >
            {queueTitle || "Now Playing"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowQueue(!showQueue)}>
          <ListMusic size={24} color={showQueue ? "#FF6B35" : "#fff"} />
        </TouchableOpacity>
      </View>

      {!showQueue ? (
        <View className="flex-1">
          {/* Album Art Carousel Effect */}
          <View className="flex-1 items-center justify-center my-4">
            <View className="w-[80%] aspect-square rounded-[40px] overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-surface-light">
              <Image
                source={{
                  uri:
                    currentTrack.thumbnail ||
                    `https://archive.org/services/img/${currentTrack.identifier}`,
                }}
                className="w-full h-full"
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
              {isBuffering && (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <Zap size={48} color="#FF6B35" />
                </View>
              )}
            </View>
          </View>

          {/* Track Info & Like */}
          <View className="px-8 mb-6 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text
                className="text-white font-display text-2xl mb-1"
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
              <Text
                className="text-white/50 font-body text-lg"
                numberOfLines={1}
              >
                {currentTrack.creator || "Unknown Artist"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleToggleLike}>
              <Heart
                size={28}
                color={liked ? "#FF6B35" : "#fff"}
                fill={liked ? "#FF6B35" : "none"}
                opacity={liked ? 1 : 0.6}
              />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View className="px-8 mb-4">
            <Slider
              value={displayPosition}
              minimumValue={0}
              maximumValue={duration || 1}
              minimumTrackTintColor="#FF6B35"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#fff"
              onValueChange={(value) => setSlidingPosition(value)}
              onSlidingComplete={async (value) => {
                setSlidingPosition(null);
                await seekTo(value);
              }}
              style={{ height: 40, marginHorizontal: -10 }}
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-white/40 font-body text-[10px] font-medium">
                {formatTime(displayPosition)}
              </Text>
              <Text className="text-white/40 font-body text-[10px] font-medium">
                {formatTime(duration)}
              </Text>
            </View>
          </View>

          {/* Main Controls */}
          <View className="flex-row items-center justify-between px-10 mb-8">
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
              className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-lg shadow-white/20"
            >
              {isPlaying ? (
                <Pause size={36} color="#000" fill="#000" />
              ) : (
                <Play
                  size={36}
                  color="#000"
                  fill="#000"
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
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-1 px-6">
          <Text className="text-white font-display text-xl mb-4">Up Next</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {queue.map((track, index) => {
              const isPlayingTrack = index === currentIndex;
              return (
                <TouchableOpacity
                  key={`${track.id}-${index}`}
                  onPress={() => playFromQueue(index)}
                  className={`flex-row items-center p-3 mb-2 rounded-2xl ${
                    isPlayingTrack
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-surface"
                  }`}
                >
                  <View className="w-10 h-10 rounded-lg bg-surface-light items-center justify-center mr-3 overflow-hidden">
                    <Image
                      source={{
                        uri:
                          track.thumbnail ||
                          `https://archive.org/services/img/${track.identifier}`,
                      }}
                      className="w-full h-full"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-semibold text-sm ${
                        isPlayingTrack ? "text-primary" : "text-white"
                      }`}
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text className="text-white/40 text-xs" numberOfLines={1}>
                      {track.creator}
                    </Text>
                  </View>
                  {isPlayingTrack && <Zap size={14} color="#FF6B35" />}
                </TouchableOpacity>
              );
            })}
            <View className="h-32" />
          </ScrollView>
        </View>
      )}

      {/* Footer / Device Selector Placeholder */}
      <View
        className="px-10 flex-row items-center justify-center"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <TouchableOpacity className="flex-row items-center bg-surface px-4 py-2 rounded-full">
          <Globe size={14} color="#FF6B35" />
          <Text className="text-white/60 text-xs font-medium ml-2">
            Archive Audio Player
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

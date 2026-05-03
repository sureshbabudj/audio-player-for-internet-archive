import { TrackItem } from "@/components/TrackItem";
import { WaveAnimation } from "@/components/WaveAnimation";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import Slider from "@react-native-community/slider";
import { usePathname } from "expo-router";
import {
  ChevronLeft,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export function RightSidebar() {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    skipNext,
    skipPrevious,
    position,
    duration,
    isShuffled,
    repeatMode,
    toggleShuffle,
    setRepeatMode,
    seekTo,
    queue,
    currentIndex,
    playFromQueue,
  } = usePlayerStore();

  const pathname = usePathname();

  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const isPlayerPage = pathname.startsWith("/player") && isLargeScreen;

  const { likedTrackIds, toggleLike } = useLibraryStore();
  const isLiked = currentTrack
    ? likedTrackIds.includes(currentTrack.id)
    : false;

  const [slidingPosition, setSlidingPosition] = useState<number | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (
      (showQueue || isPlayerPage) &&
      flatListRef.current &&
      queue.length > currentIndex
    ) {
      // Small delay to ensure the list is rendered
      const timer = setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: currentIndex,
            animated: true,
            viewPosition: 0.5,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          // Ignore scroll errors
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, showQueue, isPlayerPage, queue.length]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const displayPosition = slidingPosition !== null ? slidingPosition : position;

  return (
    <View className="flex-1 bg-dark py-12 px-8">
      {currentTrack ? (
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center">
              {showQueue && (
                <TouchableOpacity
                  onPress={() => setShowQueue(false)}
                  className="mr-3"
                >
                  <ChevronLeft size={20} color={THEME.white} />
                </TouchableOpacity>
              )}
              <Text className="text-white/30 text-xs font-bold uppercase tracking-[3px]">
                {showQueue || isPlayerPage ? "Up Next" : "Now Playing"}
              </Text>
            </View>
            {!isPlayerPage && (
              <TouchableOpacity onPress={() => setShowQueue(!showQueue)}>
                <ListMusic
                  size={20}
                  color={showQueue ? THEME.primary : THEME.white}
                  opacity={showQueue ? 1 : 0.4}
                />
              </TouchableOpacity>
            )}
          </View>

          {!showQueue && !isPlayerPage ? (
            <View className="flex-1">
              <View className="mb-10">
                <View className="relative shadow-2xl shadow-black/50">
                  <Image
                    source={{
                      uri:
                        currentTrack.thumbnail ||
                        `https://archive.org/services/img/${currentTrack.identifier}`,
                    }}
                    className="w-full aspect-square rounded-[48px] border border-white/5"
                  />
                  <TouchableOpacity
                    onPress={() => toggleLike(currentTrack)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md items-center justify-center border border-white/10"
                  >
                    <Heart
                      size={24}
                      color={isLiked ? THEME.primary : THEME.white}
                      fill={isLiked ? THEME.primary : "transparent"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-10">
                <Text
                  className="text-white font-display text-3xl font-bold mb-2"
                  numberOfLines={2}
                >
                  {currentTrack.title}
                </Text>
                <Text
                  className="text-white/50 text-lg font-medium"
                  numberOfLines={1}
                >
                  {currentTrack.creator || "Unknown Artist"}
                </Text>
              </View>

              <View className="flex-1 justify-center py-4">
                <WaveAnimation size="large" height={80} />
              </View>

              <View className="mt-auto">
                {/* Seekbar */}
                <View className="mb-8">
                  <Slider
                    value={displayPosition}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    minimumTrackTintColor={THEME.primary}
                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                    thumbTintColor={THEME.white}
                    onValueChange={(value) => setSlidingPosition(value)}
                    onSlidingComplete={async (value) => {
                      await seekTo(value);
                      setSlidingPosition(null);
                    }}
                    style={{ height: 40, marginHorizontal: -10 }}
                  />
                  <View className="flex-row justify-between mt-1 px-1">
                    <Text className="text-white/30 text-xs font-medium">
                      {formatTime(displayPosition)}
                    </Text>
                    <Text className="text-white/30 text-xs font-medium">
                      {formatTime(duration)}
                    </Text>
                  </View>
                </View>

                {/* Controls */}
                <View className="flex-row items-center justify-between px-2 mb-6">
                  <TouchableOpacity onPress={toggleShuffle}>
                    <Shuffle
                      size={22}
                      color={isShuffled ? THEME.primary : THEME.white}
                      opacity={isShuffled ? 1 : 0.4}
                    />
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-x-8">
                    <TouchableOpacity onPress={skipPrevious}>
                      <SkipBack
                        size={28}
                        color={THEME.white}
                        fill={THEME.white}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={togglePlayPause}
                      className="w-20 h-20 rounded-full bg-primary items-center justify-center shadow-2xl shadow-primary/40"
                    >
                      {isPlaying ? (
                        <Pause
                          size={36}
                          color={THEME.white}
                          fill={THEME.white}
                        />
                      ) : (
                        <Play
                          size={36}
                          color={THEME.white}
                          fill={THEME.white}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={skipNext}>
                      <SkipForward
                        size={28}
                        color={THEME.white}
                        fill={THEME.white}
                      />
                    </TouchableOpacity>
                  </View>

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
                    {repeatMode === "one" ? (
                      <Repeat1 size={22} color={THEME.primary} />
                    ) : (
                      <Repeat
                        size={22}
                        color={
                          repeatMode !== "off" ? THEME.primary : THEME.white
                        }
                        opacity={repeatMode !== "off" ? 1 : 0.4}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={queue}
              keyExtractor={(track, index) => `${track.id}-${index}`}
              renderItem={({ item, index }) => (
                <TrackItem
                  track={item}
                  type="playlist"
                  isCurrent={index === currentIndex}
                  onPress={() => playFromQueue(index)}
                />
              )}
              getItemLayout={(data, index) => ({
                length: 80, // 72px item + 8px margin
                offset: 80 * index,
                index,
              })}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          )}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/20 text-sm font-medium">
            No track playing
          </Text>
        </View>
      )}
    </View>
  );
}

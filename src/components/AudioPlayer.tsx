import { TrackItem } from "@/components/TrackItem";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/utils/time";
import Slider from "@react-native-community/slider";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronDown,
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
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WaveAnimation } from "./WaveAnimation";

export function AudioPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const queue = usePlayerStore((state) => state.queue);
  const queueTitle = usePlayerStore((state) => state.queueTitle);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const isShuffled = usePlayerStore((state) => state.isShuffled);

  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);
  const skipNext = usePlayerStore((state) => state.skipNext);
  const skipPrevious = usePlayerStore((state) => state.skipPrevious);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const setRepeatMode = usePlayerStore((state) => state.setRepeatMode);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const playFromQueue = usePlayerStore((state) => state.playFromQueue);

  const liked = useLibraryStore((state) =>
    currentTrack ? state.likedTrackIds.includes(currentTrack.id) : false,
  );
  const { toggleLike } = useLibraryStore();

  const [slidingPosition, setSlidingPosition] = React.useState<number | null>(
    null,
  );
  const [showQueue, setShowQueue] = React.useState(false);

  if (!currentTrack) return null;

  const handleToggleLike = () => {
    toggleLike(currentTrack);
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
          <ChevronDown size={28} color={THEME.white} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            Playing From
          </Text>
          <Text
            className="font-display text-base text-primary"
            numberOfLines={1}
          >
            {queueTitle || "Now Playing"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowQueue(!showQueue)}>
          <ListMusic
            size={24}
            color={showQueue ? THEME.primary : THEME.white}
          />
        </TouchableOpacity>
      </View>

      {!showQueue ? (
        <View className="flex-1">
          {/* Album Art Section */}
          <View className="flex-1 items-center justify-center mt-4">
            <View className="w-[70%] aspect-square rounded-[40px] overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-surface-light mb-6">
              <Image
                source={{
                  uri:
                    currentTrack.thumbnail ||
                    `https://archive.org/services/img/${currentTrack.identifier}`,
                }}
                className="w-full h-full object-cover"
              />
              {isBuffering && (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <Zap size={48} color={THEME.primary} />
                </View>
              )}
            </View>

            {/* Visualizer */}
            <View className="h-[72px] items-center justify-center">
              {isPlaying && <WaveAnimation size="large" height={72} />}
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
                color={liked ? THEME.primary : THEME.white}
                fill={liked ? THEME.primary : "none"}
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
              minimumTrackTintColor={THEME.primary}
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor={THEME.white}
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
                color={isShuffled ? THEME.primary : THEME.white}
                opacity={isShuffled ? 1 : 0.6}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipPrevious}>
              <SkipBack size={32} color={THEME.white} fill={THEME.white} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-lg shadow-white/20"
            >
              {isPlaying ? (
                <Pause size={36} color={THEME.darker} fill={THEME.darker} />
              ) : (
                <Play
                  size={36}
                  color={THEME.darker}
                  fill={THEME.darker}
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={skipNext}>
              <SkipForward size={32} color={THEME.white} fill={THEME.white} />
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
                color={repeatMode !== "off" ? THEME.primary : THEME.white}
                opacity={repeatMode !== "off" ? 1 : 0.6}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-1 px-6">
          <Text className="text-white font-display text-xl mb-4">Up Next</Text>
          <FlatList
            data={queue}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item, index }) => (
              <TrackItem
                track={item}
                type="playlist"
                isCurrent={index === currentIndex}
                onPress={() => playFromQueue(index)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </View>
      )}

      {/* Footer / Device Selector Placeholder */}
      <View
        className="px-10 flex-row items-center justify-center"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <TouchableOpacity className="flex-row items-center bg-surface px-4 py-2 rounded-full">
          <ExpoImage
            source={require("../../assets/images/icon.svg")}
            style={{ width: 14, height: 14 }}
          />
          <Text className="text-white/60 text-xs font-medium ml-2">
            ArchiPlay
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

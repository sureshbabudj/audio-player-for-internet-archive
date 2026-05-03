import { TrackItem } from "@/components/TrackItem";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatTime } from "@/utils/time";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Moon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const sleepTimer = usePlayerStore((state) => state.sleepTimer);

  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);
  const skipNext = usePlayerStore((state) => state.skipNext);
  const skipPrevious = usePlayerStore((state) => state.skipPrevious);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const setRepeatMode = usePlayerStore((state) => state.setRepeatMode);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const playFromQueue = usePlayerStore((state) => state.playFromQueue);
  const setSleepTimer = usePlayerStore((state) => state.setSleepTimer);

  const liked = useLibraryStore((state) =>
    currentTrack ? state.likedTrackIds.includes(currentTrack.id) : false,
  );
  const { toggleLike } = useLibraryStore();

  const [slidingPosition, setSlidingPosition] = React.useState<number | null>(
    null,
  );
  const [showQueue, setShowQueue] = React.useState(false);
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (showQueue && flatListRef.current && queue.length > currentIndex) {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: currentIndex,
            animated: true,
            viewPosition: 0.5,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Ignore scroll errors if item is not yet rendered
        }
      }, 100);
    }
  }, [showQueue, currentIndex, queue.length]);

  if (!currentTrack) return null;

  const handleToggleLike = () => {
    toggleLike(currentTrack);
  };

  const handleSleepTimerPress = () => {
    Alert.alert(
      "Sleep Timer",
      sleepTimer
        ? `Timer active: ${sleepTimer} minutes remaining.`
        : "Select duration:",
      [
        {
          text: "Off",
          onPress: () => setSleepTimer(null),
          style: "destructive",
        },
        { text: "1 Minutes", onPress: () => setSleepTimer(1) },
        { text: "15 Minutes", onPress: () => setSleepTimer(15) },
        { text: "30 Minutes", onPress: () => setSleepTimer(30) },
        { text: "45 Minutes", onPress: () => setSleepTimer(45) },
        { text: "60 Minutes", onPress: () => setSleepTimer(60) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const displayPosition = slidingPosition !== null ? slidingPosition : position;

  const content = (
    <View
      className="flex-1 bg-darker md:pt-0 md:w-[500px] md:h-[90%] md:rounded-[48px] md:border md:border-white/5 md:shadow-2xl md:overflow-hidden"
      style={{
        paddingTop: Platform.OS === "web" ? 0 : Math.max(insets.top, 20),
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-6">
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
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleSleepTimerPress} className="mr-4">
            <View>
              <Moon
                size={22}
                color={sleepTimer ? THEME.primary : THEME.white}
                opacity={sleepTimer ? 1 : 0.6}
              />
              {sleepTimer && (
                <View className="absolute -top-1.5 -right-1.5 bg-primary rounded-full w-4 h-4 items-center justify-center">
                  <Text className="text-[8px] text-darker font-bold">
                    {sleepTimer}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowQueue(!showQueue)}>
            <ListMusic
              size={24}
              color={showQueue ? THEME.primary : THEME.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {!showQueue ? (
        <View className="flex-1">
          {/* Album Art Section */}
          <View className="flex-1 items-center justify-center mt-4">
            <View className="w-[75%] aspect-square md:w-[380px] md:h-[380px] rounded-[48px] overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-surface-light mb-8">
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
                await seekTo(value);
                // Slight delay before clearing sliding position to mask native seek latency
                setTimeout(() => setSlidingPosition(null), 100);
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
              {isBuffering ? (
                <ActivityIndicator size="large" color={THEME.darker} />
              ) : isPlaying ? (
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
              {repeatMode === "one" ? (
                <Repeat1 size={22} color={THEME.primary} opacity={1} />
              ) : (
                <Repeat
                  size={22}
                  color={repeatMode !== "off" ? THEME.primary : THEME.white}
                  opacity={repeatMode !== "off" ? 1 : 0.6}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-1 px-6">
          <Text className="text-white font-display text-xl mb-4">Up Next</Text>
          <FlatList
            ref={flatListRef}
            data={queue}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            getItemLayout={(data, index) => ({
              length: 80, // 72px item + 8px margin
              offset: 80 * index,
              index,
            })}
            initialScrollIndex={queue.length > currentIndex ? currentIndex : 0}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise((resolve) => setTimeout(resolve, 100));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              });
            }}
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
    </View>
  );

  return (
    <View className="flex-1 md:justify-center md:items-center md:bg-dark md:py-4">
      {content}
    </View>
  );
}

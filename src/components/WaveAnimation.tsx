import { usePlayerStore } from "@/store/usePlayerStore";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const BAR_COUNT = 24;

export function WaveAnimation({
  size = "large",
}: {
  size?: "small" | "large";
}) {
  const { isPlaying } = usePlayerStore();
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i);

  const getBarHeight = (index: number) => {
    const base = size === "large" ? 60 : 20;
    return (
      base +
      Math.sin((index / BAR_COUNT) * Math.PI * 2) * (size === "large" ? 40 : 10)
    );
  };

  return (
    <View style={[styles.container, size === "small" && styles.smallContainer]}>
      {bars.map((i) => (
        <WaveBar
          key={i}
          index={i}
          isPlaying={isPlaying}
          maxHeight={getBarHeight(i)}
          size={size}
        />
      ))}
    </View>
  );
}

function WaveBar({
  index,
  isPlaying,
  maxHeight,
  size,
}: {
  index: number;
  isPlaying: boolean;
  maxHeight: number;
  size: string;
}) {
  const height = useSharedValue(4);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isPlaying) {
      const delay = index * 50;
      height.value = withRepeat(
        withTiming(maxHeight, {
          duration: 600 + Math.random() * 400,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
      opacity.value = withRepeat(withTiming(1, { duration: 500 }), -1, true);
    } else {
      height.value = withSpring(4);
      opacity.value = withTiming(0.6);
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  const colors = ["#FF6B35", "#F7931E", "#004E89", "#1A659E"];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          width: size === "large" ? 6 : 3,
          marginHorizontal: size === "large" ? 3 : 1.5,
          borderRadius: size === "large" ? 3 : 1.5,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  smallContainer: {
    height: 40,
  },
  bar: {
    borderRadius: 4,
  },
});

import { THEME } from "@/constants/colors";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronDown, MoreVertical, Search } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title?: string;
  type?: "main" | "detail";
  onMorePress?: () => void;
  showSearch?: boolean;
}

export function ScreenHeader({
  title,
  type = "main",
  onMorePress,
  showSearch = true,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (type === "main") {
    return (
      <View
        className="flex-row items-center justify-between px-6 pb-4 bg-darker"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-primary/20 rounded-xl items-center justify-center mr-3">
            <Image
              source={require("../../assets/images/icon.svg")}
              style={{ width: 24, height: 24 }}
            />
          </View>
          <Text className="text-white font-display text-2xl font-bold tracking-tight">
            ArchiPlay
          </Text>
        </View>

        {showSearch && (
          <TouchableOpacity
            onPress={() => router.push("/search" as any)}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5"
          >
            <Search size={22} color={THEME.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center justify-between px-4 pb-4 bg-darker"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        className="w-10 h-10 items-center justify-center rounded-full"
      >
        <ChevronDown size={28} color={THEME.white} />
      </TouchableOpacity>

      <View className="flex-1 items-center px-4">
        <Text
          className="text-white font-display text-lg font-bold"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onMorePress}
        className="w-10 h-10 items-center justify-center rounded-full"
      >
        <MoreVertical size={22} color={THEME.white} />
      </TouchableOpacity>
    </View>
  );
}

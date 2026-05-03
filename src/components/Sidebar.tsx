import { THEME } from "@/constants/colors";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePathname, useRouter } from "expo-router";
import {
  ChartNoAxesCombined,
  Home,
  Library,
  ListMusic,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);
  const skipNext = usePlayerStore((state) => state.skipNext);
  const skipPrevious = usePlayerStore((state) => state.skipPrevious);

  const navItems = [
    { icon: Home, route: "/", label: "Explore" },
    { icon: Library, route: "/library", label: "Library" },
    { icon: ListMusic, route: "/playlists", label: "Playlists" },
    { icon: ChartNoAxesCombined, route: "/stats", label: "Insights" },
    { icon: Settings, route: "/settings", label: "Settings" },
  ];

  return (
    <View className="flex-1 bg-darker border-r border-white/5 py-10 px-8">
      <Text className="text-white/20 text-[11px] font-bold uppercase tracking-[3px] mb-6 px-1">
        Main Menu
      </Text>

      {/* Navigation */}
      <View className="flex-1">
        {navItems.map((item, index) => {
          const isActive =
            pathname === item.route ||
            (item.route === "/" && pathname === "/index");

          return (
            <TouchableOpacity
              key={index}
              onPress={() => router.replace(item.route as any)}
              className={`flex-row items-center py-3.5 px-4 rounded-2xl mb-2 ${
                isActive ? "bg-primary/20" : ""
              }`}
            >
              <item.icon
                size={20}
                color={isActive ? THEME.primary : THEME.white}
                opacity={isActive ? 1 : 0.5}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                className={`ml-4 font-semibold text-sm ${
                  isActive ? "text-primary" : "text-white/50"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sidebar Player Card - Simple version, only visible when RightSidebar is hidden */}
      {currentTrack && (
        <View className="mt-auto pt-8 xl:hidden">
          <View className="bg-surface rounded-2xl p-4 border border-white/5 shadow-xl">
            <TouchableOpacity
              onPress={() => router.push("/player" as any)}
              activeOpacity={0.7}
            >
              <Text
                className="text-white font-bold text-sm mb-4 px-1"
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between px-1">
              <TouchableOpacity onPress={skipPrevious}>
                <SkipBack
                  size={20}
                  color={THEME.white}
                  opacity={0.6}
                  fill={THEME.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                className="w-10 h-10 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/40"
              >
                {isPlaying ? (
                  <Pause size={18} color={THEME.white} fill={THEME.white} />
                ) : (
                  <Play size={18} color={THEME.white} fill={THEME.white} />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={skipNext}>
                <SkipForward
                  size={20}
                  color={THEME.white}
                  opacity={0.6}
                  fill={THEME.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

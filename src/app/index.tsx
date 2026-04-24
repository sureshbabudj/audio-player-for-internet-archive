import { WaveAnimation } from "@/components/WaveAnimation";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { useRouter } from "expo-router";
import {
  Clock,
  Heart,
  Library,
  ListMusic,
  Music,
  Radio,
  Search,
} from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { savedTracks, recentlyPlayed } = useLibraryStore();
  const { playlists } = usePlaylistStore();

  const quickActions = [
    {
      icon: Search,
      label: "Search",
      color: "#FF6B35",
      onPress: () => router.push("/search" as any),
    },
    {
      icon: Library,
      label: "Library",
      color: "#004E89",
      onPress: () => router.push("/library" as any),
    },
    {
      icon: ListMusic,
      label: "Playlists",
      color: "#7209B7",
      onPress: () => router.push("/playlists" as any),
    },
    {
      icon: Heart,
      label: "Liked",
      color: "#F72585",
      onPress: () => router.push("/library" as any),
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-darker"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-6 pt-14 pb-6">
        <Text className="text-white/60 font-medium text-sm uppercase tracking-widest mb-2">
          Archive Audio
        </Text>
        <Text className="text-white font-display text-4xl">Discover</Text>
      </View>

      {/* Wave Animation */}
      <View className="items-center mb-8">
        <WaveAnimation size="large" />
      </View>

      {/* Quick Actions */}
      <View className="flex-row flex-wrap px-4 mb-8">
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            onPress={action.onPress}
            className="w-[48%] m-1 p-4 rounded-2xl bg-surface flex-row items-center"
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: action.color + "20" }}
            >
              <action.icon size={20} color={action.color} />
            </View>
            <Text className="text-white font-semibold">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View className="px-6 mb-8">
        <Text className="text-white font-display text-xl mb-4">Your Stats</Text>
        <View className="flex-row space-x-4">
          <View className="flex-1 bg-surface p-4 rounded-2xl">
            <Music size={20} color="#FF6B35" />
            <Text className="text-white font-display text-2xl mt-2">
              {savedTracks.length}
            </Text>
            <Text className="text-white/50 font-body text-xs">
              Saved Tracks
            </Text>
          </View>
          <View className="flex-1 bg-surface p-4 rounded-2xl">
            <ListMusic size={20} color="#004E89" />
            <Text className="text-white font-display text-2xl mt-2">
              {playlists.length}
            </Text>
            <Text className="text-white/50 font-body text-xs">Playlists</Text>
          </View>
          <View className="flex-1 bg-surface p-4 rounded-2xl">
            <Clock size={20} color="#7209B7" />
            <Text className="text-white font-display text-2xl mt-2">
              {recentlyPlayed.length}
            </Text>
            <Text className="text-white/50 font-body text-xs">Recent</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      {recentlyPlayed.length > 0 && (
        <View className="px-6 mb-8">
          <Text className="text-white font-display text-xl mb-4">
            Recently Played
          </Text>
          {recentlyPlayed.slice(0, 3).map((track) => (
            <TouchableOpacity
              key={track.id}
              onPress={() => router.push("/player" as any)}
              className="flex-row items-center p-3 mb-2 bg-surface rounded-xl"
            >
              <View className="w-10 h-10 rounded-lg bg-surface-light items-center justify-center mr-3">
                <Radio size={16} color="#FF6B35" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-white font-medium text-sm"
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <Text className="text-white/50 text-xs">{track.creator}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

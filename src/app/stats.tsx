import { TrackList } from "@/components/TrackList";
import { useLibraryStore } from "@/store/useLibraryStore";
import {
  BarChart2,
  Heart,
  Music,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"stats" | "liked">("stats");
  const { collections, playCounts, recentlyPlayed, isLiked } =
    useLibraryStore();

  const allTracks = useMemo(
    () => collections.flatMap((c) => c.tracks),
    [collections],
  );

  const likedTracks = useMemo(
    () => allTracks.filter((t) => isLiked(t.id)),
    [allTracks, isLiked],
  );

  const stats = useMemo(() => {
    // Top Artists
    const artistCounts: Record<string, number> = {};
    allTracks.forEach((t) => {
      const artist = t.creator || "Unknown Artist";
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    });
    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Top Played
    const topPlayed = recentlyPlayed
      .filter((t) => playCounts[t.id])
      .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
      .slice(0, 5);

    return { topArtists, topPlayed };
  }, [allTracks, playCounts, recentlyPlayed]);

  return (
    <View className="flex-1 bg-darker" style={{ paddingTop: insets.top }}>
      {/* Header Tabs */}
      <View className="flex-row px-6 py-4 border-b border-white/5">
        <TouchableOpacity
          onPress={() => setActiveTab("stats")}
          className={`flex-1 items-center pb-2 border-b-2 ${
            activeTab === "stats" ? "border-primary" : "border-transparent"
          }`}
        >
          <Text
            className={`font-display text-lg ${
              activeTab === "stats" ? "text-white" : "text-white/40"
            }`}
          >
            Insights
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("liked")}
          className={`flex-1 items-center pb-2 border-b-2 ${
            activeTab === "liked" ? "border-primary" : "border-transparent"
          }`}
        >
          <View className="flex-row items-center">
            <Text
              className={`font-display text-lg ${
                activeTab === "liked" ? "text-white" : "text-white/40"
              }`}
            >
              Liked
            </Text>
            {likedTracks.length > 0 && (
              <View className="bg-primary/20 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-primary text-[10px] font-bold">
                  {likedTracks.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === "stats" ? (
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards */}
          <View className="flex-row gap-x-4 mb-8">
            <View className="flex-1 bg-surface p-5 rounded-3xl border border-white/5">
              <View className="w-10 h-10 rounded-2xl bg-primary/20 items-center justify-center mb-3">
                <Music size={20} color="#FF6B35" />
              </View>
              <Text className="text-white font-display text-2xl">
                {allTracks.length}
              </Text>
              <Text className="text-white/40 text-xs font-body">
                Total Saved
              </Text>
            </View>
            <View className="flex-1 bg-surface p-5 rounded-3xl border border-white/5">
              <View className="w-10 h-10 rounded-2xl bg-blue-500/20 items-center justify-center mb-3">
                <TrendingUp size={20} color="#3b82f6" />
              </View>
              <Text className="text-white font-display text-2xl">
                {recentlyPlayed.length}
              </Text>
              <Text className="text-white/40 text-xs font-body">
                Recent Plays
              </Text>
            </View>
          </View>

          {/* Top Artists */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <Users size={18} color="#FF6B35" />
              <Text className="text-white font-display text-xl ml-2">
                Top Artists
              </Text>
            </View>
            {stats.topArtists.length > 0 ? (
              stats.topArtists.map(([artist, count], i) => (
                <View
                  key={artist}
                  className="flex-row items-center justify-between bg-surface/50 p-4 rounded-2xl mb-2 border border-white/5"
                >
                  <View className="flex-row items-center">
                    <Text className="text-primary font-bold mr-4">
                      #0{i + 1}
                    </Text>
                    <Text className="text-white font-semibold">{artist}</Text>
                  </View>
                  <Text className="text-white/40 text-xs">
                    {count} tracks saved
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-white/20 font-body text-center py-4">
                Add tracks to library to see stats
              </Text>
            )}
          </View>

          {/* Top Played */}
          <View className="mb-10">
            <View className="flex-row items-center mb-4">
              <BarChart2 size={18} color="#FF6B35" />
              <Text className="text-white font-display text-xl ml-2">
                Most Played
              </Text>
            </View>
            {stats.topPlayed.length > 0 ? (
              stats.topPlayed.map((track, i) => (
                <View
                  key={track.id}
                  className="flex-row items-center justify-between bg-surface/50 p-4 rounded-2xl mb-2 border border-white/5"
                >
                  <View className="flex-1 mr-4">
                    <Text
                      className="text-white font-semibold"
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text className="text-white/40 text-xs">
                      {track.creator}
                    </Text>
                  </View>
                  <View className="bg-primary/20 px-3 py-1 rounded-full">
                    <Text className="text-primary font-bold text-[10px]">
                      {playCounts[track.id]} Plays
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-white/20 font-body text-center py-4">
                No playback history yet
              </Text>
            )}
          </View>

          <View className="h-32" />
        </ScrollView>
      ) : (
        <View className="flex-1">
          {likedTracks.length === 0 ? (
            <View className="flex-1 items-center justify-center px-10">
              <Heart size={48} color="#FF6B35" opacity={0.2} />
              <Text className="text-white/40 font-body text-center mt-4">
                You haven't liked any songs yet. Tap the heart icon while
                playing a track to see it here.
              </Text>
            </View>
          ) : (
            <TrackList tracks={likedTracks} />
          )}
        </View>
      )}
    </View>
  );
}

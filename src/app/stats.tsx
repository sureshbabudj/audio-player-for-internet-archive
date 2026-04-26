import { ScreenHeader } from "@/components/ScreenHeader";
import { TrackItem } from "@/components/TrackItem";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import {
  BarChart2,
  Music,
  TrendingUp,
  Users,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

export default function StatsScreen() {
  const { collections, playCounts, recentlyPlayed } = useLibraryStore();
  const { loadTrack, currentTrack } = usePlayerStore();

  const allTracks = useMemo(
    () => collections.flatMap((c) => c.tracks),
    [collections],
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
    <View className="flex-1 bg-darker">
      <ScreenHeader type="main" />
      
      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View className="flex-row gap-x-4 mb-8">
          <View className="flex-1 bg-surface p-5 rounded-3xl border border-white/5">
            <View className="w-10 h-10 rounded-2xl bg-primary/20 items-center justify-center mb-3">
              <Music size={20} color={THEME.primary} />
            </View>
            <Text className="text-white font-display text-2xl">
              {allTracks.length}
            </Text>
            <Text className="text-white/40 text-[10px] font-body uppercase tracking-widest mt-1">
              Total Saved
            </Text>
          </View>
          <View className="flex-1 bg-surface p-5 rounded-3xl border border-white/5">
            <View className="w-10 h-10 rounded-2xl bg-blue-500/20 items-center justify-center mb-3">
              <TrendingUp size={20} color={THEME.secondary} />
            </View>
            <Text className="text-white font-display text-2xl">
              {recentlyPlayed.length}
            </Text>
            <Text className="text-white/40 text-[10px] font-body uppercase tracking-widest mt-1">
              Recent Plays
            </Text>
          </View>
        </View>

        {/* Top Artists */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Users size={18} color={THEME.primary} />
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
                  <Text className="text-white font-semibold text-sm">{artist}</Text>
                </View>
                <Text className="text-white/40 text-[10px]">
                  {count} tracks
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
            <BarChart2 size={18} color={THEME.primary} />
            <Text className="text-white font-display text-xl ml-2">
              Most Played
            </Text>
          </View>
          {stats.topPlayed.length > 0 ? (
            stats.topPlayed.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                type="mostly"
                playCount={playCounts[track.id]}
                onPress={() =>
                  loadTrack(track, stats.topPlayed, "Most Played")
                }
                isCurrent={currentTrack?.id === track.id}
              />
            ))
          ) : (
            <Text className="text-white/20 font-body text-center py-4">
              No playback history yet
            </Text>
          )}
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}

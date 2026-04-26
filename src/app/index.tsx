import { ScreenHeader } from "@/components/ScreenHeader";
import { TrackItem } from "@/components/TrackItem";
import { WaveAnimation } from "@/components/WaveAnimation";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { useRouter } from "expo-router";
import { ListMusic } from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { collections, recentlyPlayed, playCounts, likedTracks } =
    useLibraryStore();
  const { playlists } = usePlaylistStore();
  const { loadTrack, currentTrack } = usePlayerStore();

  const allTracks = useMemo(
    () => collections.flatMap((c) => c.tracks),
    [collections],
  );

  const mostlyPlayedTracks = useMemo(
    () =>
      allTracks
        .filter((t) => playCounts[t.id])
        .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
        .slice(0, 5),
    [allTracks, playCounts],
  );

  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="main" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 150,
        }}
      >
        {/* Wave Animation */}
        <View className="items-center mb-4">
          <WaveAnimation size="large" />
          {currentTrack && (
            <View className="flex-row items-center mt-4 bg-primary/10 px-4 py-2 overflow-hidden  rounded-full border border-primary/20">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
              <Text className="text-white/80 font-body text-[10px] font-bold uppercase tracking-widest mr-2">
                Now Playing
              </Text>
              <Text
                className="text-primary font-semibold text-xs overflow-hidden w-64"
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        {recentlyPlayed.length > 0 && (
          <View className="px-6 mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-display text-xl">
                Recently Played
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/library",
                    params: { tab: "recent" },
                  } as any)
                }
              >
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            {recentlyPlayed.slice(0, 5).map((track) => (
              <TrackItem
                key={`recent-${track.id}`}
                track={track}
                type="recent"
                isCurrent={currentTrack?.id === track.id}
                onPress={() => loadTrack(track, recentlyPlayed, "Recent Plays")}
              />
            ))}
          </View>
        )}

        {/* Playlists */}
        {playlists.length > 0 && (
          <View className="mb-8">
            <View className="px-6 flex-row items-center justify-between mb-4">
              <Text className="text-white font-display text-xl">
                My Playlists
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/playlists" as any)}
              >
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  onPress={() =>
                    router.push(`/playlists/${playlist.id}` as any)
                  }
                  className="mr-4 w-40"
                >
                  <View className="w-40 h-40 rounded-3xl bg-surface items-center justify-center mb-3 border border-white/5 overflow-hidden">
                    <ListMusic size={40} color={THEME.primary} opacity={0.5} />
                  </View>
                  <Text
                    className="text-white font-semibold text-sm"
                    numberOfLines={1}
                  >
                    {playlist.name}
                  </Text>
                  <Text className="text-white/40 text-xs">
                    {playlist.tracks.length} tracks
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mostly Played */}
        {mostlyPlayedTracks.length > 0 && (
          <View className="px-6 mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-display text-xl">
                Mostly Played
              </Text>
              <TouchableOpacity onPress={() => router.push("/stats" as any)}>
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                  Full Stats
                </Text>
              </TouchableOpacity>
            </View>
            {mostlyPlayedTracks.map((track) => (
              <TrackItem
                key={`top-${track.id}`}
                track={track}
                type="mostly"
                playCount={playCounts[track.id]}
                isCurrent={currentTrack?.id === track.id}
                onPress={() => loadTrack(track, allTracks, "Mostly Played")}
              />
            ))}
          </View>
        )}

        {/* Liked Tracks */}
        {likedTracks.length > 0 && (
          <View className="px-6 mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-display text-xl">Favorites</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/library",
                    params: { tab: "liked" },
                  } as any)
                }
              >
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            {likedTracks.slice(0, 5).map((track) => (
              <TrackItem
                key={`liked-${track.id}`}
                track={track}
                type="liked"
                isCurrent={currentTrack?.id === track.id}
                onPress={() => loadTrack(track, likedTracks, "Favorites")}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

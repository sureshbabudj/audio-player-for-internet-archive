import { WaveAnimation } from "@/components/WaveAnimation";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedTracks, recentlyPlayed, likedTrackIds, playCounts } =
    useLibraryStore();
  const { playlists } = usePlaylistStore();
  const { loadTrack, currentTrack } = usePlayerStore();

  const likedTracks = savedTracks.filter((t) => likedTrackIds.includes(t.id));

  return (
    <View className="flex-1 bg-darker">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: 150,
        }}
      >
        {/* Header */}
        <View className="px-6 pb-6">
          <Text className="text-white/60 font-medium text-xs uppercase tracking-widest mb-1">
            Audio player for Internet Archive
          </Text>
          <Text className="text-white font-display text-4xl">ArchiPlay</Text>
        </View>

        {/* Wave Animation */}
        <View className="items-center mb-4">
          <WaveAnimation size="large" />
          {currentTrack && (
            <View className="flex-row items-center mt-4 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
              <Text className="text-white/80 font-body text-[10px] font-bold uppercase tracking-widest mr-2">
                Now Playing
              </Text>
              <Text className="text-primary font-semibold text-xs" numberOfLines={1}>
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
              <TouchableOpacity
                key={`recent-${track.id}`}
                onPress={() => loadTrack(track, recentlyPlayed, "Recent Plays")}
                className="flex-row items-center p-3 mb-2 bg-surface rounded-2xl"
              >
                <View className="w-12 h-12 rounded-xl bg-surface-light items-center justify-center mr-4 overflow-hidden">
                  <Radio size={20} color="#FF6B35" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-semibold text-sm"
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text className="text-white/40 text-xs">{track.creator}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Playlists */}
        {playlists.length > 0 && (
          <View className="mb-8">
            <View className="px-6 flex-row items-center justify-between mb-4">
              <Text className="text-white font-display text-xl">My Playlists</Text>
              <TouchableOpacity onPress={() => router.push("/playlists" as any)}>
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
                  onPress={() => router.push(`/playlists/${playlist.id}` as any)}
                  className="mr-4 w-40"
                >
                  <View className="w-40 h-40 rounded-3xl bg-surface items-center justify-center mb-3 border border-white/5 overflow-hidden">
                    <ListMusic size={40} color="#7209B7" opacity={0.5} />
                  </View>
                  <Text className="text-white font-semibold text-sm" numberOfLines={1}>
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
        {Object.keys(playCounts).length > 0 && (
          <View className="px-6 mb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-display text-xl">Mostly Played</Text>
              <TouchableOpacity onPress={() => router.push("/stats" as any)}>
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">
                  Full Stats
                </Text>
              </TouchableOpacity>
            </View>
            {savedTracks
              .filter((t) => playCounts[t.id])
              .sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0))
              .slice(0, 5)
              .map((track) => (
                <TouchableOpacity
                  key={`top-${track.id}`}
                  onPress={() => loadTrack(track, savedTracks, "Mostly Played")}
                  className="flex-row items-center p-3 mb-2 bg-surface rounded-2xl"
                >
                  <View className="w-12 h-12 rounded-xl bg-surface-light items-center justify-center mr-4 overflow-hidden">
                    <Music size={20} color="#7209B7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text className="text-white/40 text-xs">{track.creator}</Text>
                  </View>
                  <View className="bg-primary/10 px-2 py-1 rounded-lg">
                    <Text className="text-primary text-[10px] font-bold">
                      {playCounts[track.id]}x
                    </Text>
                  </View>
                </TouchableOpacity>
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
              <TouchableOpacity
                key={`liked-${track.id}`}
                onPress={() => loadTrack(track, likedTracks, "Favorites")}
                className="flex-row items-center p-3 mb-2 bg-surface rounded-2xl"
              >
                <View className="w-12 h-12 rounded-xl bg-surface-light items-center justify-center mr-4 overflow-hidden">
                  <Heart size={20} color="#F72585" fill="#F72585" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text className="text-white/40 text-xs">{track.creator}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

import { TrackList } from "@/components/TrackList";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Play, Trash2 } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPlaylist, deletePlaylist, removeTrackFromPlaylist } =
    usePlaylistStore();
  const { loadTrack } = usePlayerStore();

  const playlist = getPlaylist(id as string);

  if (!playlist) {
    return (
      <View className="flex-1 bg-darker items-center justify-center">
        <Text className="text-white/40 font-body">Playlist not found</Text>
      </View>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      loadTrack(playlist.tracks[0], playlist.tracks, playlist.name);
    }
  };

  return (
    <View className="flex-1 bg-darker">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
        >
          <ArrowLeft size={20} color="#fff" />
          <Text className="text-white/60 font-body ml-2">Back</Text>
        </TouchableOpacity>

        <View
          className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
          style={{ backgroundColor: playlist.color + "30" }}
        >
          <Text className="text-4xl" style={{ color: playlist.color }}>
            {playlist.name[0].toUpperCase()}
          </Text>
        </View>

        <Text className="text-white font-display text-3xl mb-1">
          {playlist.name}
        </Text>
        <Text className="text-white/50 font-body mb-4">
          {playlist.tracks.length} tracks
        </Text>

        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={handlePlayAll}
            className="flex-1 flex-row items-center justify-center bg-primary py-3 rounded-xl"
          >
            <Play size={18} color="#fff" fill="#fff" />
            <Text className="text-white font-bold ml-2">Play All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              deletePlaylist(playlist.id);
              router.back();
            }}
            className="w-12 h-12 bg-red-500/20 rounded-xl items-center justify-center"
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracks */}
      {playlist.tracks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/30 font-body">
            No tracks in this playlist
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/search")}
            className="mt-4 bg-surface px-6 py-3 rounded-xl"
          >
            <Text className="text-primary font-semibold">Add Tracks</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TrackList
          tracks={playlist.tracks}
          title={playlist.name}
          onRemove={(trackId) => removeTrackFromPlaylist(playlist.id, trackId)}
        />
      )}
    </View>
  );
}

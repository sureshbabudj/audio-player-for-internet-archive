import { TrackList } from "@/components/TrackList";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Play, Plus, Trash2, X } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    getPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlaylistStore();
  const { loadTrack } = usePlayerStore();
  const { collections } = useLibraryStore();
  const [showAddModal, setShowAddModal] = useState(false);

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

  const allAvailableTracks = collections.flatMap((c) => c.tracks);

  return (
    <SafeAreaView className="flex-1 bg-darker">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
        >
          <ArrowLeft size={20} color={THEME.white} />
          <Text className="text-white/60 font-body ml-2">Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between">
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center mb-4"
            style={{ backgroundColor: playlist.color + "30" }}
          >
            <Text className="text-4xl" style={{ color: playlist.color }}>
              {playlist.name[0].toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center"
          >
            <Plus size={24} color={THEME.primary} />
          </TouchableOpacity>
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
            <Play size={18} color={THEME.white} fill={THEME.white} />
            <Text className="text-white font-bold ml-2">Play All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              deletePlaylist(playlist.id);
              router.back();
            }}
            className="w-12 h-12 bg-red-500/20 rounded-xl items-center justify-center"
          >
            <Trash2 size={18} color={THEME.error} />
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
            onPress={() => setShowAddModal(true)}
            className="mt-4 bg-surface px-6 py-3 rounded-xl"
          >
            <Text className="text-primary font-semibold">Add from Library</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TrackList
          tracks={playlist.tracks}
          title={playlist.name}
          onRemove={(trackId) => removeTrackFromPlaylist(playlist.id, trackId)}
        />
      )}

      {/* Add Tracks Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/90 justify-end">
          <View className="bg-surface rounded-t-[32px] p-6 h-[80%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-display text-xl">
                Add from Library
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={THEME.white} opacity={0.5} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {allAvailableTracks.length === 0 ? (
                <Text className="text-white/30 text-center py-20">
                  Your library is empty
                </Text>
              ) : (
                allAvailableTracks.map((track) => {
                  const isInPlaylist = playlist.tracks.some(
                    (t) => t.id === track.id,
                  );
                  return (
                    <TouchableOpacity
                      key={track.id}
                      onPress={() =>
                        !isInPlaylist && addTrackToPlaylist(playlist.id, track)
                      }
                      className="flex-row items-center p-3 mb-2 bg-white/5 rounded-2xl"
                    >
                      <Image
                        source={{
                          uri:
                            track.thumbnail ||
                            `https://archive.org/services/img/${track.identifier}`,
                        }}
                        className="w-12 h-12 rounded-lg mr-4"
                      />
                      <View className="flex-1">
                        <Text
                          className="text-white font-medium"
                          numberOfLines={1}
                        >
                          {track.title}
                        </Text>
                        <Text className="text-white/40 text-xs">
                          {track.creator}
                        </Text>
                      </View>
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${isInPlaylist ? "bg-primary/20" : "bg-primary"}`}
                      >
                        {isInPlaylist ? (
                          <X size={16} color={THEME.primary} />
                        ) : (
                          <Plus size={16} color={THEME.white} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

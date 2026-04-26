import { THEME } from "@/constants/colors";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { ArchiveTrack } from "@/types";
import { ListMusic, Plus, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PlaylistSelectorProps {
  visible: boolean;
  onClose: () => void;
  track: ArchiveTrack | null;
}

export function PlaylistSelector({
  visible,
  onClose,
  track,
}: PlaylistSelectorProps) {
  const { playlists, createPlaylist, addTrackToPlaylist } = usePlaylistStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");

  if (!track) return null;

  const handleCreate = () => {
    if (newName.trim()) {
      const newPlaylistId = createPlaylist(newName.trim());
      addTrackToPlaylist(newPlaylistId, track);
      setNewName("");
      setShowCreateModal(false);
      onClose();
    }
  };

  const handleSelect = (playlistId: string) => {
    addTrackToPlaylist(playlistId, track);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-surface rounded-t-[32px] p-6 pb-10">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-display text-xl">
              Add to Playlist
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={THEME.white} opacity={0.5} />
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-[60%]">
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center p-4 mb-3 bg-primary/10 rounded-2xl border border-primary/20"
            >
              <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-4">
                <Plus size={20} color={THEME.white} />
              </View>
              <Text className="text-primary font-bold">New Playlist</Text>
            </TouchableOpacity>

            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                onPress={() => handleSelect(playlist.id)}
                className="flex-row items-center p-4 mb-2 bg-white/5 rounded-2xl"
              >
                <View className="w-10 h-10 rounded-xl bg-surface-light items-center justify-center mr-4">
                  <ListMusic size={20} color={THEME.white} opacity={0.5} />
                </View>
                <View>
                  <Text className="text-white font-semibold">
                    {playlist.name}
                  </Text>
                  <Text className="text-white/40 text-xs">
                    {playlist.tracks.length} tracks
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nested Create Playlist Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-1 bg-black/90 justify-end">
              <View className="bg-surface rounded-t-[32px] p-8 pb-12">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white font-display text-2xl">
                    New Playlist
                  </Text>
                  <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                    <X size={24} color={THEME.white} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  className="bg-darker text-white font-body text-lg p-5 rounded-2xl mb-6"
                  placeholder="Playlist Name"
                  placeholderTextColor={THEME.white + "40"}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />

                <TouchableOpacity
                  onPress={handleCreate}
                  className="bg-primary py-5 rounded-2xl items-center shadow-lg shadow-primary/20"
                >
                  <Text className="text-white font-bold text-lg">
                    Create & Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </Modal>
  );
}

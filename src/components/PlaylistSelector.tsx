import { PLAYLIST_COLORS } from "@/constants/colors";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { ArchiveTrack } from "@/types";
import { Music, Plus, X } from "lucide-react-native";
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
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylistStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSelect = (playlistId: string) => {
    if (track) {
      addTrackToPlaylist(playlistId, track);
      onClose();
    }
  };

  const handleCreate = () => {
    if (newName.trim()) {
      const id = createPlaylist(newName.trim());
      if (track) {
        addTrackToPlaylist(id, track);
      }
      setNewName("");
      setShowCreate(false);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        className="flex-1"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1 bg-black/60 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-surface rounded-t-[32px] p-6 pb-12"
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-display text-xl">
                {showCreate ? "New Playlist" : "Add to Playlist"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#fff" opacity={0.5} />
              </TouchableOpacity>
            </View>

            {showCreate ? (
              <View>
                <TextInput
                  className="bg-darker text-white font-body text-base p-4 rounded-2xl mb-6"
                  placeholder="Playlist name"
                  placeholderTextColor="#666"
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleCreate}
                  className="bg-primary py-4 rounded-2xl items-center"
                >
                  <Text className="text-white font-bold text-lg">Create and Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCreate(false)}
                  className="mt-4 items-center"
                >
                  <Text className="text-white/40 font-medium">Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView className="max-h-[400px]">
                <TouchableOpacity
                  onPress={() => setShowCreate(true)}
                  className="flex-row items-center p-4 mb-3 bg-white/5 rounded-2xl"
                >
                  <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-4">
                    <Plus size={20} color="#fff" />
                  </View>
                  <Text className="text-white font-semibold text-base">
                    Create New Playlist
                  </Text>
                </TouchableOpacity>

                {playlists.map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    onPress={() => handleSelect(playlist.id)}
                    className="flex-row items-center p-4 mb-2 bg-white/5 rounded-2xl"
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: playlist.color + "33" }}
                    >
                      <Music size={20} color={playlist.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base">
                        {playlist.name}
                      </Text>
                      <Text className="text-white/40 text-xs">
                        {playlist.tracks.length} tracks
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

import { ScreenHeader } from "@/components/ScreenHeader";
import { PlaylistCard } from "@/components/PlaylistCard";
import { THEME } from "@/constants/colors";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { Music, Plus, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PlaylistsScreen() {
  const { playlists, createPlaylist } = usePlaylistStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim(), newDesc.trim() || undefined);
      setNewName("");
      setNewDesc("");
      setModalVisible(false);
    }
  };

  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="main" />

      {/* Toolbar */}
      <View className="flex-row items-center justify-between px-6 py-2">
        <Text className="text-white/60 font-medium text-sm">Your Collections</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex-row items-center bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
        >
          <Plus size={16} color={THEME.primary} />
          <Text className="text-primary font-bold text-xs ml-2 uppercase tracking-wider">New Playlist</Text>
        </TouchableOpacity>
      </View>

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Music size={48} color={THEME.primary} opacity={0.3} />
          <Text className="text-white/30 font-body text-lg mt-4 text-center">
            No playlists yet. Create your first one!
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          renderItem={({ item }) => <PlaylistCard playlist={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 8, paddingBottom: 120 }}
        />
      )}

      {/* Create Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-surface rounded-t-3xl p-6 pb-10">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white font-display text-xl">
                  New Playlist
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={THEME.white} />
                </TouchableOpacity>
              </View>

              <TextInput
                className="bg-darker text-white font-body text-base p-4 rounded-xl mb-4"
                placeholder="Playlist name"
                placeholderTextColor={THEME.white + "40"}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />

              <TextInput
                className="bg-darker text-white font-body text-base p-4 rounded-xl mb-6"
                placeholder="Description (optional)"
                placeholderTextColor={THEME.white + "40"}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                onPress={handleCreate}
                className="bg-primary py-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-lg">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

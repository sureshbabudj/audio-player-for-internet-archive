import { PlaylistCard } from "@/components/PlaylistCard";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { useRouter } from "expo-router";
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
  const router = useRouter();
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
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Text className="text-white font-display text-2xl">Playlists</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="w-10 h-10 rounded-full bg-primary items-center justify-center"
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Music size={48} color="#FF6B35" opacity={0.3} />
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
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <TextInput
                className="bg-darker text-white font-body text-base p-4 rounded-xl mb-4"
                placeholder="Playlist name"
                placeholderTextColor="#666"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />

              <TextInput
                className="bg-darker text-white font-body text-base p-4 rounded-xl mb-6"
                placeholder="Description (optional)"
                placeholderTextColor="#666"
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

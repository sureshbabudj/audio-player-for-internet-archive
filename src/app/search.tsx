import { SearchResultCard } from "@/components/SearchResultCard";
import { SearchResultItemCard } from "@/components/SearchResultItemCard";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { ArchiveItem, ArchiveTrack } from "@/types";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AUDIO_FORMATS = ["mp3", "ogg", "flac", "wav", "m4a", "aac"];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArchiveItem[]>([]);
  const [tracks, setTracks] = useState<ArchiveTrack[]>([]);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const { playlists } = usePlaylistStore();
  const { addToLibrary } = useLibraryStore();

  const searchArchive = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setSelectedItem(null);
    setTracks([]);

    try {
      // Optimized query: fewer fields and fewer rows for speed
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
        searchQuery,
      )}+AND+mediatype:audio&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&sort[]=downloads+desc&rows=20&output=json`;

      const response = await fetch(url);
      const data = await response.json();
      console.log("Search result:", data);
      if (data.response?.docs) {
        const items: ArchiveItem[] = data.response.docs.map((doc: any) => ({
          identifier: doc.identifier,
          title: doc.title || "Untitled",
          creator: doc.creator?.[0] || "Unknown Artist",
          description: doc.description,
          thumbnail: `https://archive.org/services/img/${doc.identifier}`,
          date: doc.year,
        }));
        setResults(items);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTracksForItem = async (item: ArchiveItem) => {
    setLoadingTracks(true);
    setSelectedItem(item);
    try {
      const metaUrl = `https://archive.org/metadata/${item.identifier}`;
      const metaRes = await fetch(metaUrl);
      const meta = await metaRes.json();

      if (meta.files) {
        // Try to find a better thumbnail in the files list
        const imageFile = meta.files.find(
          (f: any) =>
            f.format === "Item Image" ||
            (f.name.toLowerCase().endsWith(".jpg") &&
              !f.name.toLowerCase().includes("thumb")),
        );

        const thumbnail = imageFile
          ? `https://archive.org/download/${item.identifier}/${imageFile.name}`
          : `https://archive.org/services/img/${item.identifier}`;

        const audioFiles = meta.files.filter((f: any) =>
          AUDIO_FORMATS.some((ext) => f.name.toLowerCase().endsWith(ext)),
        );

        const tracks: ArchiveTrack[] = audioFiles.map((file: any) => ({
          id: `${item.identifier}_${file.name}`,
          identifier: item.identifier,
          title: file.title || file.name,
          creator: item.creator,
          description: item.description,
          url: `https://archive.org/download/${encodeURIComponent(
            item.identifier,
          )}/${encodeURIComponent(file.name)}`,
          thumbnail: thumbnail,
          date: item.date,
          collection: [item.identifier],
          fileName: file.name,
          duration: file.duration ? parseFloat(file.duration) : undefined,
        }));
        setTracks(tracks);
      }
    } catch (e) {
      console.error("Error fetching tracks:", e);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleAddAllToLibrary = async (item: ArchiveItem) => {
    setAddingId(item.identifier);
    try {
      const metaUrl = `https://archive.org/metadata/${item.identifier}`;
      const metaRes = await fetch(metaUrl);
      const meta = await metaRes.json();

      if (meta.files) {
        const imageFile = meta.files.find(
          (f: any) =>
            f.format === "Item Image" ||
            (f.name.toLowerCase().endsWith(".jpg") &&
              !f.name.toLowerCase().includes("thumb")),
        );

        const thumbnail = imageFile
          ? `https://archive.org/download/${item.identifier}/${imageFile.name}`
          : `https://archive.org/services/img/${item.identifier}`;

        const audioFiles = meta.files.filter((f: any) =>
          AUDIO_FORMATS.some((ext) => f.name.toLowerCase().endsWith(ext)),
        );

        const tracks: ArchiveTrack[] = audioFiles.map((file: any) => ({
          id: `${item.identifier}_${file.name}`,
          identifier: item.identifier,
          title: file.title || file.name,
          creator: item.creator,
          description: item.description,
          url: `https://archive.org/download/${encodeURIComponent(
            item.identifier,
          )}/${encodeURIComponent(file.name)}`,
          thumbnail: thumbnail,
          date: item.date,
          collection: [item.identifier],
          fileName: file.name,
          duration: file.duration ? parseFloat(file.duration) : undefined,
        }));

        tracks.forEach((track) => addToLibrary(track));
        console.log(`Added ${tracks.length} tracks to library`);
      }
    } catch (e) {
      console.error("Error adding tracks:", e);
    } finally {
      setAddingId(null);
    }
  };

  const handleAddToPlaylist = (track: ArchiveTrack) => {
    if (playlists.length > 0) {
      const { addTrackToPlaylist } = usePlaylistStore.getState();
      addTrackToPlaylist(playlists[0].id, track);
    }
  };

  return (
    <View
      className="flex-1 bg-darker"
      style={{ paddingTop: Math.max(insets.top, 10) }}
    >
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3">
          {selectedItem ? (
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              className="mr-2"
            >
              <ArrowLeft size={20} color="#FF6B35" />
            </TouchableOpacity>
          ) : (
            <Search size={20} color="#FF6B35" />
          )}
          <TextInput
            className="flex-1 text-white font-body ml-3 text-base"
            placeholder={
              selectedItem
                ? "Search in collection..."
                : "Search archive.org audio..."
            }
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => searchArchive(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Header / Context */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <SlidersHorizontal size={16} color="#FF6B35" />
          <Text className="text-white/60 font-body text-sm ml-2">
            {selectedItem
              ? `Collection: ${selectedItem.title}`
              : "Audio files only"}
          </Text>
        </View>
        {selectedItem && (
          <TouchableOpacity
            onPress={() => handleAddAllToLibrary(selectedItem)}
            disabled={addingId === selectedItem.identifier}
          >
            <Text className="text-primary font-semibold text-sm">
              {addingId === selectedItem.identifier ? "Adding..." : "Add All"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading || loadingTracks ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-white/60 font-body mt-4">
            {loading ? "Searching archive.org..." : "Loading tracks..."}
          </Text>
        </View>
      ) : searched && !selectedItem && results.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white/40 font-body text-center">
            No audio files found. Try a different search term.
          </Text>
        </View>
      ) : selectedItem ? (
        <FlatList
          data={tracks}
          renderItem={({ item }) => (
            <SearchResultCard
              track={item}
              queue={tracks}
              title={selectedItem?.title}
              onAddToPlaylist={
                playlists.length > 0 ? handleAddToPlaylist : undefined
              }
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Text className="text-white/40 font-body">
                No tracks found in this collection.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => fetchTracksForItem(item)}>
              <SearchResultItemCard
                item={item}
                onAdd={handleAddAllToLibrary}
                isAdding={addingId === item.identifier}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.identifier}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </View>
  );
}

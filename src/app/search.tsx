import { SearchResultCard } from "@/components/SearchResultCard";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { ArchiveTrack } from "@/types";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AUDIO_FORMATS = ["mp3", "ogg", "flac", "wav", "m4a", "aac"];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArchiveTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { playlists } = usePlaylistStore();

  const searchArchive = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      // Archive.org Advanced Search API
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
        searchQuery,
      )}+AND+mediatype:audio&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=description&fl[]=year&fl[]=collection&sort[]=downloads+desc&rows=50&output=json`;

      const response = await fetch(url);
      const data = await response.json();
      console.log("Search results:", data.response?.docs || []);
      if (data.response?.docs) {
        const tracks: ArchiveTrack[] = [];

        for (const doc of data.response.docs) {
          // Fetch metadata for each item to get audio files
          try {
            const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
            const metaRes = await fetch(metaUrl);
            const meta = await metaRes.json();

            if (meta.files) {
              const audioFiles = meta.files.filter((f: any) =>
                AUDIO_FORMATS.some((ext) => f.name.toLowerCase().endsWith(ext)),
              );

              for (const file of audioFiles.slice(0, 3)) {
                // Limit to 3 files per item
                tracks.push({
                  id: `${doc.identifier}_${file.name}`,
                  identifier: doc.identifier,
                  title: doc.title || file.name,
                  creator: doc.creator?.[0] || "Unknown",
                  description: doc.description,
                  url: `https://archive.org/download/${doc.identifier}/${file.name}`,
                  thumbnail: `https://archive.org/services/img/${doc.identifier}`,
                  date: doc.year,
                  collection: doc.collection,
                  fileName: file.name,
                });
              }
            }
          } catch (e) {
            console.error("Error fetching metadata:", e);
          }
        }

        setResults(tracks);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddToPlaylist = (track: ArchiveTrack) => {
    if (playlists.length > 0) {
      // Add to first playlist for demo, or show picker
      const { addTrackToPlaylist } = usePlaylistStore.getState();
      addTrackToPlaylist(playlists[0].id, track);
    }
  };

  return (
    <View className="flex-1 bg-darker">
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3">
          <Search size={20} color="#FF6B35" />
          <TextInput
            className="flex-1 text-white font-body ml-3 text-base"
            placeholder="Search archive.org audio..."
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

      {/* Filters */}
      <View className="px-4 py-2 flex-row items-center">
        <SlidersHorizontal size={16} color="#FF6B35" />
        <Text className="text-white/60 font-body text-sm ml-2">
          Audio files only
        </Text>
      </View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-white/60 font-body mt-4">
            Searching archive.org...
          </Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white/40 font-body text-center">
            No audio files found. Try a different search term.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <SearchResultCard
              track={item}
              onAddToPlaylist={
                playlists.length > 0 ? handleAddToPlaylist : undefined
              }
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </View>
  );
}

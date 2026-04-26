import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchResultItemCard } from "@/components/SearchResultItemCard";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { ArchiveItem } from "@/types";
import { searchArchive } from "@/utils/archive";
import { useRouter } from "expo-router";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const { addCollection } = useLibraryStore();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setTimedOut(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const items = await searchArchive(searchQuery, controller.signal);
      setResults(items);
    } catch (error: any) {
      if (
        error.name === "AbortError" ||
        error.message?.toLowerCase().includes("timed out")
      ) {
        setTimedOut(true);
      } else {
        console.error("Search error:", error);
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  }, []);

  const handleItemPress = (item: ArchiveItem) => {
    router.push(`/collection/${item.identifier}` as any);
  };

  const handleAddAllToLibrary = async (item: ArchiveItem) => {
    setAddingId(item.identifier);
    // Note: addCollection will fetch tracks internally if not provided
    addCollection(item, []);
    setAddingId(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      className="flex-1 bg-darker"
    >
      <ScreenHeader type="detail" title="Search" showSearch={false} />

      {/* Search Bar */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3">
          <Search size={20} color={THEME.primary} />
          <TextInput
            className="flex-1 text-white font-body ml-3 text-base"
            placeholder="Search archive.org audio..."
            placeholderTextColor={THEME.white + "40"}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X size={18} color={THEME.white} opacity={0.4} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Header / Context */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <SlidersHorizontal size={16} color={THEME.primary} />
          <Text className="text-white/60 font-body text-sm ml-2">
            Audio files only
          </Text>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text className="text-white/60 font-body mt-4">
            Searching archive.org...
          </Text>
        </View>
      ) : timedOut ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-white font-display text-xl mb-2">
            Search Timed Out
          </Text>
          <Text className="text-white/40 font-body text-center mb-6">
            Archive.org is taking too long to respond. This usually means their
            servers are busy.
          </Text>
          <TouchableOpacity
            onPress={() => handleSearch(query)}
            className="bg-primary px-8 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold">Retry Search</Text>
          </TouchableOpacity>
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
            <TouchableOpacity onPress={() => handleItemPress(item)}>
              <SearchResultItemCard
                item={item}
                onAdd={handleAddAllToLibrary}
                isAdding={addingId === item.identifier}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.identifier}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 180 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

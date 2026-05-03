import { ScreenHeader } from "@/components/ScreenHeader";
import { TrackItem } from "@/components/TrackItem";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { fetchItemTracks, getItemMetadata } from "@/utils/archive";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Play, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { collections, removeCollection, removeFromLibrary, addCollection } =
    useLibraryStore();
  const { loadTrack } = usePlayerStore();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedCollection = collections.find((c) => c.id === id);
    if (savedCollection) {
      setItem(savedCollection);
      setTracks(savedCollection.tracks);
      setIsSaved(true);
      setLoading(false);
    } else {
      loadFromAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadFromAPI = async () => {
    try {
      setLoading(true);
      const [metadata, itemTracks] = await Promise.all([
        getItemMetadata(id as string),
        fetchItemTracks({ identifier: id as string } as any),
      ]);
      setItem({
        id: metadata.identifier,
        identifier: metadata.identifier,
        title: metadata.title,
        creator: metadata.creator,
        thumbnail: metadata.thumbnail,
      });
      setTracks(itemTracks);
    } catch (e) {
      console.error("Error loading collection detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = useCallback(() => {
    if (tracks.length > 0 && item) {
      loadTrack(tracks[0], tracks, item.title);
      router.push("/player" as any);
    }
  }, [tracks, item, loadTrack, router]);

  const handleSaveToggle = useCallback(() => {
    if (!item) return;
    if (isSaved) {
      removeCollection(item.id);
      setIsSaved(false);
    } else {
      addCollection(item, tracks);
      setIsSaved(true);
    }
  }, [isSaved, item, removeCollection, addCollection, tracks]);

  const renderTrackItem = useCallback(
    ({ item: track }: { item: any }) => (
      <TrackItem
        track={track}
        type="collection"
        onPress={() => {
          loadTrack(track, tracks, item?.title || "");
          router.push("/player" as any);
        }}
        onRemove={isSaved ? () => removeFromLibrary(track.id) : undefined}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSaved, item?.title, loadTrack, removeFromLibrary, tracks],
  );

  const HeaderComponent = useMemo(() => {
    if (!item) return null;
    return (
      <View className="items-center">
        <View className="w-48 h-48 rounded-[32px] overflow-hidden shadow-2xl shadow-black mb-6 border border-white/10">
          <Image
            key={item.thumbnail}
            source={{
              uri: item.thumbnail,
            }}
            className="w-full h-full object-cover"
          />
        </View>

        <Text
          className="text-white font-display text-2xl text-center mb-1"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text className="text-primary font-semibold text-base mb-6">
          {item.creator}
        </Text>

        <View className="flex-row w-full max-w-[400px] gap-x-3 mb-8">
          <TouchableOpacity
            onPress={handlePlayAll}
            className="flex-1 flex-row items-center justify-center bg-primary h-14 rounded-2xl"
          >
            <Play size={20} color={THEME.white} fill={THEME.white} />
            <Text className="text-white font-bold ml-2 text-lg">Play All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSaveToggle}
            className={`w-14 h-14 items-center justify-center rounded-2xl ${
              isSaved ? "bg-red-500/10" : "bg-white/5"
            }`}
          >
            {isSaved ? (
              <Trash2 size={24} color={THEME.error} />
            ) : (
              <Plus size={24} color={THEME.primary} />
            )}
          </TouchableOpacity>
        </View>
        <View className="w-full">
          <Text className="text-white font-display text-xl mb-4">Tracks</Text>
        </View>
      </View>
    );
  }, [handlePlayAll, handleSaveToggle, isSaved, item]);

  if (loading) {
    return (
      <View className="flex-1 bg-darker items-center justify-center">
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 bg-darker items-center justify-center">
        <Text className="text-white/40">Collection not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="detail" title={item?.title} />

      <FlatList
        data={tracks}
        renderItem={renderTrackItem}
        keyExtractor={(track) => track.id}
        ListHeaderComponent={HeaderComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 24 }}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

import { TrackItem } from "@/components/TrackItem";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { fetchItemTracks, getItemMetadata } from "@/utils/archive";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Play, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      // Fetch from API if not saved
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
        thumbnail: `https://archive.org/services/img/${metadata.identifier}`,
      });
      setTracks(itemTracks);
    } catch (e) {
      console.error("Error loading collection detail:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      loadTrack(tracks[0], tracks, item.title);
    }
  };

  const handleSaveToggle = () => {
    if (isSaved) {
      removeCollection(item.id);
      setIsSaved(false);
    } else {
      addCollection(item, tracks);
      setIsSaved(true);
    }
  };

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
    <SafeAreaView className="flex-1 bg-darker">
      {/* Header Info */}
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <View className="bg-darker pt-4 px-6 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center mb-4"
          >
            <ArrowLeft size={20} color={THEME.white} />
            <Text className="text-white/60 font-body ml-2">Back</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 items-center">
          <View className="w-48 h-48 rounded-[32px] overflow-hidden shadow-2xl shadow-black mb-6">
            <Image
              source={{ uri: item.thumbnail }}
              className="w-full h-full"
              contentFit="cover"
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

          <View className="flex-row space-x-3 mb-8">
            <TouchableOpacity
              onPress={handlePlayAll}
              className="flex-1 flex-row items-center justify-center bg-primary h-14 rounded-2xl"
            >
              <Play size={20} color={THEME.white} fill={THEME.white} />
              <Text className="text-white font-bold ml-2 text-lg">
                Play All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveToggle}
              className={`w-14 h-14 items-center justify-center rounded-2xl ${isSaved ? "bg-red-500/10" : "bg-white/5"}`}
            >
              {isSaved ? (
                <Trash2 size={24} color={THEME.error} />
              ) : (
                <Plus size={24} color={THEME.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6">
          <Text className="text-white font-display text-xl mb-4">Tracks</Text>
          {tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              type="collection"
              onPress={() => loadTrack(track, tracks, item.title)}
              onRemove={isSaved ? () => removeFromLibrary(track.id) : undefined}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

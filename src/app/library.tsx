import { TrackList } from "@/components/TrackList";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Clock, Heart, RefreshCw, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function LibraryScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"saved" | "liked" | "recent">(
    (params.tab as any) || "saved",
  );

  const {
    collections,
    likedTrackIds,
    recentlyPlayed,
    clearRecentlyPlayed,
    removeCollection,
    isLiked,
  } = useLibraryStore();

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as any);
    }
  }, [params.tab]);

  // Aggregate all tracks from all collections that are liked
  const allSavedTracks = collections.flatMap(c => c.tracks);
  const likedTracks = allSavedTracks.filter((t) => isLiked(t.id));

  const tabs = [
    {
      key: "saved" as const,
      label: "Collections",
      icon: Heart,
      count: collections.length,
    },
    {
      key: "liked" as const,
      label: "Liked",
      icon: Heart,
      count: likedTracks.length,
      fill: true,
    },
    {
      key: "recent" as const,
      label: "Recent",
      icon: Clock,
      count: recentlyPlayed.length,
    },
  ];

  const tracks =
    activeTab === "liked"
      ? likedTracks
      : recentlyPlayed;

  return (
    <View className="flex-1 bg-darker">
      {/* Tabs */}
      <View className="flex-row px-4 pt-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-row items-center justify-center py-3 px-6 mx-1 rounded-xl ${
                activeTab === tab.key ? "bg-primary" : "bg-surface"
              }`}
            >
              <tab.icon
                size={16}
                color={activeTab === tab.key ? "#fff" : "#FF6B35"}
                fill={tab.fill && activeTab === tab.key ? "#fff" : "none"}
              />
              <Text
                className={`font-semibold ml-2 ${
                  activeTab === tab.key ? "text-white" : "text-white/60"
                }`}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Toolbar */}
      <View className="flex-row items-center justify-between px-6 py-2">
        {activeTab === "recent" ? (
          <TouchableOpacity
            onPress={clearRecentlyPlayed}
            className="flex-row items-center"
          >
            <Trash2 size={14} color="#ef4444" />
            <Text className="text-red-400 font-medium text-sm ml-1">Clear</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center">
            <RefreshCw size={14} color="#FF6B35" />
            <Text className="text-primary/60 font-medium text-xs ml-1">
              {activeTab === "liked" ? "Your Favorites" : activeTab === "saved" ? "Your Collections" : "Recent Plays"}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      {activeTab === "saved" ? (
        <ScrollView className="flex-1 px-4">
          {collections.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-white/30 font-body text-center text-lg">
                Your library is empty. Search and add collections to get started!
              </Text>
            </View>
          ) : (
            collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                onPress={() => {
                  // Load the whole collection as a queue
                  const { loadTrack } = usePlayerStore.getState();
                  loadTrack(collection.tracks[0], collection.tracks, collection.title);
                }}
                className="flex-row items-center p-4 mb-3 bg-surface rounded-2xl"
              >
                <View className="w-16 h-16 rounded-xl bg-surface-light items-center justify-center overflow-hidden mr-4">
                  <Image
                    source={{ uri: collection.thumbnail }}
                    className="w-full h-full"
                    contentFit="cover"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base" numberOfLines={1}>
                    {collection.title}
                  </Text>
                  <Text className="text-white/50 text-xs mt-1">
                    {collection.creator} • {collection.tracks.length} tracks
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    removeCollection(collection.id);
                  }}
                  className="p-2"
                >
                  <Trash2 size={18} color="#ef4444" opacity={0.6} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : tracks.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-white/30 font-body text-center text-lg">
            {activeTab === "liked"
              ? "No liked tracks yet. Tap the heart to add favorites!"
              : "No recent plays. Start listening to see your history."}
          </Text>
        </View>
      ) : (
        <TrackList
          tracks={tracks}
          title={
            activeTab === "liked"
              ? "Favorites"
              : "Recent Plays"
          }
          showAddToPlaylist={activeTab !== "recent"}
        />
      )}
    </View>
  );
}

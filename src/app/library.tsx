import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TrackList } from "@/components/TrackList";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { FlashList } from "@shopify/flash-list";

import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Clock, Heart, List, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LibraryScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"saved" | "liked" | "recent">(
    (params.tab as any) || "saved",
  );

  const { collections, likedTracks, recentlyPlayed, clearRecentlyPlayed } =
    useLibraryStore();

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as any);
    }
  }, [params.tab]);

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

  const tracks = activeTab === "liked" ? likedTracks : recentlyPlayed;

  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="main" />
      {/* Tabs */}
      <View className="flex-row px-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
              }}
              className={`flex-row items-center justify-center py-3 px-6 mx-1 rounded-xl ${
                activeTab === tab.key ? "bg-primary" : "bg-surface"
              }`}
            >
              <tab.icon
                size={16}
                color={activeTab === tab.key ? THEME.white : THEME.primary}
                fill={tab.fill && activeTab === tab.key ? THEME.white : "none"}
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
            <Trash2 size={14} color={THEME.error} />
            <Text className="text-red-400 font-medium text-sm ml-1">Clear</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center">
            <List size={14} color={THEME.primary} />
            <Text className="text-primary/60 font-medium text-xs ml-1">
              {activeTab === "liked"
                ? "Your Favorites"
                : activeTab === "saved"
                  ? "Your Collections"
                  : "Recent Plays"}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      {activeTab === "saved" ? (
        <FlashList
          data={collections}
          keyExtractor={(item) => item.id}
          className="flex-1 px-4"
          ListEmptyComponent={
            <EmptyState
              title="Your Library is Empty"
              message="Search the Internet Archive for your favorite collections and add them here to build your personal library."
              actionLabel="Start Searching"
            />
          }
          renderItem={({ item: collection }) => (
            <TouchableOpacity
              onPress={() => router.push(`/collection/${collection.id}` as any)}
              className="flex-row items-center p-4 mb-3 bg-surface rounded-2xl"
            >
              <View className="w-16 h-16 rounded-xl bg-surface-light items-center justify-center overflow-hidden mr-4">
                <Image
                  source={{ uri: collection.thumbnail }}
                  className="w-full h-full object-cover"
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-white font-semibold text-base"
                  numberOfLines={1}
                >
                  {collection.title}
                </Text>
                <Text className="text-white/50 text-xs mt-1">
                  {collection.creator} • {collection.tracks.length} tracks
                </Text>
              </View>
              <ChevronRight size={20} color={THEME.white} opacity={0.3} />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : tracks.length === 0 ? (
        <EmptyState
          title={activeTab === "liked" ? "No Liked Tracks" : "No Recent Plays"}
          message={
            activeTab === "liked"
              ? "Start exploring and heart your favorite tracks to see them here."
              : "Your recently played tracks will appear here once you start listening."
          }
          icon={activeTab === "liked" ? Heart : Clock}
          actionLabel="Go to Search"
        />
      ) : (
        <TrackList
          tracks={tracks}
          title={activeTab === "liked" ? "Favorites" : "Recent Plays"}
          showAddToPlaylist={activeTab !== "recent"}
        />
      )}
    </View>
  );
}

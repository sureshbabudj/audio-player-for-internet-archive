import { TrackList } from "@/components/TrackList";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Clock, Heart, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<"saved" | "recent">("saved");
  const {
    savedTracks,
    recentlyPlayed,
    clearRecentlyPlayed,
    removeFromLibrary,
  } = useLibraryStore();

  const tabs = [
    {
      key: "saved" as const,
      label: "Saved",
      icon: Heart,
      count: savedTracks.length,
    },
    {
      key: "recent" as const,
      label: "Recent",
      icon: Clock,
      count: recentlyPlayed.length,
    },
  ];

  const tracks = activeTab === "saved" ? savedTracks : recentlyPlayed;

  return (
    <View className="flex-1 bg-darker">
      {/* Tabs */}
      <View className="flex-row px-4 pt-4 pb-2">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 flex-row items-center justify-center py-3 mx-1 rounded-xl ${
              activeTab === tab.key ? "bg-primary" : "bg-surface"
            }`}
          >
            <tab.icon
              size={16}
              color={activeTab === tab.key ? "#fff" : "#FF6B35"}
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
      </View>

      {/* Clear Recent */}
      {activeTab === "recent" && recentlyPlayed.length > 0 && (
        <TouchableOpacity
          onPress={clearRecentlyPlayed}
          className="flex-row items-center justify-end px-6 py-2"
        >
          <Trash2 size={14} color="#ef4444" />
          <Text className="text-red-400 font-medium text-sm ml-1">Clear</Text>
        </TouchableOpacity>
      )}

      {/* Tracks */}
      {tracks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/30 font-body text-lg">
            {activeTab === "saved" ? "No saved tracks yet" : "No recent plays"}
          </Text>
        </View>
      ) : (
        <TrackList
          tracks={tracks}
          showAddToPlaylist={activeTab === "saved"}
          onRemove={
            activeTab === "saved" ? (id) => removeFromLibrary(id) : undefined
          }
        />
      )}
    </View>
  );
}

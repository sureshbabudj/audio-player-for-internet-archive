import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArchiveTrack } from "@/types";
import { Clock, Heart, Play, Plus } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface SearchResultCardProps {
  track: ArchiveTrack;
  queue?: ArchiveTrack[];
  title?: string;
  onAddToPlaylist?: (track: ArchiveTrack) => void;
}

export function SearchResultCard({
  track,
  queue,
  title,
  onAddToPlaylist,
}: SearchResultCardProps) {
  const { loadTrack } = usePlayerStore();
  const { addToLibrary, isInLibrary, toggleLike, isLiked } = useLibraryStore();
  const liked = isLiked(track.id);

  return (
    <TouchableOpacity
      onPress={() => loadTrack(track, queue, title)}
      className="flex-row items-center p-4 mx-4 mb-3 bg-surface rounded-2xl"
    >
      <View className="w-16 h-16 rounded-xl bg-surface-light items-center justify-center overflow-hidden mr-4">
        {track.thumbnail ? (
          <Image
            source={{ uri: track.thumbnail }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Play size={24} color="#FF6B35" />
        )}
      </View>

      <View className="flex-1 mr-2">
        <Text className="text-white font-semibold text-sm" numberOfLines={2}>
          {track.title}
        </Text>
        <Text
          className="text-white/50 font-body text-xs mt-1"
          numberOfLines={1}
        >
          {track.creator || "Unknown Artist"}
        </Text>
        {track.duration && (
          <View className="flex-row items-center mt-1">
            <Clock size={12} color="#FF6B35" />
            <Text className="text-primary/70 text-xs ml-1">
              {Math.floor(track.duration / 60)}:
              {String(Math.floor(track.duration % 60)).padStart(2, "0")}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center space-x-3">
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleLike(track.id);
          }}
          className="w-8 h-8 rounded-full bg-surface-light items-center justify-center"
        >
          <Heart
            size={16}
            color={liked ? "#FF6B35" : "#fff"}
            fill={liked ? "#FF6B35" : "none"}
            opacity={liked ? 1 : 0.4}
          />
        </TouchableOpacity>

        {!isInLibrary(track.id) && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              addToLibrary(track);
            }}
            className="w-8 h-8 rounded-full bg-surface-light items-center justify-center"
          >
            <Plus size={16} color="#FF6B35" />
          </TouchableOpacity>
        )}
        {onAddToPlaylist && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onAddToPlaylist(track);
            }}
            className="w-8 h-8 rounded-full bg-primary items-center justify-center"
          >
            <Plus size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

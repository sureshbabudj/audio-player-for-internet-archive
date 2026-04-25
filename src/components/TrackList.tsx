import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArchiveTrack } from "@/types";
import { Image } from "expo-image";
import {
  BarChart3 as BarChart,
  Heart as HeartIcon,
  Music as MusicIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, FlatList, Text, TouchableOpacity, View } from "react-native";

interface TrackListProps {
  tracks: ArchiveTrack[];
  title?: string;
  onRemove?: (trackId: string) => void;
  showAddToPlaylist?: boolean;
}

export function TrackList({
  tracks,
  title,
  onRemove,
  showAddToPlaylist,
}: TrackListProps) {
  const { loadTrack, currentTrack, isPlaying } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [isPlaying, pulseAnim]);

  const handlePlay = (track: ArchiveTrack) => {
    loadTrack(track, tracks, title);
  };

  const renderItem = ({ item }: { item: ArchiveTrack }) => {
    const isCurrent = currentTrack?.id === item.id;
    const liked = isLiked(item.id);

    return (
      <TouchableOpacity
        onPress={() => handlePlay(item)}
        className={`flex-row items-center px-6 py-3 mb-1 ${
          isCurrent ? "bg-white/5" : ""
        }`}
      >
        <View className="w-12 h-12 rounded-xl bg-surface-light items-center justify-center overflow-hidden mr-4">
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <MusicIcon size={20} color="#FF6B35" />
          )}
          {isCurrent && isPlaying && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <Animated.View style={{ opacity: pulseAnim }}>
                <BarChart size={20} color="#fff" />
              </Animated.View>
            </View>
          )}
        </View>

        <View className="flex-1 mr-4">
          <Text
            className={`font-semibold text-sm ${
              isCurrent ? "text-primary" : "text-white"
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="text-white/40 font-body text-xs mt-0.5"
            numberOfLines={1}
          >
            {item.creator || "Unknown Artist"}
          </Text>
        </View>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleLike(item.id);
            }}
          >
            <HeartIcon
              size={18}
              color={liked ? "#FF6B35" : "#fff"}
              fill={liked ? "#FF6B35" : "none"}
              opacity={liked ? 1 : 0.3}
            />
          </TouchableOpacity>

          {onRemove && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
            >
              <TrashIcon size={18} color="#ef4444" opacity={0.5} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={tracks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 180 }}
    />
  );
}

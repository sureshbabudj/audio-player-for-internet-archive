import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { ArchiveTrack } from "@/types";
import { useRouter } from "expo-router";
import { Heart, MoreVertical, Music } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, FlatList, Text, TouchableOpacity, View } from "react-native";

interface TrackListProps {
  tracks: ArchiveTrack[];
  showAddToPlaylist?: boolean;
  playlistId?: string;
  onRemove?: (trackId: string) => void;
}

export function TrackList({
  tracks,
  showAddToPlaylist,
  playlistId,
  onRemove,
}: TrackListProps) {
  const router = useRouter();
  const { loadTrack, currentTrack, isPlaying } = usePlayerStore();
  const { isInLibrary, addToLibrary, removeFromLibrary } = useLibraryStore();
  const { playlists, addTrackToPlaylist } = usePlaylistStore();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isPlaying, pulseAnim]);

  const handlePlay = (track: ArchiveTrack, index: number) => {
    loadTrack(track, tracks);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ArchiveTrack;
    index: number;
  }) => {
    const isCurrent = currentTrack?.id === item.id;
    const saved = isInLibrary(item.id);

    return (
      <TouchableOpacity
        onPress={() => handlePlay(item, index)}
        className={`flex-row items-center p-4 mx-4 mb-2 rounded-2xl ${
          isCurrent ? "bg-primary/20 border border-primary/30" : "bg-surface"
        }`}
      >
        <View className="w-12 h-12 rounded-xl bg-surface-light items-center justify-center mr-3">
          {isCurrent && isPlaying ? (
            <View className="flex-row space-x-0.5">
              {[1, 2, 3].map((i) => (
                <Animated.View
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  style={{
                    height: i === 2 ? 16 : 10,
                    opacity: pulseAnim,
                  }}
                />
              ))}
            </View>
          ) : (
            <Music size={20} color="#FF6B35" />
          )}
        </View>

        <View className="flex-1 mr-2">
          <Text
            className={`font-semibold text-sm ${
              isCurrent ? "text-primary" : "text-white"
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-white/50 font-body text-xs" numberOfLines={1}>
            {item.creator || "Unknown Artist"}
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => {
              if (saved) removeFromLibrary(item.id);
              else addToLibrary(item);
            }}
          >
            <Heart
              size={18}
              color={saved ? "#FF6B35" : "#fff"}
              fill={saved ? "#FF6B35" : "none"}
              opacity={0.7}
            />
          </TouchableOpacity>

          {showAddToPlaylist && playlists.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                // Show playlist picker modal
                const firstPlaylist = playlists[0];
                if (firstPlaylist) addTrackToPlaylist(firstPlaylist.id, item);
              }}
            >
              <MoreVertical size={18} color="#fff" opacity={0.7} />
            </TouchableOpacity>
          )}

          {onRemove && (
            <TouchableOpacity onPress={() => onRemove(item.id)}>
              <Text className="text-red-400 text-xs">Remove</Text>
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
      contentContainerStyle={{ paddingBottom: 120 }}
    />
  );
}

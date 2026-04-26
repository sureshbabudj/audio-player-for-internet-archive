import { THEME } from "@/constants/colors";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import { ArchiveTrack } from "@/types";
import { Heart, Music, Plus, Radio, Trash2, Zap } from "lucide-react-native";
import React, { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface TrackItemProps {
  track: ArchiveTrack;
  onPress: () => void;
  onRemove?: () => void;
  type?: "recent" | "mostly" | "liked" | "search" | "playlist" | "collection";
  playCount?: number;
  isCurrent?: boolean;
  isLiked?: boolean;
  showPlaylistAction?: boolean;
}

const TrackItem: React.FC<TrackItemProps> = memo(
  ({
    track,
    onPress,
    onRemove,
    type = "search",
    playCount,
    isCurrent = false,
    isLiked = false,
    showPlaylistAction = true,
  }) => {
    const openSelector = usePlaylistStore((state) => state.openSelector);

    const getIcon = () => {
      if (track.thumbnail || track.identifier) {
        return (
          <Image
            source={{
              uri:
                track.thumbnail ||
                `https://archive.org/services/img/${track.identifier}`,
            }}
            className="w-full h-full object-cover"
          />
        );
      }

      switch (type) {
        case "recent":
          return <Radio size={20} color={THEME.primary} />;
        case "mostly":
          return <Music size={20} color={THEME.primary} />;
        case "liked":
          return <Heart size={20} color={THEME.primary} fill={THEME.primary} />;
        default:
          return <Music size={20} color={THEME.primary} />;
      }
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center p-3 mb-2 bg-surface rounded-2xl ${
          isCurrent ? "border border-primary/30" : "border border-transparent"
        }`}
      >
        <View className="w-12 h-12 rounded-xl bg-surface-light items-center justify-center mr-4 overflow-hidden">
          {getIcon()}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className={`font-semibold text-sm mr-2 ${
                isCurrent ? "text-primary" : "text-white"
              }`}
              numberOfLines={1}
            >
              {track.title}
            </Text>
            {isCurrent && <Zap size={12} color={THEME.primary} />}
          </View>
          <Text className="text-white/40 text-xs" numberOfLines={1}>
            {track.creator}
          </Text>
        </View>

        <View className="flex-row items-center gap-x-2">
          {playCount !== undefined && (
            <View className="bg-primary/10 px-2 py-1 rounded-lg mr-1">
              <Text className="text-primary text-[10px] font-bold">
                {playCount}x
              </Text>
            </View>
          )}

          {showPlaylistAction && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                openSelector(track);
              }}
              className="p-2"
            >
              <Plus size={18} color={THEME.white} opacity={0.6} />
            </TouchableOpacity>
          )}

          {onRemove && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-2"
            >
              <Trash2 size={18} color={THEME.error} opacity={0.6} />
            </TouchableOpacity>
          )}

          {isLiked && !isCurrent && !onRemove && (
            <Heart size={16} color={THEME.primary} fill={THEME.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

TrackItem.displayName = "TrackItem";

export { TrackItem };

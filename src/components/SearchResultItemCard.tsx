import { THEME } from "@/constants/colors";
import { ArchiveItem } from "@/types";
import { Image } from "expo-image";
import { Plus, Users } from "lucide-react-native";
import React, { memo } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface SearchResultItemCardProps {
  item: ArchiveItem;
  onAdd: (item: ArchiveItem) => void;
  isAdding?: boolean;
}

export const SearchResultItemCard = memo(
  ({ item, onAdd, isAdding = false }: SearchResultItemCardProps) => {
    return (
      <View className="flex-row items-center p-4 mx-4 mb-3 bg-surface rounded-2xl">
        <View className="w-16 h-16 rounded-xl bg-surface-light items-center justify-center overflow-hidden mr-4">
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <Users size={24} color={THEME.primary} />
          )}
        </View>

        <View className="flex-1 mr-2">
          <Text className="text-white font-semibold text-sm" numberOfLines={2}>
            {item.title}
          </Text>
          <Text
            className="text-white/50 font-body text-xs mt-1"
            numberOfLines={1}
          >
            {item.creator || "Unknown Artist"}
          </Text>
          {item.date && (
            <Text className="text-primary/70 text-xs mt-1">{item.date}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onAdd(item)}
          disabled={isAdding}
          className="w-10 h-10 rounded-full bg-primary items-center justify-center"
        >
          {isAdding ? (
            <ActivityIndicator size="small" color={THEME.white} />
          ) : (
            <Plus size={20} color={THEME.white} />
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

SearchResultItemCard.displayName = "SearchResultItemCard";

export default SearchResultItemCard;

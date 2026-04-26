import { TrackItem } from "@/components/TrackItem";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArchiveTrack } from "@/types";
import React from "react";
import { FlatList } from "react-native";

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
  const { loadTrack, currentTrack } = usePlayerStore();
  const { isLiked } = useLibraryStore();

  const handlePlay = (track: ArchiveTrack) => {
    loadTrack(track, tracks, title);
  };

  const renderItem = ({ item }: { item: ArchiveTrack }) => {
    const isCurrent = currentTrack?.id === item.id;
    const liked = isLiked(item.id);

    return (
      <TrackItem
        track={item}
        onPress={() => handlePlay(item)}
        isCurrent={isCurrent}
        isLiked={liked}
        type="playlist"
        onRemove={onRemove ? () => onRemove(item.id) : undefined}
        showPlaylistAction={showAddToPlaylist}
      />
    );
  };

  return (
    <FlatList
      data={tracks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 180, paddingHorizontal: 16 }}
    />
  );
}

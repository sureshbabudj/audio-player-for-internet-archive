import { TrackItem } from "@/components/TrackItem";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArchiveTrack } from "@/types";
import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";

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
  const router = useRouter();
  const loadTrack = usePlayerStore((state) => state.loadTrack);
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id);
  const likedTrackIds = useLibraryStore((state) => state.likedTrackIds);

  const handlePlay = useCallback(
    (track: ArchiveTrack) => {
      loadTrack(track, tracks, title);
      router.push("/player" as any);
    },
    [loadTrack, tracks, title, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ArchiveTrack }) => {
      const isCurrent = currentTrackId === item.id;
      const liked = likedTrackIds.includes(item.id);

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
    },
    [currentTrackId, likedTrackIds, handlePlay, onRemove, showAddToPlaylist],
  );

  return (
    <FlatList
      data={tracks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 180, paddingHorizontal: 16 }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={12}
      windowSize={5}
    />
  );
}

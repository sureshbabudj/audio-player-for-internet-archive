import { Playlist } from "@/types";
import { useRouter } from "expo-router";
import {
  AudioLines,
  Disc3,
  Headphones,
  Mic2,
  Music,
  Radio,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const ICONS: Record<string, React.ElementType> = {
  music: Music,
  disc: Disc3,
  radio: Radio,
  headphones: Headphones,
  mic: Mic2,
  audio: AudioLines,
};

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const router = useRouter();
  const Icon = ICONS[playlist.icon] || Music;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/playlists/${playlist.id}` as any)}
      className="m-2 p-4 rounded-2xl bg-surface"
      style={{ width: "45%" }}
    >
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: playlist.color + "30" }}
      >
        <Icon size={28} color={playlist.color} />
      </View>

      <Text className="text-white font-semibold text-base" numberOfLines={1}>
        {playlist.name}
      </Text>
      <Text className="text-white/50 font-body text-xs mt-1">
        {playlist.tracks.length} tracks
      </Text>
    </TouchableOpacity>
  );
}

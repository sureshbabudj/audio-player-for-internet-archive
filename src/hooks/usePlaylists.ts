import { useState, useEffect, useCallback } from "react";
import { Playlist, Track } from "../types";
import { playlistStore } from "../utils/playlistStore";
import { fetchArchiveMetadata, convertToTracks, extractIdentifier } from "../utils/archiveOrg";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await playlistStore.getPlaylists();
      setPlaylists(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPlaylist = async (name: string, tracks: Track[] = []) => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      tracks,
      createdAt: Date.now(),
    };
    await playlistStore.savePlaylist(newPlaylist);
    await refresh();
    return newPlaylist;
  };

  const updatePlaylist = async (playlist: Playlist) => {
    await playlistStore.savePlaylist(playlist);
    await refresh();
  };

  const deletePlaylist = async (id: string) => {
    await playlistStore.deletePlaylist(id);
    await refresh();
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    const playlists = await playlistStore.getPlaylists();
    const index = playlists.findIndex((p) => p.id === playlistId);
    if (index > -1) {
      const playlist = playlists[index];
      if (!playlist.tracks.some((t) => t.id === track.id)) {
        playlist.tracks.push(track);
        await playlistStore.savePlaylist(playlist);
        await refresh();
      }
    }
  };

  const exportAll = async () => {
    const data = await playlistStore.exportPlaylists();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tamil-melody-playlists-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const json = e.target?.result as string;
      await playlistStore.importPlaylists(json);
      await refresh();
    };
    reader.readAsText(file);
  };

  const importFromArchive = async (urlOrId: string, customName?: string) => {
    const identifier = extractIdentifier(urlOrId) || urlOrId;
    if (!identifier) throw new Error("Invalid Archive.org URL or Identifier");

    const metadata = await fetchArchiveMetadata(identifier);
    const tracks = convertToTracks(metadata);
    
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: customName || identifier,
      tracks,
      createdAt: Date.now(),
    };

    await playlistStore.savePlaylist(newPlaylist);
    await refresh();
    return newPlaylist;
  };

  return {
    playlists,
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    importFromArchive,
    exportAll,
    importAll,
    refresh
  };
}

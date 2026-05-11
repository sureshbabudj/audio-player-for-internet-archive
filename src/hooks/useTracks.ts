import { useState, useEffect } from "react";
import { ArchiveTrack } from "../types";
import { fetchTracks } from "../utils/parser";

export function useTracks() {
  const [tracks, setTracks] = useState<ArchiveTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const fetchedTracks = await fetchTracks();
        setTracks(fetchedTracks);
        setLoading(false);
      } catch {
        setError("Failed to load tracks");
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  return { tracks, loading, error };
}

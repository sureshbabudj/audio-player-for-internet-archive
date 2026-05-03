import { Playlist, Track } from "../types";

const STORAGE_KEY = "user_playlists";

const hasExtensionStorage =
  typeof globalThis !== "undefined" &&
  !!(globalThis as any).chrome?.runtime?.id &&
  !!(globalThis as any).chrome?.storage?.local;

const getFromStorage = async (): Promise<Playlist[]> => {
  if (hasExtensionStorage) {
    const result = await (globalThis as any).chrome.storage.local.get(
      STORAGE_KEY,
    );
    return result?.[STORAGE_KEY] || [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setToStorage = async (playlists: Playlist[]): Promise<void> => {
  if (hasExtensionStorage) {
    await (globalThis as any).chrome.storage.local.set({
      [STORAGE_KEY]: playlists,
    });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
};

export const playlistStore = {
  async getPlaylists(): Promise<Playlist[]> {
    return getFromStorage();
  },

  async savePlaylist(playlist: Playlist): Promise<void> {
    const playlists = await this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === playlist.id);
    if (index > -1) {
      playlists[index] = playlist;
    } else {
      playlists.push(playlist);
    }
    await setToStorage(playlists);
  },

  async deletePlaylist(id: string): Promise<void> {
    const playlists = await this.getPlaylists();
    const filtered = playlists.filter((p) => p.id !== id);
    await setToStorage(filtered);
  },

  async exportPlaylists(): Promise<string> {
    const playlists = await this.getPlaylists();
    return JSON.stringify(playlists, null, 2);
  },

  async importPlaylists(json: string): Promise<void> {
    try {
      const playlists = JSON.parse(json);
      if (Array.isArray(playlists)) {
        // Simple validation
        const isValid = playlists.every(
          (p) => p.id && p.name && Array.isArray(p.tracks),
        );
        if (isValid) {
          await setToStorage(playlists);
        } else {
          throw new Error("Invalid playlist format");
        }
      }
    } catch (e) {
      console.error("Import failed:", e);
      throw e;
    }
  },
};

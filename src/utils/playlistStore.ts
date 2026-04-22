import browser from "webextension-polyfill";
import { Playlist, Track } from "../types";

const STORAGE_KEY = "user_playlists";

export const playlistStore = {
  async getPlaylists(): Promise<Playlist[]> {
    const result = await browser.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  },

  async savePlaylist(playlist: Playlist): Promise<void> {
    const playlists = await this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === playlist.id);
    if (index > -1) {
      playlists[index] = playlist;
    } else {
      playlists.push(playlist);
    }
    await browser.storage.local.set({ [STORAGE_KEY]: playlists });
  },

  async deletePlaylist(id: string): Promise<void> {
    const playlists = await this.getPlaylists();
    const filtered = playlists.filter((p) => p.id !== id);
    await browser.storage.local.set({ [STORAGE_KEY]: filtered });
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
        const isValid = playlists.every(p => p.id && p.name && Array.isArray(p.tracks));
        if (isValid) {
          await browser.storage.local.set({ [STORAGE_KEY]: playlists });
        } else {
          throw new Error("Invalid playlist format");
        }
      }
    } catch (e) {
      console.error("Import failed:", e);
      throw e;
    }
  }
};

import { Track } from "../types";
import browser from "webextension-polyfill";

export const BASE_URL = "https://archive.org/download/tamil-melody-hits/";

export async function fetchTracks(url?: string): Promise<Track[]> {
  try {
    const response = await browser.runtime.sendMessage({
      type: "FETCH_TRACKS",
      url,
    });
    if (response && response.error) {
      throw new Error(response.error);
    }
    return response || [];
  } catch (error) {
    console.error("Error fetching tracks from background:", error);
    throw error;
  }
}

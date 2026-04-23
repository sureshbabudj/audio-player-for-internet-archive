import { Track } from "../types";
import {
  convertToTracks,
  extractIdentifier,
  fetchArchiveMetadata,
} from "./archiveOrg";

export const BASE_URL = "https://archive.org/download/tamil-melody-hits/";

const hasExtensionRuntime =
  typeof globalThis !== "undefined" &&
  !!(globalThis as any).chrome?.runtime?.id &&
  typeof (globalThis as any).chrome?.runtime?.sendMessage === "function";

const fetchTracksInWeb = async (url: string): Promise<Track[]> => {
  const identifier = extractIdentifier(url) || url.match(/\/download\/([^/]+)/)?.[1];

  // Prefer metadata API in web mode because direct directory scraping is usually blocked by CORS.
  if (identifier) {
    const metadata = await fetchArchiveMetadata(identifier);
    const tracksFromMetadata = convertToTracks(metadata);
    if (tracksFromMetadata.length > 0) {
      return tracksFromMetadata;
    }
  }

  // Keep a scraping fallback for environments where the directory endpoint is CORS-enabled.
  const response = await fetch(url);
  const html = await response.text();

  const regex = /href="([^"]+\.mp3)"/g;
  const tracks: Track[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  const fallbackIdentifier =
    url.match(/\/download\/([^/]+)/)?.[1] || "tamil-melody-hits";

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const name = decodeURIComponent(href)
      .replace(".mp3", "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    tracks.push({
      id: `${fallbackIdentifier}-${index++}`,
      name,
      url: (url.endsWith("/") ? url : `${url}/`) + href,
      artwork: `https://archive.org/services/img/${fallbackIdentifier}`,
      artist: "Archive Collection",
      album: fallbackIdentifier.replace(/[_-]/g, " "),
    });
  }

  return tracks;
};

export async function fetchTracks(url?: string): Promise<Track[]> {
  const targetUrl = url || BASE_URL;

  if (!hasExtensionRuntime) {
    return fetchTracksInWeb(targetUrl);
  }

  try {
    const response = await new Promise<any>((resolve) => {
      (globalThis as any).chrome.runtime.sendMessage(
        {
          type: "FETCH_TRACKS",
          url,
        },
        (res: any) => resolve(res),
      );
    });

    if (response && response.error) {
      throw new Error(response.error);
    }

    if (!response) {
      return [];
    }

    return response;
  } catch (error) {
    console.error("Error fetching tracks:", error);
    if (!hasExtensionRuntime) {
      throw new Error(
        "Failed to load tracks in web mode. Archive.org directory pages are often blocked by CORS; metadata API fetch also failed.",
      );
    }
    throw error;
  }
}

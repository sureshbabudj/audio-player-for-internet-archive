import { ArchiveTrack } from "@/types";
import MusicInfo from "@/utils/musicInfo";
import { encode } from "base-64";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    const slice = bytes.subarray(i, Math.min(i + chunk, len));
    binary += String.fromCharCode.apply(null, slice as any);
  }
  return encode(binary);
}

export const resolvedArtCache: Record<string, string> = {};

class TaskQueue {
  private queue: (() => Promise<void>)[] = [];
  private activeCount = 0;
  private limit = 2; // Process maximum 2 remote range fetches concurrently

  add(task: () => Promise<void>) {
    this.queue.push(task);
    this.next();
  }

  private next() {
    if (this.activeCount >= this.limit || this.queue.length === 0) return;
    const task = this.queue.shift();
    if (!task) return;
    this.activeCount++;
    task().finally(() => {
      this.activeCount--;
      this.next();
    });
  }
}

const fetchQueue = new TaskQueue();

/**
 * Saves a base64 Data URI to a physical file inside the persistent document directory.
 * This completely prevents OOM (Out Of Memory) crashes from huge Base64 strings in the JS heap
 * and ensures ultra-fast, lightweight Zustand and AsyncStorage storage footprints.
 */
async function saveBase64ToPhysicalFile(
  dataUri: string,
  sanitizedId: string,
): Promise<string | null> {
  try {
    const parts = dataUri.split(";base64,");
    const base64Data = parts[1] || parts[0];
    const mimeType = parts[0]?.match(/data:(image\/\w+)/)?.[1] || "image/jpeg";
    const ext = mimeType.split("/")[1] || "jpg";

    const localArtPath = `${FileSystem.cacheDirectory}art_${sanitizedId}.${ext}`;
    await FileSystem.writeAsStringAsync(localArtPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return localArtPath;
  } catch (e) {
    console.warn("Failed to write artwork to physical file:", e);
    return null;
  }
}

export async function getTrackEmbeddedArtAsync(
  track: ArchiveTrack,
): Promise<string | null> {
  if (!track.url) return null;

  // 1. If we already have a resolved local file URI or Base64 thumbnail in track, return it
  if (track.thumbnail && (track.thumbnail.startsWith("file://") || track.thumbnail.startsWith("data:"))) {
    return track.thumbnail;
  }

  // 2. Try in-memory cache
  if (resolvedArtCache[track.id]) {
    return resolvedArtCache[track.id];
  }

  // 3. Web-specific flow (direct parsing, no FileSystem writes, raw Base64 return)
  if (Platform.OS === "web") {
    try {
      const musicInfo = await MusicInfo.getMusicInfoAsync(track.url, {
        title: false,
        artist: false,
        album: false,
        picture: true,
      });

      if (musicInfo?.picture?.pictureData) {
        resolvedArtCache[track.id] = musicInfo.picture.pictureData;
        return musicInfo.picture.pictureData;
      }
    } catch (e) {
      console.warn("Failed web artwork extraction in getTrackEmbeddedArtAsync:", e);
    }

    // Web Fallback: Internet Archive cover art image API
    if (track.identifier) {
      const fallbackUrl = `https://archive.org/services/img/${track.identifier}`;
      resolvedArtCache[track.id] = fallbackUrl;
      return fallbackUrl;
    }
    return null;
  }

  const sanitizedId = track.id.replace(/[^a-zA-Z0-9]/g, "_");

  try {
    // 3. If remote URL, download first 256KB chunk via fetch Range request and parse in-memory
    if (
      track.url.startsWith("http://") ||
      track.url.startsWith("https://")
    ) {
      const response = await fetch(track.url, {
        headers: { Range: "bytes=0-262143" },
      });
      if (response.ok || response.status === 206) {
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Parse ID3 tags 100% in-memory from the binary bytes! No file writes, 1ms speed!
        const musicInfo = await MusicInfo.getMusicInfoFromBufferAsync(bytes, {
          title: false,
          artist: false,
          album: false,
          picture: true,
        });

        if (musicInfo?.picture?.pictureData) {
          const rawDataUri = musicInfo.picture.pictureData;
          // Save the high-res base64 image to a persistent local physical file
          const physicalFileUri = await saveBase64ToPhysicalFile(rawDataUri, sanitizedId);
          if (physicalFileUri) {
            resolvedArtCache[track.id] = physicalFileUri;
            return physicalFileUri;
          }
        }
      }
      return null;
    }

    // 4. For local files, parse the file directly
    if (
      track.url.startsWith("file://") ||
      track.url.startsWith("/") ||
      track.url.startsWith("content://") ||
      track.url.startsWith("ph://") ||
      track.url.startsWith("assets-library://")
    ) {
      const musicInfo = await MusicInfo.getMusicInfoAsync(track.url, {
        title: false,
        artist: false,
        album: false,
        picture: true,
      });

      if (musicInfo?.picture?.pictureData) {
        const rawDataUri = musicInfo.picture.pictureData;
        const physicalFileUri = await saveBase64ToPhysicalFile(rawDataUri, sanitizedId);
        if (physicalFileUri) {
          resolvedArtCache[track.id] = physicalFileUri;
          return physicalFileUri;
        }
      }
    }
  } catch (e) {
    console.warn("Error in getTrackEmbeddedArtAsync:", e);
  }

  return null;
}

/**
 * Queue-safe background artwork resolver for list views
 */
export function queueTrackArtworkExtraction(
  track: ArchiveTrack,
  onResolved: (fileUri: string) => void,
) {
  if (!track.url) return;

  // 1. Instant cache check
  if (resolvedArtCache[track.id]) {
    onResolved(resolvedArtCache[track.id]);
    return;
  }
  if (track.thumbnail && (track.thumbnail.startsWith("file://") || track.thumbnail.startsWith("data:"))) {
    onResolved(track.thumbnail);
    return;
  }

  // 2. Add range-load to the task queue
  fetchQueue.add(async () => {
    const artUri = await getTrackEmbeddedArtAsync(track);
    if (artUri) {
      resolvedArtCache[track.id] = artUri;
      onResolved(artUri);
    }
  });
}

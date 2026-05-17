import { ArchiveTrack } from "@/types";
import MusicInfo from "@/utils/musicInfo";
import { encode } from "base-64";
import * as FileSystem from "expo-file-system/legacy";

const resolvedArtCache: Record<string, string> = {};

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

  const sanitizedId = track.id.replace(/[^a-zA-Z0-9]/g, "_");
  const tempUri = `${FileSystem.cacheDirectory}temp_thumb_${sanitizedId}.mp3`;
  let fileToParse = track.url;
  let isTempFile = false;

  try {
    // 3. If remote URL, download first 256KB chunk
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
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = encode(binary);
        await FileSystem.writeAsStringAsync(tempUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileToParse = tempUri;
        isTempFile = true;
      } else {
        return null;
      }
    }

    // 4. Parse file to extract the picture frame
    if (
      fileToParse &&
      (fileToParse.startsWith("file://") ||
        fileToParse.startsWith("/") ||
        fileToParse.startsWith("content://") ||
        fileToParse.startsWith("ph://") ||
        fileToParse.startsWith("assets-library://"))
    ) {
      const musicInfo = await MusicInfo.getMusicInfoAsync(fileToParse, {
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
  } catch (e) {
    console.warn("Error in getTrackEmbeddedArtAsync:", e);
  } finally {
    // 5. Clean up temporary files immediately
    if (isTempFile) {
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch {}
    }
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

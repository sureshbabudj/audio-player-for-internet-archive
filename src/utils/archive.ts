import { ArchiveItem, ArchiveTrack } from "@/types";

const AUDIO_FORMATS = ["mp3", "ogg", "flac", "wav", "m4a", "aac"];

function getCreator(doc: any): string {
  const creator = doc.artist || doc.creator;
  if (Array.isArray(creator)) {
    return creator[0] || "Internet Archive";
  }
  if (typeof creator === "string") {
    return creator;
  }

  // Fallback to uploader if creator is missing
  if (doc.uploader) {
    // Sanitize email if uploader is an email
    return (
      doc.uploader.split("@")[0].replace(/[._-]/g, " ") || "Internet Archive"
    );
  }

  return "Internet Archive";
}

export async function searchArchive(
  query: string,
  signal?: AbortSignal,
): Promise<ArchiveItem[]> {
  if (!query.trim()) return [];

  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
    query,
  )}+AND+mediatype:audio&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&sort[]=downloads+desc&rows=15&output=json`;

  const response = await fetch(url, { signal });
  const data = await response.json();

  if (!data.response?.docs) return [];

  return data.response.docs.map((doc: any) => ({
    identifier: doc.identifier,
    title: doc.title || doc.identifier,
    creator: getCreator(doc),
    thumbnail: `https://archive.org/services/img/${doc.identifier}/__ia_thumb.jpg`,
    date: doc.year,
  }));
}

export async function fetchItemTracks(
  item: ArchiveItem,
  signal?: AbortSignal,
): Promise<ArchiveTrack[]> {
  const metaUrl = `https://archive.org/metadata/${item.identifier}`;
  const response = await fetch(metaUrl, { signal });
  const meta = await response.json();

  if (!meta.files) return [];

  const imageFile = meta.files.find(
    (f: any) =>
      f.format === "Item Image" ||
      (f.name.toLowerCase().endsWith(".jpg") &&
        !f.name.toLowerCase().includes("thumb")),
  );

  const thumbnail = imageFile
    ? `https://archive.org/download/${item.identifier}/${imageFile.name}`
    : `https://archive.org/services/img/${item.identifier}`;

  const audioFiles = meta.files.filter((f: any) =>
    AUDIO_FORMATS.some((ext) => f.name.toLowerCase().endsWith(ext)),
  );
  return audioFiles.map((file: any) => ({
    id: `${item.identifier}_${file.name}`,
    identifier: item.identifier,
    title: file.title || file.name,
    creator: item.creator,
    url: `https://archive.org/download/${encodeURIComponent(
      item.identifier,
    )}/${encodeURIComponent(file.name)}`,
    thumbnail: thumbnail,
    date: item.date,
    collection: [item.identifier],
    fileName: file.name,
    duration: file.duration ? parseFloat(file.duration) : undefined,
  }));
}

export async function getItemMetadata(
  identifier: string,
): Promise<ArchiveItem> {
  const metaUrl = `https://archive.org/metadata/${identifier}`;
  const response = await fetch(metaUrl);
  const meta = await response.json();

  const imageFile = meta.files?.find(
    (f: any) =>
      f.format === "Item Image" ||
      (f.name.toLowerCase().endsWith(".jpg") &&
        !f.name.toLowerCase().includes("thumb")),
  );

  const thumbnail = imageFile
    ? `https://archive.org/download/${identifier}/${imageFile.name}`
    : `https://archive.org/services/img/${identifier}`;

  return {
    identifier: identifier,
    title: meta.metadata?.title || "Untitled",
    creator: getCreator(meta.metadata || {}),
    thumbnail: thumbnail,
    date: meta.metadata?.date,
  };
}

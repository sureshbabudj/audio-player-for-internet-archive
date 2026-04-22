// src/utils/archiveOrg.ts
import { Track } from "../types";

const API_BASE = "https://archive.org/metadata";

export interface ArchiveFile {
  name: string;
  format: string;
  length?: string;
  title?: string;
  artist?: string;
  creator?: string;
  album?: string;
  size?: string;
}

export interface ArchiveResponse {
  metadata: {
    identifier: string;
    title: string;
    creator?: string;
    album?: string;
    description?: string;
  };
  server: string;
  dir: string;
  files: ArchiveFile[];
}

export async function fetchArchiveMetadata(
  identifier: string,
): Promise<ArchiveResponse> {
  const response = await fetch(`${API_BASE}/${identifier}`);
  if (!response.ok)
    throw new Error(`Failed to fetch metadata for ${identifier}`);
  return response.json();
}

export function parseDuration(length?: string): number {
  if (!length) return -1;
  const parts = length.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Math.floor(Number(length)) || -1;
}

export function extractIdentifier(url: string): string | null {
  const match = url.match(/\/(?:details|download)\/([^/?#]+)/);
  return match?.[1] || null;
}

export function convertToTracks(
  response: ArchiveResponse,
): Track[] {
  const { server, dir, files, metadata } = response;
  const audioFormats = ["MP3", "VBR MP3", "MPEG-4 AUDIO", "FLAC", "WAVE"];

  return files
    .filter((file) => {
      const fmt = file.format?.toUpperCase();
      return audioFormats.some(audioFmt => fmt?.includes(audioFmt));
    })
    .map((file, index) => ({
      id: `${metadata.identifier}-${index}`,
      name: file.title || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
      url: `https://${server}${dir}/${file.name}`,
      artwork: `https://archive.org/services/img/${metadata.identifier}`,
      duration: parseDuration(file.length),
      playlistId: metadata.identifier,
      artist: file.artist || file.creator || metadata.creator || "Unknown Artist",
      album: file.album || metadata.album || metadata.title || "Archive Collection",
    }));
}

/* eslint-disable @typescript-eslint/no-require-imports */
import { encode } from "base-64";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const BASE64_LOOKUP = new Uint8Array(256);
const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}
BASE64_LOOKUP[45] = 62; // -
BASE64_LOOKUP[95] = 63; // _

function base64ToUint8Array(base64: string): Uint8Array {
  let len = base64.length;
  if (base64.endsWith("==")) len -= 2;
  else if (base64.endsWith("=")) len -= 1;

  const bytes = new Uint8Array((base64.length * 3) / 4);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = BASE64_LOOKUP[base64.charCodeAt(i)];
    const encoded2 = BASE64_LOOKUP[base64.charCodeAt(i + 1)];
    const encoded3 = BASE64_LOOKUP[base64.charCodeAt(i + 2)];
    const encoded4 = BASE64_LOOKUP[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes.subarray(0, p);
}

/* -------------------------------------------------------
 * Types & Interfaces
 * ----------------------------------------------------- */

export interface MusicInfoOptions {
  title?: boolean;
  artist?: boolean;
  album?: boolean;
  genre?: boolean;
  picture?: boolean;
}

export interface PictureFrame {
  description: string;
  pictureData: string; // base64 data URL
}

export interface MusicInfoResponse {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  picture?: PictureFrame;
}

/* -------------------------------------------------------
 * Constants
 * ----------------------------------------------------- */

const BUFFER_SIZE = 256 * 1024;

const EMPTY = "";
const ID3_TOKEN = "ID3";
const TITLE_TOKEN = "TIT2";
const ARTIST_TOKEN = "TPE1";
const ALBUM_TOKEN = "TALB";
const GENRE_TOKEN = "TCON";
const PICTURE_TOKEN = "APIC";

/* -------------------------------------------------------
 * Buffer Helper
 * ----------------------------------------------------- */

class BufferReader {
  cursor = 0;
  size = 0;
  data: Uint8Array | null = null;

  finished(): boolean {
    return this.cursor >= this.size;
  }

  getByte(): number {
    return this.data![this.cursor++];
  }

  move(length: number): number {
    const start = this.cursor;
    this.cursor = Math.min(this.cursor + length, this.size);
    return this.cursor - start;
  }

  setData(data: Uint8Array) {
    this.data = data;
    this.size = data.length;
    this.cursor = 0;
  }
}

/* -------------------------------------------------------
 * Main MusicInfo API
 * ----------------------------------------------------- */

async function fetchFirstChunkAsBlob(
  url: string,
  chunkSize = 256 * 1024,
): Promise<Blob | null> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return await response.blob();
  }

  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (receivedLength >= chunkSize) {
        await reader.cancel(
          "We only need the first chunk for metadata parsing.",
        );
        break;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    // Gracefully handle reader cancel interrupt
  }

  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return new Blob([allChunks.subarray(0, chunkSize)], { type: "audio/mpeg" });
}

export default class MusicInfo {
  static async getMusicInfoAsync(
    fileUri: string,
    options?: MusicInfoOptions,
  ): Promise<MusicInfoResponse | null> {
    if (Platform.OS === "web") {
      try {
        const jsmediatags = require("jsmediatags/dist/jsmediatags.min.js");

        let mediaInput: Blob | string = fileUri;

        if (fileUri.startsWith("http")) {
          try {
            const blob = await fetchFirstChunkAsBlob(fileUri);
            if (blob) {
              mediaInput = blob;
            }
          } catch (e) {
            console.warn(
              "Failed to fetch streaming chunk on web, attempting direct read:",
              e,
            );
          }
        }

        return await new Promise<MusicInfoResponse | null>((resolve) => {
          jsmediatags.read(mediaInput, {
            onSuccess: (tag: any) => {
              const response: MusicInfoResponse = {};
              if (tag.tags) {
                if (options?.title !== false && tag.tags.title)
                  response.title = tag.tags.title;
                if (options?.artist !== false && tag.tags.artist)
                  response.artist = tag.tags.artist;
                if (options?.album !== false && tag.tags.album)
                  response.album = tag.tags.album;
                if (options?.genre !== false && tag.tags.genre)
                  response.genre = tag.tags.genre;
                if (options?.picture !== false && tag.tags.picture) {
                  try {
                    const bytes = new Uint8Array(tag.tags.picture.data);
                    const format = tag.tags.picture.format || "image/jpeg";
                    // Standard mime type normalize
                    const mimeType = format.includes("/")
                      ? format
                      : `image/${format}`;
                    const blob = new Blob([bytes], { type: mimeType });
                    const blobUrl = URL.createObjectURL(blob);

                    response.picture = {
                      description: tag.tags.picture.description || "",
                      pictureData: blobUrl,
                    };
                  } catch (err) {
                    console.warn(
                      "Failed converting picture in MusicInfo:",
                      err,
                    );
                  }
                }
              }
              resolve(response);
            },
            onError: (error: any) => {
              console.warn(
                "MusicInfo web parsing failed via jsmediatags:",
                error,
              );
              resolve(null);
            },
          });
        });
      } catch (err) {
        console.warn(
          "Failed to load or read jsmediatags dynamically on web:",
          err,
        );
        return null;
      }
    }

    const loader = new MusicInfoLoader(fileUri, options);
    return loader.loadInfo();
  }

  static async getThumbnailAsync(
    fileUri: string,
  ): Promise<MusicInfoResponse | null> {
    return MusicInfo.getMusicInfoAsync(fileUri, {
      title: false,
      artist: false,
      album: false,
      genre: false,
      picture: true,
    });
  }

  static async getMusicInfoFromBufferAsync(
    buffer: Uint8Array,
    options?: MusicInfoOptions,
  ): Promise<MusicInfoResponse | null> {
    const loader = new MusicInfoLoader(null, options, buffer);
    return loader.loadInfo();
  }
}

/* -------------------------------------------------------
 * Loader Class
 * ----------------------------------------------------- */

class MusicInfoLoader {
  private fileUri: string | null;
  private memoryBuffer: Uint8Array | null;
  private options: Required<MusicInfoOptions>;
  private expectedFramesNumber = 0;

  private buffer = new BufferReader();
  private filePosition = 0;
  private dataSize = 0;
  private frames: Record<string, any> = {};
  private version = 0;
  private finished = false;

  constructor(
    fileUri: string | null,
    options?: MusicInfoOptions,
    memoryBuffer?: Uint8Array | null,
  ) {
    this.fileUri = fileUri;
    this.memoryBuffer = memoryBuffer || null;

    this.options = {
      title: options?.title ?? true,
      artist: options?.artist ?? true,
      album: options?.album ?? true,
      genre: options?.genre ?? false,
      picture: options?.picture ?? false,
    };

    Object.values(this.options).forEach((v) => {
      if (v) this.expectedFramesNumber++;
    });
  }

  /* -------------------------------------------------------
   * File Loading
   * ----------------------------------------------------- */

  private async loadFileToBuffer() {
    if (this.memoryBuffer) {
      this.buffer.setData(this.memoryBuffer);
      this.filePosition += this.memoryBuffer.length;
      return;
    }

    const data = await FileSystem.readAsStringAsync(this.fileUri!, {
      encoding: FileSystem.EncodingType.Base64,
      position: this.filePosition,
      length: BUFFER_SIZE,
    });

    const bytes = base64ToUint8Array(data);
    this.buffer.setData(bytes);
    this.filePosition += BUFFER_SIZE;
  }

  /* -------------------------------------------------------
   * Main Processing
   * ----------------------------------------------------- */

  async loadInfo(): Promise<MusicInfoResponse | null> {
    if (this.memoryBuffer) {
      this.dataSize = this.memoryBuffer.length;
    } else {
      const info = await FileSystem.getInfoAsync(this.fileUri!);
      this.dataSize = info.exists ? info.size : 0;
    }

    try {
      await this.process();

      const result: MusicInfoResponse = {};

      if (this.options.title && this.frames[TITLE_TOKEN])
        result.title = this.frames[TITLE_TOKEN];

      if (this.options.artist && this.frames[ARTIST_TOKEN])
        result.artist = this.frames[ARTIST_TOKEN];

      if (this.options.album && this.frames[ALBUM_TOKEN])
        result.album = this.frames[ALBUM_TOKEN];

      if (this.options.genre && this.frames[GENRE_TOKEN])
        result.genre = this.frames[GENRE_TOKEN];

      if (this.options.picture && this.frames[PICTURE_TOKEN])
        result.picture = this.frames[PICTURE_TOKEN];

      return result;
    } catch (e) {
      if (e instanceof InvalidFileException) return null;
      throw e;
    }
  }

  private async process() {
    await this.processHeader();
    while (!this.finished) {
      await this.processFrame();
    }
  }

  /* -------------------------------------------------------
   * Read Helpers
   * ----------------------------------------------------- */

  private async skip(length: number) {
    let remaining = length;

    while (remaining > 0) {
      if (this.buffer.finished()) {
        if (this.filePosition >= this.dataSize) {
          this.finished = true;
          break;
        }
        this.filePosition += remaining;
        await this.loadFileToBuffer();
        remaining = 0;
      } else {
        remaining -= this.buffer.move(remaining);
      }
    }
  }

  private async read(length: number): Promise<number[]> {
    const chunk: number[] = [];

    for (let i = 0; i < length; i++) {
      if (this.buffer.finished()) {
        if (this.filePosition >= this.dataSize) {
          this.finished = true;
          break;
        }
        await this.loadFileToBuffer();
      }
      chunk.push(this.buffer.getByte());
    }
    return chunk;
  }

  private async readUntilEnd(): Promise<number[]> {
    const chunk: number[] = [];
    let byte = 0;

    do {
      if (this.buffer.finished()) {
        if (this.filePosition >= this.dataSize) {
          this.finished = true;
          break;
        }
        await this.loadFileToBuffer();
      }
      byte = this.buffer.getByte();
      chunk.push(byte);
    } while (byte !== 0);

    return chunk;
  }

  /* -------------------------------------------------------
   * Header Parsing
   * ----------------------------------------------------- */

  private async processHeader() {
    let chunk = await this.read(3);
    const token = this.bytesToString(chunk);

    if (token !== ID3_TOKEN) throw new InvalidFileException();

    chunk = await this.read(2);
    this.version = this.bytesToInt([chunk[0]]);

    await this.skip(1);

    chunk = await this.read(4);
    let size = 0;

    for (let i = 0; i < chunk.length; i++) {
      size |= chunk[chunk.length - i - 1] << (i * 7);
    }

    this.dataSize = size;
  }

  /* -------------------------------------------------------
   * Frame Parsing
   * ----------------------------------------------------- */

  private async processFrame() {
    const idBytes = await this.read(4);
    const frameID = this.bytesToString(idBytes);

    if (frameID === EMPTY) {
      this.finished = true;
      return;
    }

    const sizeBytes = await this.read(4);
    const frameSize = this.bytesToSize(sizeBytes);

    await this.skip(2);

    switch (frameID) {
      case TITLE_TOKEN:
      case ARTIST_TOKEN:
      case ALBUM_TOKEN:
      case GENRE_TOKEN:
        if (this.options[this.mapFrameToOption(frameID)])
          await this.processTextFrame(frameID, frameSize);
        else await this.skip(frameSize);
        break;

      case PICTURE_TOKEN:
        if (this.options.picture) await this.processPictureFrame(frameSize);
        else await this.skip(frameSize);
        break;

      default:
        await this.skip(frameSize);
        break;
    }

    if (Object.keys(this.frames).length === this.expectedFramesNumber)
      this.finished = true;
  }

  private mapFrameToOption(frameID: string): keyof MusicInfoOptions {
    switch (frameID) {
      case TITLE_TOKEN:
        return "title";
      case ARTIST_TOKEN:
        return "artist";
      case ALBUM_TOKEN:
        return "album";
      case GENRE_TOKEN:
        return "genre";
      default:
        return "title";
    }
  }

  private async processTextFrame(frameID: string, frameSize: number) {
    await this.skip(1);
    const remaining = frameSize - 1;
    const chunk = await this.read(remaining);
    this.frames[frameID] = this.bytesToString(chunk);
  }

  private async processPictureFrame(frameSize: number) {
    await this.skip(1);
    let remaining = frameSize - 1;

    let chunk = await this.readUntilEnd();
    remaining -= chunk.length;
    const mimeType = this.bytesToString(chunk);

    await this.skip(1);
    remaining -= 1;

    chunk = await this.readUntilEnd();
    remaining -= chunk.length;
    const description = this.bytesToString(chunk);

    const pictureData = await this.read(remaining);

    this.frames[PICTURE_TOKEN] = {
      description,
      pictureData: `data:${mimeType};base64,${this.bytesToBase64(pictureData)}`,
    };
  }

  /* -------------------------------------------------------
   * Byte Utilities
   * ----------------------------------------------------- */

  private bytesToString(bytes: number[]): string {
    return bytes
      .filter((b) => b >= 32 && b <= 126)
      .map((b) => String.fromCharCode(b))
      .join("");
  }

  private bytesToInt(bytes: number[]): number {
    return bytes.reduce(
      (acc, b, i) => acc | (bytes[bytes.length - i - 1] << (i * 8)),
      0,
    );
  }

  private bytesToSize(bytes: number[]): number {
    if (this.version === 3) return this.bytesToInt(bytes);

    return bytes.reduce(
      (acc, b, i) => acc | (bytes[bytes.length - i - 1] << (i * 7)),
      0,
    );
  }

  private bytesToBase64(bytes: number[]): string {
    const s = bytes.map((b) => String.fromCharCode(b)).join("");
    return encode(s);
  }
}

/* -------------------------------------------------------
 * Custom Error
 * ----------------------------------------------------- */

class InvalidFileException extends Error {
  constructor() {
    super("Invalid file format.");
    this.name = "InvalidFileException";
  }
}

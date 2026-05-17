import { decode, encode } from "base-64";
import * as FileSystem from "expo-file-system/legacy";

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

export default class MusicInfo {
  static async getMusicInfoAsync(
    fileUri: string,
    options?: MusicInfoOptions,
  ): Promise<MusicInfoResponse | null> {
    const loader = new MusicInfoLoader(fileUri, options);
    return loader.loadInfo();
  }
}

/* -------------------------------------------------------
 * Loader Class
 * ----------------------------------------------------- */

class MusicInfoLoader {
  private fileUri: string;
  private options: Required<MusicInfoOptions>;
  private expectedFramesNumber = 0;

  private buffer = new BufferReader();
  private filePosition = 0;
  private dataSize = 0;
  private frames: Record<string, any> = {};
  private version = 0;
  private finished = false;

  constructor(fileUri: string, options?: MusicInfoOptions) {
    this.fileUri = fileUri;

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
    const data = await FileSystem.readAsStringAsync(this.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: this.filePosition,
      length: BUFFER_SIZE,
    });

    const bytes = Uint8Array.from(decode(data), (c) => c.charCodeAt(0));
    this.buffer.setData(bytes);
    this.filePosition += BUFFER_SIZE;
  }

  /* -------------------------------------------------------
   * Main Processing
   * ----------------------------------------------------- */

  async loadInfo(): Promise<MusicInfoResponse | null> {
    const info = await FileSystem.getInfoAsync(this.fileUri);
    this.dataSize = info.exists ? info.size : 0;

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

# 🎵 Audio Player for Internet Archive

A premium, high-fidelity music player extension designed for seamless streaming from Archive.org. Built with a focus on visual excellence, persistent playback, and advanced metadata management.

## ✨ Key Functionalities

### 🎧 Persistent Background Playback

- **Non-Stop Music**: Audio continues playing in a dedicated background service worker even after you close the popup.
- **Smart Session Recovery**: Automatically restores your exact state—including the active track, queue, and playback timestamp—the moment you reopen the player.
- **Initialization Guard**: Prevents race conditions during startup to ensure your saved queue is never lost.

### 📂 Advanced Playlist Management

- **Featured Collections**: Access a curated list of high-quality default playlists.
- **Custom Imports**: Add any Archive.org collection by simply pasting the URL or item identifier.
- **User Collections**: Create and manage your own custom playlists locally.
- **Backup & Restore**: Export your entire library of playlists as a single JSON file and restore it on any device.

### 📑 Smart Metadata & UI

- **Embedded Tag Extraction**: Automatically extracts **Artist**, **Album**, and **Title** metadata from Archive.org's internal file parsing.
- **Dynamic Artwork**: Fetches high-resolution collection imagery for every track.
- **Intelligent Queue**: The playlist automatically scrolls to keep the currently playing song centered in view upon opening the tab.
- **Visual Feedback**: Integrated real-time visualizer bars that respond to playback.

### 🎨 Visual Excellence & UX

- **Glassmorphism Design**: A sleek, modern interface with backdrop blurs and subtle borders.
- **3D Animations**: Dynamic 3D-transformed album art and smooth interface transitions.
- **Multi-Tab Navigation**: Intuitive horizontal-scrolling navigation for Browse, Library, Settings, and Help.
- **Responsive Controls**: Full support for Shuffle, Repeat modes (All/One), Volume management, and precise seeking.

### 🖥️ Technical Features

- **Cross-Browser Support**: Optimized for Chrome (Manifest V3) and Firefox (Manifest V2).
- **High Performance**: Minimal memory footprint using Vite-optimized builds and efficient React state synchronization.
- **No Placeholders**: Real images and dynamic data used throughout for a premium feel.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mp3-player-extension.git
cd mp3-player

# Install dependencies
pnpm install

# Build the extension
pnpm run build
```

### Load into Browser

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder from the project directory

## 🛠️ Built With

- **Framework**: React 18 + TypeScript
- **Styling**: Vanilla CSS + Tailwind Utility Classes
- **Icons**: Iconify Solar Collection
- **Build Tool**: Vite 5
- **Streaming**: Archive.org Metadata API

---

**Enjoy a premium music experience powered by the world's largest open-source library.** 🎶

# 🎵 Audio Player for Internet Archive

[![GitHub Stars](https://img.shields.io/github/stars/sureshbabudj/audio-player-for-internet-archive?style=for-the-badge&color=e94560)](https://github.com/sureshbabudj/audio-player-for-internet-archive/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/sureshbabudj/audio-player-for-internet-archive?style=for-the-badge&color=e94560)](https://github.com/sureshbabudj/audio-player-for-internet-archive/issues)
[![GitHub License](https://img.shields.io/github/license/sureshbabudj/audio-player-for-internet-archive?style=for-the-badge&color=e94560)](https://github.com/sureshbabudj/audio-player-for-internet-archive/blob/master/LICENSE)

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
git clone https://github.com/sureshbabudj/audio-player-for-internet-archive.git
cd audio-player-for-internet-archive

# Install dependencies
pnpm install

# Build the extension
pnpm run build

# Build the PWA
pnpm run build:pwa

# Build GitHub Pages bundle
pnpm run build:pages

# Build all release artifacts in one command
pnpm run build:release
```

### Run Targets

```bash
# Browser extension (Chrome MV3 default)
pnpm run dev

# Browser extension (Firefox MV2)
pnpm run dev:firefox

# PWA web app
pnpm run dev:pwa

# Preview GitHub Pages build locally
pnpm run preview:pages
```

### Release Output

Running `pnpm run build:release` creates a `release/` folder with:

- `release/extension-chrome`
- `release/extension-firefox`
- `release/pwa`
- `release/pages`

### GitHub Pages Deployment

GitHub Actions workflow is included at `.github/workflows/deploy-pages.yml`.

1. Open your GitHub repository settings.
2. Go to **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or `master`.
5. The workflow builds `dist-pages` and deploys automatically.

The GitHub Actions workflow sets the correct Pages base path automatically from the repository name, so forks do not need manual script edits.

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

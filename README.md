# 🎵 ArchiPlay — Premium Audio Player for Internet Archive

[![Live Demo](https://img.shields.io/badge/Live-Demo-primary?style=for-the-badge&logo=firebase)](https://archieplay.web.app/)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue?style=for-the-badge&logo=expo)](https://expo.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

ArchiPlay is a high-performance, open-source audio player built with **React Native (Expo)**. It provides a premium, ad-free experience for streaming millions of public domain recordings, live concerts, and audiobooks from the [Internet Archive](https://archive.org).

---

## ✨ Features

### 🎧 Core Experience

- **Vast Library**: Seamlessly search and stream from the Internet Archive's massive audio catalog.
- **Personal Collections**: Save your favorite collections and organize tracks into custom playlists.
- **Gapless Playback**: High-quality streaming with background audio support and native media controls.
- **Sleep Timer**: Fall asleep to your favorite music with a customizable native sleep timer (15, 30, 45, 60 mins).

### 🎨 Premium UI/UX

- **Elegant Design**: A sleek, modern interface with vibrant colors and smooth experinece.
- **Responsive Layout**: Fully optimized for **iOS**, **Android**, and **Desktop Web**.
- **Insightful Stats**: Track your listening habits and see your most-played tracks and artists.

### 🔒 Privacy & Freedom

- **Local-First**: All your data (playlists, favorites, history) stays on your device. No account required.
- **Open Source**: Transparent, community-driven, and free forever.
- **Backup & Restore**: Easily export your library as a JSON file and restore it on any device.

---

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (NativeWind v4)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Storage**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Deployment**: [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/sureshbabudj/audio-player-for-internet-archive.git
   cd mp3-player
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

## 📂 Project Structure

- `src/app/`: Expo Router file-based navigation.
- `src/components/`: Reusable UI components (AudioPlayer, Sidebar, etc.).
- `src/store/`: Zustand state management for playback and library logic.
- `src/hooks/`: Custom React hooks for API interaction.
- `src/utils/`: Formatting and helper functions.

---

## 📞 Support & Resources

If you are experiencing issues, have questions, or want to share feedback, we're here to help! Please use the official channels below:

- **Bug Reports & Feature Requests (Recommended)**: Open a ticket on our public [GitHub Issue Tracker](https://github.com/sureshbabudj/audio-player-for-internet-archive/issues).
- **Email Support**: For private assistance or inquiries that cannot be handled publicly, contact us at [archiplay@genaul.com](mailto:archiplay@genaul.com).
- **Web Support**: Visit the online [Support Center](https://archieplay.web.app/support) for web-based help and resources.

### ⚖️ Legal & Content Notice

ArchiPlay is a neutral third-party utility application that accesses metadata, thumbnails, and audio streams in real-time via the official public APIs provided by the **Internet Archive (archive.org)**.

- This application does not host, store, bundle, or modify any third-party media content.
- All streamed content is hosted entirely by the Internet Archive under their respective terms of service and digital rights management.
- To report content issues, copyright concerns, or copyright violations (DMCA) regarding hosted media, please contact the host platform directly at [archive.org](https://archive.org).

---

## 🤝 Contributing

Contributions are welcome! If you have a feature request or found a bug:

1. Open an [Issue](https://github.com/sureshbabudj/audio-player-for-internet-archive/issues).
2. Fork the repo and create a new branch.
3. Submit a Pull Request with a clear description of your changes.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

_Made with ❤️ by [Suresh](https://github.com/sureshbabudj)_

import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((details) => {
  console.log("[MP3 Player] Extension installed", details.reason);
});

// Keep alive for Chrome MV3 service workers
// Firefox ignores alarms in background scripts, so this is safe for both
browser.alarms?.create("keepAlive", { periodInMinutes: 4.9 });

browser.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    console.log("[MP3 Player] Keep alive ping");
  }
});

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Optional: Handle keyboard shortcuts
browser.commands?.onCommand.addListener((command) => {
  if (command === "toggle-play") {
    // Broadcast to popup to toggle playback
    browser.runtime.sendMessage({ type: "TOGGLE_PLAYBACK" }).catch(() => {
      // Popup might not be open, ignore error
    });
  }
});

const BASE_URL = "https://archive.org/download/tamil-melody-hits/";
let tracksList: any[] = [];
let currentAudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  shuffleMode: false,
  repeatMode: "off" as "off" | "all" | "one",
  currentTrack: null as any,
  tracksList: [] as any[],
};

// Check if we need offscreen (Chrome MV3) or can play directly (Firefox MV2)
const useOffscreen = !!(browser as any).offscreen;

async function setupOffscreen() {
  if (!useOffscreen) return;
  if (await (browser as any).offscreen?.hasDocument()) return;
  await (browser as any).offscreen?.createDocument({
    url: "src/offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play audio in the background",
  });
}

let firefoxAudio: HTMLAudioElement | null = null;
if (!useOffscreen) {
  firefoxAudio = new Audio();
  firefoxAudio.ontimeupdate = () => broadcastState();
  firefoxAudio.onplay = () => broadcastState();
  firefoxAudio.onpause = () => broadcastState();
  firefoxAudio.onloadedmetadata = () => broadcastState();
  firefoxAudio.onended = () => handleTrackEnded();
}

function broadcastState() {
  if (!isInitialized) return;

  if (firefoxAudio) {
    currentAudioState = {
      ...currentAudioState,
      isPlaying: !firefoxAudio.paused,
      currentTime: firefoxAudio.currentTime,
      duration: firefoxAudio.duration,
      volume: firefoxAudio.volume,
      isMuted: firefoxAudio.muted,
      tracksList: tracksList,
    };
  } else {
    currentAudioState = {
      ...currentAudioState,
      tracksList: tracksList,
    };
  }

  // Save state to storage for persistence
  // Force save if we just paused or if it's a major sync
  const shouldForce = !currentAudioState.isPlaying;
  saveStateToStorage(shouldForce);

  browser.runtime
    .sendMessage({
      type: "SYNC_STATE",
      state: currentAudioState,
    })
    .catch(() => {});
}

let lastSaveTime = 0;
const SAVE_THROTTLE = 5000; // Save every 5 seconds

async function saveStateToStorage(force = false) {
  const now = Date.now();
  if (!force && now - lastSaveTime < SAVE_THROTTLE) return;

  lastSaveTime = now;
  try {
    await browser.storage.local.set({
      audioState: {
        ...currentAudioState,
        isPlaying: false, // Don't persist playing state
        tracksList: tracksList,
      },
    });
  } catch (err) {
    console.error("Failed to save state", err);
  }
}

async function loadStateFromStorage() {
  try {
    const data = await browser.storage.local.get("audioState");
    if (data.audioState) {
      const saved = data.audioState;
      tracksList = saved.tracksList || [];
      currentAudioState = {
        ...saved,
        isPlaying: false, // Always start paused
      };

      // If we have a current track, we need to set its source but not play
      if (currentAudioState.currentTrack && firefoxAudio) {
        firefoxAudio.src = currentAudioState.currentTrack.url;
        firefoxAudio.currentTime = currentAudioState.currentTime || 0;
      }

      console.log("[MP3 Player] State restored from storage");
    }
  } catch (err) {
    console.error("Failed to load state", err);
  } finally {
    isInitialized = true;
    // If we have no tracks after loading storage, fetch defaults
    if (tracksList.length === 0) {
      fetchTracksFromArchive().then(tracks => {
        tracksList = tracks;
        broadcastState();
      });
    }
  }
}

// Initialize persistence
initializationPromise = loadStateFromStorage();

async function fetchTracksFromArchive() {
  const response = await fetch(BASE_URL);
  const html = await response.text();

  const regex = /href="([^"]+\.mp3)"/g;
  const tracks: any[] = [];
  let match;
  let index = 0;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const name = decodeURIComponent(href)
      .replace(".mp3", "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    tracks.push({
      id: index++,
      name,
      url: BASE_URL + href,
      artwork: `https://archive.org/services/img/tamil-melody-hits`,
    });
  }
  return tracks;
}

function getNextTrack() {
  if (!currentAudioState.currentTrack || tracksList.length === 0) return null;

  if (currentAudioState.repeatMode === "one") {
    return currentAudioState.currentTrack;
  }

  if (currentAudioState.shuffleMode) {
    const randomIndex = Math.floor(Math.random() * tracksList.length);
    return tracksList[randomIndex];
  }

  const currentIndex = tracksList.findIndex(
    (t) => t.id === currentAudioState.currentTrack?.id,
  );
  if (currentIndex === -1) return tracksList[0];

  const nextIndex = currentIndex + 1;
  if (nextIndex >= tracksList.length) {
    return currentAudioState.repeatMode === "all" ? tracksList[0] : null;
  }
  return tracksList[nextIndex];
}

function getPreviousTrack() {
  if (!currentAudioState.currentTrack || tracksList.length === 0) return null;

  if (currentAudioState.shuffleMode) {
    const randomIndex = Math.floor(Math.random() * tracksList.length);
    return tracksList[randomIndex];
  }

  const currentIndex = tracksList.findIndex(
    (t) => t.id === currentAudioState.currentTrack?.id,
  );
  if (currentIndex === -1) return tracksList[tracksList.length - 1];

  const prevIndex = currentIndex - 1;
  if (prevIndex < 0) {
    return currentAudioState.repeatMode === "all"
      ? tracksList[tracksList.length - 1]
      : null;
  }
  return tracksList[prevIndex];
}

async function playTrack(track: any) {
  if (!track) return;
  currentAudioState.currentTrack = track;
  if (useOffscreen) {
    await setupOffscreen();
    browser.runtime.sendMessage({
      type: "PLAY_TRACK",
      target: "offscreen",
      url: track.url,
      track,
    });
  } else if (firefoxAudio) {
    firefoxAudio.src = track.url;
    firefoxAudio.play();
  }
  broadcastState();
  saveStateToStorage(true); // Force save on track change
}

function handleTrackEnded() {
  const nextTrack = getNextTrack();
  if (nextTrack) {
    playTrack(nextTrack);
  } else {
    currentAudioState.isPlaying = false;
    broadcastState();
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING") {
    (sendResponse as any)({ status: "alive" });
    return true;
  }

  if (message.type === "FETCH_TRACKS") {
    fetchTracksFromArchive()
      .then((tracks) => (sendResponse as any)(tracks))
      .catch((error) => (sendResponse as any)({ error: error.message }));
    return true;
  }

  if (message.type === "GET_AUDIO_STATE") {
    const respond = async () => {
      if (!isInitialized && initializationPromise) await initializationPromise;
      return { ...currentAudioState, tracksList };
    };
    respond().then(sendResponse);
    return true;
  }

  if (message.type === "PLAY_TRACK") {
    playTrack(message.track);
    saveStateToStorage(true);
    return true;
  }

  if (message.type === "UPDATE_TRACKS_LIST") {
    tracksList = message.tracks;
    broadcastState();
    saveStateToStorage(true);
    return true;
  }

  if (message.type === "PLAY_NEXT") {
    const next = getNextTrack();
    if (next) playTrack(next);
    return true;
  }

  if (message.type === "PLAY_PREVIOUS") {
    const prev = getPreviousTrack();
    if (prev) playTrack(prev);
    return true;
  }

  if (message.type === "TOGGLE_PLAY") {
    if (!currentAudioState.currentTrack && tracksList.length > 0) {
      playTrack(tracksList[0]);
    } else {
      if (useOffscreen) {
        browser.runtime.sendMessage({
          type: "TOGGLE_PLAY",
          target: "offscreen",
        });
      } else if (firefoxAudio) {
        if (firefoxAudio.paused) firefoxAudio.play();
        else firefoxAudio.pause();
      }
    }
    return true;
  }

  if (message.type === "SET_VOLUME") {
    currentAudioState.volume = message.volume;
    if (useOffscreen) {
      browser.runtime.sendMessage({ ...message, target: "offscreen" });
    } else if (firefoxAudio) {
      firefoxAudio.volume = message.volume;
    }
    broadcastState();
    return true;
  }

  if (message.type === "TOGGLE_MUTE") {
    currentAudioState.isMuted = !currentAudioState.isMuted;
    if (useOffscreen) {
      browser.runtime.sendMessage({
        type: "SET_MUTE",
        isMuted: currentAudioState.isMuted,
        target: "offscreen",
      });
    } else if (firefoxAudio) {
      firefoxAudio.muted = currentAudioState.isMuted;
    }
    broadcastState();
    return true;
  }

  if (message.type === "SEEK") {
    if (useOffscreen) {
      browser.runtime.sendMessage({ ...message, target: "offscreen" });
    } else if (firefoxAudio) {
      firefoxAudio.currentTime = message.time;
    }
    return true;
  }

  if (message.type === "TOGGLE_SHUFFLE") {
    currentAudioState.shuffleMode = !currentAudioState.shuffleMode;
    broadcastState();
    return true;
  }

  if (message.type === "TOGGLE_REPEAT") {
    const modes: Array<"off" | "all" | "one"> = ["off", "all", "one"];
    const currentIndex = modes.indexOf(currentAudioState.repeatMode);
    currentAudioState.repeatMode = modes[(currentIndex + 1) % modes.length];
    broadcastState();
    return true;
  }

  if (message.type === "AUDIO_STATE_UPDATE" && useOffscreen) {
    currentAudioState = { ...currentAudioState, ...message.state };
    broadcastState();
  }

  if (message.type === "TRACK_ENDED") {
    handleTrackEnded();
  }

  return true;
});

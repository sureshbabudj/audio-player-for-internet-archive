import browser from "webextension-polyfill";

const audio = new Audio();
let playNextCallback = () => {};

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
  if (message.target !== "offscreen") return;

  switch (message.type) {
    case "PLAY_TRACK":
      audio.src = message.url;
      audio.play();
      break;
    case "TOGGLE_PLAY":
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
      break;
    case "SET_VOLUME":
      audio.volume = message.volume;
      break;
    case "SET_MUTE":
      audio.muted = message.isMuted;
      break;
    case "SEEK":
      audio.currentTime = message.time;
      break;
  }
});

// Broadcast state updates to background/popup
function broadcastState() {
  browser.runtime.sendMessage({
    type: "AUDIO_STATE_UPDATE",
    state: {
      isPlaying: !audio.paused,
      currentTime: audio.currentTime,
      duration: audio.duration,
      volume: audio.volume,
      isMuted: audio.muted,
    },
  }).catch(() => {
    // Ignore errors when nothing is listening
  });
}

audio.ontimeupdate = broadcastState;
audio.onplay = broadcastState;
audio.onpause = broadcastState;
audio.onloadedmetadata = broadcastState;
audio.onended = () => {
  browser.runtime.sendMessage({ type: "TRACK_ENDED" }).catch(() => {});
};

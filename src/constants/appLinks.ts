/**
 * Central registry of all external app URLs.
 * Add / update links here — they propagate across all screens automatically.
 */

const IOS_APP_ID = "6770291755";
const ANDROID_PACKAGE = "com.sureshbabudj.archiplay";
const GITHUB_REPO =
  "https://github.com/sureshbabudj/audio-player-for-internet-archive";

export const APP_LINKS = {
  /** App Store link — set to undefined if not yet published */
  ios: `https://apps.apple.com/app/id${IOS_APP_ID}`,

  /** Play Store link — set to undefined if not yet published */
  android: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,

  /** Landing / marketing website */
  website: "https://archieplay.web.app/",

  /** Feedback email */
  feedback: "mailto:archiplay@genaul.com",

  /** GitHub repository */
  github: GITHUB_REPO,

  /** GitHub Issues */
  issues: `${GITHUB_REPO}/issues`,

  /** Privacy policy page */
  privacy: "https://archieplay.web.app/privacy",

  /** Terms of service page */
  terms: "https://archieplay.web.app/terms",
} as const;

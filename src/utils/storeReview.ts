/**
 * Store Review Engine — Industry-Standard Timing
 *
 * Rules (aligned with Apple & Google guidelines):
 *  ┌──────────────────────────────────────────────────────┐
 *  │ 1. ≥ 7 days since first install                      │
 *  │ 2. ≥ 3 app sessions completed                        │
 *  │ 3. ≥ 10 tracks played (engagement gate)              │
 *  │ 4. ≥ 60 days since last prompt (platform-enforced)   │
 *  │ 5. Never prompt on web (no store context)            │
 *  │ 6. Trigger only after a positive moment              │
 *  └──────────────────────────────────────────────────────┘
 *
 * Apple enforces a hard cap of 3 prompts per 365 days (OS-level).
 * This utility adds a local 60-day guard on top to be respectful.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

const KEYS = {
  firstInstallDate: "@archiplay/review_first_install",
  lastPromptedAt: "@archiplay/review_last_prompted",
  sessionCount: "@archiplay/review_session_count",
  tracksPlayedCount: "@archiplay/review_tracks_played",
} as const;

const THRESHOLDS = {
  minDaysSinceInstall: 7, // Wait at least 1 week
  minSessions: 3, // At least 3 app opens
  minTracksPlayed: 10, // At least 10 tracks played
  minDaysBetweenPrompts: 60, // Max frequency (Apple hard-caps at 3/yr)
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getNumber(key: string): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

async function setNumber(key: string, val: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, String(val));
  } catch {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Call once per app session start (e.g., inside root layout useEffect). */
export async function recordSession(): Promise<void> {
  if (Platform.OS === "web") return;

  // Record first install date on first call ever
  const existing = await AsyncStorage.getItem(KEYS.firstInstallDate);
  if (!existing) {
    await AsyncStorage.setItem(KEYS.firstInstallDate, String(Date.now()));
  }

  const count = await getNumber(KEYS.sessionCount);
  await setNumber(KEYS.sessionCount, count + 1);
}

/** Call each time a track starts playing. */
export async function recordTrackPlayed(): Promise<void> {
  if (Platform.OS === "web") return;
  const count = await getNumber(KEYS.tracksPlayedCount);
  await setNumber(KEYS.tracksPlayedCount, count + 1);
}

/**
 * Check all conditions and, if met, show the native review dialog.
 * Call this after a positive user moment (e.g., track finished, collection saved).
 * Safe to call often — it silently no-ops when conditions aren't met.
 */
export async function maybeRequestReview(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const canReview = await StoreReview.hasAction();
    if (!canReview) return;

    const now = Date.now();

    // 1. Days since install
    const installDate = await getNumber(KEYS.firstInstallDate);
    if (!installDate) return;
    const daysSinceInstall = (now - installDate) / DAY_MS;
    if (daysSinceInstall < THRESHOLDS.minDaysSinceInstall) return;

    // 2. Session count
    const sessions = await getNumber(KEYS.sessionCount);
    if (sessions < THRESHOLDS.minSessions) return;

    // 3. Tracks played
    const tracksPlayed = await getNumber(KEYS.tracksPlayedCount);
    if (tracksPlayed < THRESHOLDS.minTracksPlayed) return;

    // 4. Time since last prompt
    const lastPrompted = await getNumber(KEYS.lastPromptedAt);
    if (lastPrompted) {
      const daysSincePrompt = (now - lastPrompted) / DAY_MS;
      if (daysSincePrompt < THRESHOLDS.minDaysBetweenPrompts) return;
    }

    // ✅ All gates passed — show the native review sheet
    await setNumber(KEYS.lastPromptedAt, now);
    await StoreReview.requestReview();
  } catch (e) {
    // Never crash the app over a review prompt
    console.warn("StoreReview failed silently:", e);
  }
}

/** For the Settings "Rate ArchiPlay" manual tap — bypasses all gates. */
export async function requestReviewNow(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const canReview = await StoreReview.hasAction();
    if (canReview) {
      await setNumber(KEYS.lastPromptedAt, Date.now());
      await StoreReview.requestReview();
    }
  } catch (e) {
    console.warn("StoreReview requestReviewNow failed:", e);
  }
}

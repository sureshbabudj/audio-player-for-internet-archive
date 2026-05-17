/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import * as FileSystem from "expo-file-system/legacy";
import { Alert, Platform } from "react-native";

/**
 * Unified cross-platform Alert module.
 * Falls back to browser native dialogs (window.confirm / window.alert) inside Expo Web / Extensions,
 * preventing layout thread lockouts or native rejections.
 */
export const UniversalAlert = {
  show(title: string, message: string, onConfirm?: () => void) {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && onConfirm) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: onConfirm },
      ]);
    }
  },

  alert(title: string, message: string) {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  },
};

/**
 * Unified cross-platform FileSystem helper.
 * Uses browser-native localStorage mock partitions inside Expo Web / Extensions,
 * and high-speed native FileSystem paths on iOS / Android.
 */
export const UniversalFileSystem = {
  async writeText(path: string, content: string): Promise<string> {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(`fs_${path}`, content);
        return `localstorage://${path}`;
      } catch (e) {
        console.warn("localStorage write exceeded quota or failed on web:", e);
        return "";
      }
    }
    await FileSystem.writeAsStringAsync(path, content);
    return path;
  },

  async readText(path: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(`fs_${path}`);
    }
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        return await FileSystem.readAsStringAsync(path);
      }
    } catch {}
    return null;
  },

  async delete(path: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(`fs_${path}`);
      return;
    }
    try {
      await FileSystem.deleteAsync(path, { idempotent: true });
    } catch {}
  },
};

/**
 * Unified secure token storage platform adapter.
 * Uses async storage fallback keys on Web, and high-performance Expo secure structures on mobile.
 */
export const UniversalSecureStore = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(`secure_${key}`, value);
      return;
    }
    try {
      const SecureStore = require("expo-secure-store");
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn(
        "Failed to write to native SecureStore, falling back to AsyncStorage:",
        e,
      );
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(`secure_${key}`, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(`secure_${key}`);
    }
    try {
      const SecureStore = require("expo-secure-store");
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem(`secure_${key}`);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(`secure_${key}`);
      return;
    }
    try {
      const SecureStore = require("expo-secure-store");
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem(`secure_${key}`);
    }
  },
};

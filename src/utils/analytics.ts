import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import PostHog from "posthog-react-native";
import { Platform } from "react-native";

const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "";
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export const posthog = new PostHog(API_KEY, {
  host: HOST,
});

export const analytics = {
  async init() {
    try {
      // 1. Register global properties
      posthog.register({
        app_name: "archiplay",
        app_version: Constants.expoConfig?.version || "1.0.0",
        platform: Platform.OS,
        environment: __DEV__ ? "development" : "production",
      });

      // 2. Identify the user with a stable anonymous UID
      let userId = await AsyncStorage.getItem("anonymous_user_id");
      if (!userId) {
        userId =
          "anon_" +
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        await AsyncStorage.setItem("anonymous_user_id", userId);
      }
      posthog.identify(userId);
    } catch (e) {
      console.warn("Failed to initialize PostHog analytics:", e);
    }
  },

  track(event: string, properties?: Record<string, any>) {
    try {
      posthog.capture(event, properties);
    } catch (e) {
      console.warn(`Failed to track event ${event}:`, e);
    }
  },

  screen(name: string, properties?: Record<string, any>) {
    try {
      posthog.screen(name, properties);
    } catch (e) {
      console.warn(`Failed to track screen view ${name}:`, e);
    }
  },
};

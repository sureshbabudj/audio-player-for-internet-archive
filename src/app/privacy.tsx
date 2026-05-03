import { ScreenHeader } from "@/components/ScreenHeader";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function PrivacyPolicyScreen() {
  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="detail" title="Privacy Policy" />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <Text className="text-white font-display text-2xl mb-6">
            Privacy Policy
          </Text>

          <Text className="text-white/60 font-body text-sm mb-4">
            Last Updated: May 3, 2026
          </Text>

          <Text className="text-white/80 font-body text-base mb-6 leading-6">
            ArchiPlay is committed to protecting your privacy. This Privacy
            Policy explains how we handle your information when you use our
            application.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            1. Information We Do Not Collect
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            ArchiPlay is a privacy-focused application. We do not require you to
            create an account, and we do not collect, store, or transmit any
            personal identification information to our servers.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            2. Local Data Storage
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            All your library data, including liked tracks, playlists, and
            playback history, is stored locally on your device. We do not have
            access to this data. If you delete the application, this local data
            will also be deleted unless you have created a backup.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            3. Third-Party Services
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            ArchiPlay interacts with the Internet Archive (archive.org) to
            stream audio content. When you search for or play music, your device
            connects directly to Internet Archive&apos;s servers. Please refer
            to the Internet Archive&apos;s Privacy Policy for information on how
            they handle data.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            4. Analytics
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            We do not use any third-party analytics or tracking tools within the
            application.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            5. Changes to This Policy
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Last Updated&quot; date.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            6. Contact Us
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            If you have any questions about this Privacy Policy, you can contact
            us at archiplay@genaul.com.
          </Text>
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

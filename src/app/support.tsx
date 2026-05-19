import { ScreenHeader } from "@/components/ScreenHeader";
import { APP_LINKS } from "@/constants/appLinks";
import React from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SupportScreen() {
  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="detail" title="Support & Resources" />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <Text className="text-white font-display text-2xl mb-6">
            ArchiePlay — Support & Resources
          </Text>

          <Text className="text-white/80 font-body text-base mb-6 leading-6">
            Thank you for using{" "}
            <Text className="font-bold text-white">ArchiePlay</Text>, an
            open-source media player client for the Internet Archive. Archiplay
            is committed to providing a reliable, privacy-focused streaming
            experience.
          </Text>

          <Text className="text-white/80 font-body text-base mb-6 leading-6">
            If you are experiencing issues, have questions, or would like to
            submit feedback, please use one of the official channels below.
          </Text>

          <View className="h-px bg-white/10 w-full mb-6" />

          <Text className="text-white font-display text-xl mb-4">
            🛠️ Get Help & Support
          </Text>

          <Text className="text-white font-display text-lg mb-2">
            1. Open a Support Ticket (Recommended)
          </Text>
          <Text className="text-white/70 font-body text-base mb-4 leading-6">
            For bug reports, feature requests, or technical issues, please open
            a ticket directly on the app&apos;s public issue tracker. This helps
            the developer to track problems transparently and improve the app
            for everyone:
          </Text>

          <TouchableOpacity
            className="bg-white/10 p-4 rounded-xl mb-6"
            onPress={() => Linking.openURL(APP_LINKS.issues)}
          >
            <Text className="text-white font-body text-center">
              👉 Submit an Issue on GitHub
            </Text>
          </TouchableOpacity>

          <Text className="text-white font-display text-lg mb-2">
            2. Contact via Email
          </Text>
          <Text className="text-white/70 font-body text-base mb-4 leading-6">
            If you prefer private assistance, or if your inquiry relates to
            something that cannot be handled via the public tracker, please feel
            free to reach out to the support mail:
          </Text>

          <TouchableOpacity
            className="bg-white/10 p-4 rounded-xl mb-6"
            onPress={() => Linking.openURL(APP_LINKS.feedback)}
          >
            <Text className="text-white font-body text-center">
              📧 archiplay@genaul.com
            </Text>
          </TouchableOpacity>

          <View className="h-px bg-white/10 w-full mb-6" />

          <Text className="text-white font-display text-xl mb-4">
            ⚖️ Legal & Content Notice
          </Text>

          <Text className="text-white/70 font-body text-base mb-4 leading-6">
            ArchiePlay is a neutral utility player that accesses metadata,
            thumbnails, and audio streams in real-time via the public, official
            APIs provided by the{" "}
            <Text className="font-bold text-white">
              Internet Archive (archive.org)
            </Text>
            .
          </Text>

          <View className="ml-2 mb-6">
            <Text className="text-white/70 font-body text-base mb-2 leading-6">
              • This application does not host, bundle, or modify any
              third-party media content.
            </Text>
            <Text className="text-white/70 font-body text-base mb-2 leading-6">
              • All content streamed through this app is hosted entirely by the
              Internet Archive under their respective terms of service and
              digital rights management.
            </Text>
            <Text className="text-white/70 font-body text-base leading-6">
              • To report content issues or copyright violations regarding
              hosted media, please contact the host platform directly at
              archive.org.
            </Text>
          </View>
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

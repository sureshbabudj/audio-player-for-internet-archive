import { ScreenHeader } from "@/components/ScreenHeader";
import React from "react";
import { ScrollView, Text, View } from "react-native";

export default function TermsOfServiceScreen() {
  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="detail" title="Terms of Service" />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <Text className="text-white font-display text-2xl mb-6">
            Terms of Service
          </Text>

          <Text className="text-white/60 font-body text-sm mb-4">
            Last Updated: May 3, 2026
          </Text>

          <Text className="text-white/80 font-body text-base mb-6 leading-6">
            By using ArchiPlay, you agree to the following terms and conditions.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            1. Use of the App
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            ArchiPlay is a tool provided for accessing public domain and
            creative commons audio content hosted on the Internet Archive. You
            agree to use the application only for lawful purposes and in
            accordance with these terms.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            2. Intellectual Property
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            ArchiPlay does not own the audio content streamed through the
            application. All content is hosted by the Internet Archive. Users
            are responsible for ensuring their use of the content complies with
            the specific licenses provided by the content creators on
            archive.org.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            3. Disclaimers
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            ArchiPlay is provided &quot;as is&quot; without any warranties,
            express or implied. We do not guarantee that the application will be
            error-free or that access to the Internet Archive will be
            uninterrupted.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            4. Limitation of Liability
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            In no event shall ArchiPlay or its developers be liable for any
            damages arising out of the use or inability to use the application.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            5. Modifications
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            We reserve the right to modify these terms at any time. Your
            continued use of the application following any changes constitutes
            your acceptance of the new terms.
          </Text>

          <Text className="text-white font-display text-xl mb-4">
            6. Contact
          </Text>
          <Text className="text-white/70 font-body text-base mb-6 leading-6">
            Questions about the Terms of Service should be sent to
            archiplay@genaul.com.
          </Text>
        </View>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

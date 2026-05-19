import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Heart,
  HeartHandshake,
  ListMusic,
  Search,
  Shield,
  Sparkles,
  SquareCode,
  Timer,
} from "lucide-react-native";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();
  const setHasCompletedOnboarding = useLibraryStore(
    (state) => state.setHasCompletedOnboarding,
  );
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    setHasCompletedOnboarding(true);
    router.replace("/");
  };

  const steps = [
    {
      title: "ArchiPlay",
      subtitle: "Stream Public Domain Audio",
      description:
        "Access millions of public-domain audiobooks, live concerts, historical radio shows, and vintage records from the Internet Archive.",
      image: (
        <Image
          source={require("../../assets/images/icon.svg")}
          style={{ width: 124, height: 124 }}
        />
      ),
      color: THEME.primary,
      accent: "bg-primary/10 border-primary/20",
    },
    {
      title: "How It Works",
      subtitle: "Stream, Organize & Control",
      icon: Sparkles,
      color: "#22C55E", // Emerald green
      accent: "bg-emerald-500/10 border-emerald-500/20",
      features: [
        {
          icon: Search,
          title: "Instant Search",
          text: "Find millions of public-domain recordings instantly.",
        },
        {
          icon: ListMusic,
          title: "Custom Playlists",
          text: "Organize files with full metadata support.",
        },
        {
          icon: Timer,
          title: "Advanced Player",
          text: "Enjoy sleep timers & native lockscreen controls.",
        },
      ],
    },
    {
      title: "Open Source",
      subtitle:
        "An open-source player providing a modern interface to stream public-domain audio from the Internet Archive",
      icon: SquareCode,
      color: "#3B82F6", // Cobalt blue
      accent: "bg-blue-500/10 border-blue-500/20",
      features: [
        {
          icon: Heart,
          title: "100% Free",
          text: "No subscription fees or paywalls, ever.",
        },
        {
          icon: Ban,
          title: "Zero Ads",
          text: "No advertisements or sponsored interruptions.",
        },
        {
          icon: Shield,
          title: "Complete Privacy",
          text: "No user tracking, telemetry, or data collection.",
        },
      ],
    },
    {
      title: "Ready to Explore?",
      subtitle: "Your library is waiting",
      description:
        "Explore a massive universe of free, public-domain audio. Stream rare concert tapes, vintage audio, and podcast archives instantly.",
      icon: HeartHandshake,
      color: THEME.primary,
      accent: "bg-primary/10 border-primary/20",
    },
  ];

  const current = steps[currentStep];
  const IconComponent = current.icon ? current.icon : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingVertical: 20,
          justifyContent: "space-between",
        }}
      >
        {/* Header (Skip Button) */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            height: 40,
            zIndex: 99,
          }}
        >
          <Text className="text-white/30 font-display text-xs uppercase tracking-widest font-bold">
            {`Step ${currentStep + 1} of 4`}
          </Text>
          {currentStep < 3 && (
            <TouchableOpacity
              onPress={handleFinish}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{ zIndex: 100 }}
            >
              <Text className="text-white/60 hover:text-white font-semibold text-sm py-1 px-3">
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Slide Container */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginVertical: 20,
          }}
        >
          {/* Main Visual Icon Container */}
          {current.image && <>{current.image}</>}
          {!current.image && IconComponent && (
            <View
              className={`w-24 h-24 rounded-[30px] ${current.accent} border items-center justify-center mb-6 shadow-2xl`}
            >
              <IconComponent size={40} color={current.color} />
            </View>
          )}

          {/* Title & Subtitle */}
          <Text
            className="text-white text-center font-display text-3xl font-extrabold mb-2"
            style={{ letterSpacing: -0.5, color: "#FFFFFF" }}
          >
            {current.title}
          </Text>
          <Text
            className={`text-center font-body mb-6 ${
              current.subtitle.length > 50
                ? "text-white/80 text-sm font-semibold leading-relaxed max-w-[340px] px-2"
                : "text-lg font-bold"
            }`}
            style={{
              color:
                current.subtitle.length > 50
                  ? "rgba(255, 255, 255, 0.8)"
                  : current.color,
            }}
          >
            {current.subtitle}
          </Text>

          {/* Descriptions / Features Lists */}
          {current.description && (
            <Text className="text-white/90 text-center font-body text-base font-medium leading-relaxed max-w-[340px] px-2">
              {current.description}
            </Text>
          )}

          {/* Render Features (Slide 2 & 3) */}
          {current.features && (
            <View style={{ width: "100%", maxWidth: 340, marginTop: 4 }}>
              {current.features.map((feat, index) => {
                const FeatIcon = feat.icon;
                return (
                  <View
                    key={index}
                    className="flex-row items-center bg-white/5 p-3.5 rounded-2xl border border-white/5"
                    style={{ marginBottom: 12 }}
                  >
                    <View className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-4">
                      <FeatIcon size={22} color={current.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">
                        {feat.title}
                      </Text>
                      <Text className="text-white/70 text-sm mt-1 leading-normal">
                        {feat.text}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer Navigation */}
        <View style={{ width: "100%" }}>
          {/* Indicator Dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            {steps.map((_, index) => (
              <View
                key={index}
                style={{
                  height: 6,
                  width: index === currentStep ? 20 : 6,
                  borderRadius: 3,
                  marginHorizontal: 4,
                  backgroundColor:
                    index === currentStep
                      ? current.color
                      : "rgba(255, 255, 255, 0.15)",
                }}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row" }}>
            {currentStep > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  height: 52,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  marginRight: 12,
                }}
              >
                <ArrowLeft size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text className="text-white font-bold text-sm">Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              style={{
                flex: currentStep > 0 ? 1.5 : 1,
                flexDirection: "row",
                height: 52,
                backgroundColor: current.color,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                className="text-white font-bold text-sm"
                style={{ marginRight: 6 }}
              >
                {currentStep === 3 ? "Let's Play" : "Continue"}
              </Text>
              {currentStep < 3 && <ArrowRight size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

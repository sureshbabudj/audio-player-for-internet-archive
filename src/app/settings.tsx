import { ScreenHeader } from "@/components/ScreenHeader";
import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  Database,
  ExternalLink,
  Info,
  Mail,
  MessageSquare,
  RotateCcw,
  Share2,
  Shield,
  Star,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path, SvgProps } from "react-native-svg";

const GithubIcon = (
  props: SvgProps & { color: string; size: number; opacity?: number },
) => (
  <Svg
    width={25}
    height={25}
    viewBox="0 -0.5 25 25"
    {...props}
    style={{ width: props.size, height: props.size }}
  >
    <Path
      fill={props.color}
      opacity={props.opacity}
      d="M12.301 0h.093c2.242 0 4.34.613 6.137 1.68l-.055-.031a12.35 12.35 0 0 1 4.449 4.422l.031.058a12.2 12.2 0 0 1 1.654 6.166c0 5.406-3.483 10-8.327 11.658l-.087.026a.724.724 0 0 1-.642-.113l.002.001a.62.62 0 0 1-.208-.466v-.014.001l.008-1.226q.008-1.178.008-2.154a2.844 2.844 0 0 0-.833-2.274 11 11 0 0 0 1.718-.305l-.076.017a6.5 6.5 0 0 0 1.537-.642l-.031.017a4.5 4.5 0 0 0 1.292-1.058l.006-.007a4.9 4.9 0 0 0 .84-1.645l.009-.035a7.9 7.9 0 0 0 .329-2.281l-.001-.136v.007l.001-.072a4.73 4.73 0 0 0-1.269-3.23l.003.003c.168-.44.265-.948.265-1.479a4.25 4.25 0 0 0-.404-1.814l.011.026a2.095 2.095 0 0 0-1.31.181l.012-.005a8.6 8.6 0 0 0-1.512.726l.038-.022-.609.384c-.922-.264-1.981-.416-3.075-.416s-2.153.152-3.157.436l.081-.02q-.256-.176-.681-.433a9 9 0 0 0-1.272-.595l-.066-.022A2.17 2.17 0 0 0 5.837 5.1l.013-.002a4.2 4.2 0 0 0-.393 1.788c0 .531.097 1.04.275 1.509l-.01-.029a4.72 4.72 0 0 0-1.265 3.303v-.004l-.001.13c0 .809.12 1.591.344 2.327l-.015-.057c.189.643.476 1.202.85 1.693l-.009-.013a4.4 4.4 0 0 0 1.267 1.062l.022.011c.432.252.933.465 1.46.614l.046.011c.466.125 1.024.227 1.595.284l.046.004c-.431.428-.718 1-.784 1.638l-.001.012a3 3 0 0 1-.699.236l-.021.004c-.256.051-.549.08-.85.08h-.066.003a1.9 1.9 0 0 1-1.055-.348l.006.004a2.84 2.84 0 0 1-.881-.986l-.007-.015a2.6 2.6 0 0 0-.768-.827l-.009-.006a2.3 2.3 0 0 0-.776-.38l-.016-.004-.32-.048-.077-.003q-.211.002-.394.077l.007-.003q-.128.072-.08.184.058.128.145.225l-.001-.001q.092.108.205.19l.003.002.112.08c.283.148.516.354.693.603l.004.006c.191.237.359.505.494.792l.01.024.16.368c.135.402.38.738.7.981l.005.004c.3.234.662.402 1.057.478l.016.002c.33.064.714.104 1.106.112h.007q.069.003.15.002.392 0 .767-.062l-.027.004.368-.064q0 .609.008 1.418t.008.873v.014c0 .185-.08.351-.208.466h-.001a.72.72 0 0 1-.645.111l.005.001C3.486 22.286.006 17.692.006 12.285c0-2.268.612-4.393 1.681-6.219l-.032.058a12.35 12.35 0 0 1 4.422-4.449l.058-.031a11.9 11.9 0 0 1 6.073-1.645h.098zm-7.64 17.666q.048-.112-.112-.192-.16-.048-.208.032-.048.112.112.192.144.096.208-.032m.497.545q.112-.08-.032-.256-.16-.144-.256-.048-.112.08.032.256.159.157.256.047zm.48.72q.144-.112 0-.304-.128-.208-.272-.096-.144.08 0 .288t.272.112m.672.673q.128-.128-.064-.304-.192-.192-.32-.048-.144.128.064.304.192.192.32.044zm.913.4q.048-.176-.208-.256-.24-.064-.304.112t.208.24q.24.097.304-.096m1.009.08q0-.208-.272-.176-.256 0-.256.176 0 .208.272.176.256.001.256-.175zm.929-.16q-.032-.176-.288-.144-.256.048-.224.24t.288.128.225-.224z"
    />
  </Svg>
);

export default function SettingsScreen() {
  const {
    collections,
    playCounts,
    recentlyPlayed,
    likedTracks,
    clearLibrary,
    importLibrary,
  } = useLibraryStore();

  return (
    <View className="flex-1 bg-darker">
      <ScreenHeader type="main" />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pt-2">
          <SectionHeader title="App" />
          <SettingsItem
            icon={Star}
            label="Rate ArchiPlay"
            onPress={() =>
              Linking.openURL("https://apps.apple.com/app/archiplay")
            }
          />
          <SettingsItem
            icon={Mail}
            label="Send Feedback"
            onPress={() => Linking.openURL("mailto:archiplay@genaul.com")}
          />

          <SectionHeader title="Open Source" />
          <SettingsItem
            icon={GithubIcon}
            label="GitHub Repository"
            onPress={() =>
              Linking.openURL(
                "https://github.com/sureshbabudj/audio-player-for-internet-archive",
              )
            }
          />
          <SettingsItem
            icon={MessageSquare}
            label="Report an Issue"
            onPress={() =>
              Linking.openURL(
                "https://github.com/sureshbabudj/audio-player-for-internet-archive/issues",
              )
            }
          />

          <SectionHeader title="Backup & Restore" />
          <SettingsItem
            icon={Share2}
            label="Export Data"
            onPress={async () => {
              try {
                const data = {
                  collections,
                  playCounts,
                  recentlyPlayed,
                  likedTracks,
                  version: "1.0",
                };
                const json = JSON.stringify(data, null, 2);
                const filename = `archiplay_backup_${Date.now()}.json`;
                const fileUri = `${FileSystem.cacheDirectory}${filename}`;

                await FileSystem.writeAsStringAsync(fileUri, json);

                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: "application/json",
                    dialogTitle: "Export ArchiPlay Data",
                    UTI: "public.json",
                  });
                } else {
                  Alert.alert(
                    "Error",
                    "Sharing is not available on this device.",
                  );
                }
              } catch (e) {
                console.error("Export error:", e);
                Alert.alert("Error", "Failed to export data.");
              }
            }}
          />
          <SettingsItem
            icon={Database}
            label="Import Data"
            onPress={async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: "application/json",
                  copyToCacheDirectory: true,
                });

                if (result.canceled) return;

                const fileUri = result.assets[0].uri;
                const json = await FileSystem.readAsStringAsync(fileUri);
                const data = JSON.parse(json);

                if (!data.collections && !data.likedTracks) {
                  throw new Error("Invalid backup file format");
                }

                Alert.alert(
                  "Import Library",
                  `This will replace your current library with ${data.collections?.length || 0} collections and ${data.likedTracks?.length || 0} liked tracks. Continue?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Import",
                      onPress: () => {
                        importLibrary(data);
                        Alert.alert(
                          "Success",
                          "Library imported successfully!",
                        );
                      },
                    },
                  ],
                );
              } catch (e) {
                console.error("Import error:", e);
                Alert.alert(
                  "Error",
                  "Failed to import backup file. Make sure it's a valid ArchiPlay JSON backup.",
                );
              }
            }}
          />

          <SectionHeader title="Storage" />
          <SettingsItem
            icon={RotateCcw}
            label="Clear Image Cache"
            onPress={() => {
              Alert.alert("Cache", "All image cache has been cleared.");
            }}
          />

          <SectionHeader title="Legal" />
          <SettingsItem
            icon={Shield}
            label="Privacy Policy"
            onPress={() => Linking.openURL("https://archiplay.app/privacy")}
          />
          <SettingsItem
            icon={Info}
            label="Terms of Service"
            onPress={() => Linking.openURL("https://archiplay.app/terms")}
          />

          <SectionHeader title="Danger Zone" />
          <SettingsItem
            icon={RotateCcw}
            label="Reset All Data"
            color={THEME.error}
            onPress={() => {
              Alert.alert(
                "Reset Library",
                "This will permanently delete all your collections, playlists, and playback history. This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset Everything",
                    style: "destructive",
                    onPress: () => {
                      clearLibrary();
                      usePlayerStore.getState().resetPlayer();
                    },
                  },
                ],
              );
            }}
          />

          <View className="h-40 items-center justify-center">
            <Text className="text-white/20 font-body text-xs">
              ArchiPlay v1.0.0
            </Text>
          </View>
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-white/40 font-display text-[10px] uppercase tracking-widest mt-6 mb-3 px-2">
      {title}
    </Text>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  onPress,
  color = THEME.white,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-surface/50 p-4 rounded-2xl mb-2 border border-white/5"
    >
      <View className="w-8 h-8 items-center justify-center mr-3">
        <Icon
          size={20}
          color={color}
          opacity={color === THEME.white ? 0.6 : 1}
        />
      </View>
      <Text className="flex-1 font-body text-sm" style={{ color }}>
        {label}
      </Text>
      <ExternalLink size={14} color={THEME.white} opacity={0.2} />
    </TouchableOpacity>
  );
}

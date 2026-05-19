import { THEME } from "@/constants/colors";
import { useLibraryStore } from "@/store/useLibraryStore";
import { UniversalAlert } from "@/utils/platformCompatibility";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { Database, Search } from "lucide-react-native";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: any;
  actionLabel?: string;
  onAction?: () => void;
  showImport?: boolean;
}

export function EmptyState({
  title,
  message,
  icon: Icon = Search,
  actionLabel = "Search Now",
  onAction,
  showImport = true,
}: EmptyStateProps) {
  const router = useRouter();
  const { importLibrary } = useLibraryStore();

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      let json: string;

      if (Platform.OS === "web") {
        const response = await fetch(fileUri);
        json = await response.text();
      } else {
        json = await FileSystem.readAsStringAsync(fileUri);
      }

      const data = JSON.parse(json);

      if (!data.collections && !data.likedTracks) {
        throw new Error("Invalid backup file format");
      }

      const confirmImport = () => {
        UniversalAlert.show(
          "Import Library",
          `This will replace your current library with ${data.collections?.length || 0} collections and ${data.likedTracks?.length || 0} liked tracks. Continue?`,
          () => {
            importLibrary(data);
            UniversalAlert.alert("Success", "Library imported successfully!");
          }
        );
      };
      confirmImport();
    } catch (e) {
      console.error("Import error:", e);
      const errorMsg = "Failed to import backup file. Make sure it's a valid ArchiPlay JSON backup.";
      UniversalAlert.alert("Error", errorMsg);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-10 bg-darker">
      <View className="w-20 h-20 bg-surface items-center justify-center rounded-3xl mb-6 border border-white/5">
        <Icon size={32} color={THEME.primary} />
      </View>
      
      <Text className="text-white font-display text-2xl font-bold mb-2 text-center">
        {title}
      </Text>
      
      <Text className="text-white/40 font-body text-center text-sm mb-8 px-4 leading-5">
        {message}
      </Text>

      <TouchableOpacity
        onPress={onAction || (() => router.push("/search"))}
        className="bg-primary px-8 py-4 rounded-2xl flex-row items-center justify-center mb-6 w-full max-w-[280px]"
      >
        <Search size={18} color={THEME.white} className="mr-2" />
        <Text className="text-white font-bold text-base">{actionLabel}</Text>
      </TouchableOpacity>

      {showImport && (
        <TouchableOpacity
          onPress={handleImport}
          className="flex-row items-center justify-center py-2"
        >
          <Database size={14} color={THEME.primary} className="mr-2" />
          <Text className="text-primary font-medium text-sm">
            Reinstalling? Restore from Backup
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

import { usePathname, useRouter } from "expo-router";
import { Heart, Home, Library, ListMusic, Search } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const navItems = [
    { icon: Home, route: "/", label: "Home" },
    { icon: Library, route: "/library", label: "Library" },
    { icon: Search, route: "/search", label: "Search", isCenter: true },
    { icon: ListMusic, route: "/playlists", label: "Playlists" },
    { icon: Heart, route: "/stats", label: "Liked" },
  ];

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-dark/80 border-t border-white/20 px-6 flex-row items-center justify-between"
      style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 12 }}
    >
      {navItems.map((item, index) => {
        const isActive =
          pathname === item.route ||
          (item.route === "/" && pathname === "/index");

        if (item.isCenter) {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(item.route as any)}
              className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-2xl shadow-primary/60 border-4 border-[#080814]"
            >
              <Search size={30} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(item.route as any)}
            className="items-center justify-center p-2"
          >
            <item.icon
              size={24}
              color={isActive ? "#FF6B35" : "#fff"}
              opacity={isActive ? 1 : 0.9}
              strokeWidth={isActive ? 2.5 : 2}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

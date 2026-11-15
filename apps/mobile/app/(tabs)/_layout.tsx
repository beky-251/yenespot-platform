import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useAppLanguage } from "../../context/LanguageContext";

export default function TabLayout() {
  const { language } = useAppLanguage();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 65,
          paddingTop: 7,
          paddingBottom: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: language === "am" ? "መነሻ" : "Home",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "house.fill",
                android: "home",
                web: "home",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: language === "am" ? "አስስ" : "Explore",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "magnifyingglass",
                android: "search",
                web: "search",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: language === "am" ? "ተደዋጆች" : "Favorites",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "heart.fill",
                android: "favorite",
                web: "favorite",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: language === "am" ? "መጠለጋ" : "Profile",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "person.fill",
                android: "person",
                web: "person",
              }}
              tintColor={color}
              size={23}
            />
          ),
        }}
      />

      {/* Hide the original Expo starter tab */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
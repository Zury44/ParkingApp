// app/_layout.jsx
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LanguageProvider } from "../context/LanguageContext";
import { SessionProvider } from "../context/SessionContext";

// Prevenir que se oculte automáticamente el splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    RobotoBold: require("../assets/fonts/Roboto-Bold.ttf"),
    RobotoSemiBold: require("../assets/fonts/Roboto-SemiBold.ttf"),
    RobotoMedium: require("../assets/fonts/Roboto-Medium.ttf"),
    RobotoRegular: require("../assets/fonts/Roboto-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // O algún loading component
  }

  return (
    <LanguageProvider>
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="parking-selector" />
          <Stack.Screen name="welcome" />
        </Stack>
      </SessionProvider>
    </LanguageProvider>
  );
}

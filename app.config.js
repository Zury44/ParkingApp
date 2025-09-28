export default ({ config }) => ({
  ...config,
  expo: {
    name: "ParkingApp",
    slug: "ParkingApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "parkingapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.zury44.ParkingApp",
      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/images/android-icon.png",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-localization",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_API_URL_LOGIN: process.env.EXPO_PUBLIC_API_URL_LOGIN,
      EXPO_PUBLIC_API_URL_SWITCH_CONTEXT:
        process.env.EXPO_PUBLIC_API_URL_SWITCH_CONTEXT,

      EXPO_PUBLIC_PARKING_CENTRAL: process.env.EXPO_PUBLIC_PARKING_CENTRAL,
      EXPO_PUBLIC_PARKING_MEDICINA: process.env.EXPO_PUBLIC_PARKING_MEDICINA,
      EXPO_PUBLIC_ESTADOS_CENTRAL: process.env.EXPO_PUBLIC_ESTADOS_CENTRAL,
      EXPO_PUBLIC_ESTADOS_MEDICINA: process.env.EXPO_PUBLIC_ESTADOS_MEDICINA,
      eas: {
        projectId: "2c7551ba-10e3-4721-8098-49357731405e",
      },
    },
  },
});

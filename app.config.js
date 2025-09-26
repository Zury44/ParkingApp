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
      API_URL: process.env.API_URL,
      API_KEY: process.env.API_KEY,
      API_URL_LOGIN: process.env.API_URL_LOGIN,
      API_URL_SELECTION: process.env.API_URL_SELECTION,
      API_URL_SWITCH_CONTEXT: process.env.API_URL_SWITCH_CONTEXT,
      API_CAMARA_URL: process.env.API_CAMARA_URL,
      MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
      MQTT_CLIENT_ID: process.env.MQTT_CLIENT,
      MQTT_USERNAME: process.env.MQTT_USERNAME,
      MQTT_PASSWORD: process.env.MQTT_PASSWORD,
      MQTT_TOPIC: process.env.MQTT_TOPIC,
      MQTT_RECONNECT_PERIOD: process.env.MQTT_RECONNECT_PERIOD,
      MQTT_CONNECT_TIMEOUT: process.env.MQTT_CONNECT_TIMEOUT,
      MQTT_CLEAN: process.env.MQTT_CLEAN,

      eas: {
        projectId: "2c7551ba-10e3-4721-8098-49357731405e",
      },
    },
  },
});

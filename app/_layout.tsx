import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const paperTheme = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;
	const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

	return (
		<GestureHandlerRootView style={styles.container}>
			<BottomSheetModalProvider>
				<PaperProvider theme={paperTheme}>
					<ThemeProvider value={navigationTheme}>
						<Stack>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
						</Stack>
						<StatusBar style="auto" />
					</ThemeProvider>
				</PaperProvider>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

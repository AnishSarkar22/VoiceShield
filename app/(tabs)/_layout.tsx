import {
	HomeIcon,
	HomeInactiveIcon,
	RecordingsIcon,
	RecordingsInactiveIcon,
} from "@/components/icons";
import { CommonActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { BottomNavigation } from "react-native-paper";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				animation: "shift",
			}}
			tabBar={({ navigation, state, descriptors, insets }) => (
				<BottomNavigation.Bar
					navigationState={state}
					safeAreaInsets={insets}
					onTabPress={({ route, preventDefault }) => {
						// Add haptic feedback when pressing tabs (iOS only)
						if (process.env.EXPO_OS === "ios") {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						}

						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});

						if (event.defaultPrevented) {
							preventDefault();
						} else {
							navigation.dispatch({
								...CommonActions.navigate(route.name, route.params),
								target: state.key,
							});
						}
					}}
					renderIcon={({ route, focused, color }) => {
						const icon = descriptors[route.key].options.tabBarIcon?.({
							focused,
							color,
							size: 26,
						});
						return icon ? (
							<View style={styles.iconContainer}>{icon}</View>
						) : null;
					}}
					getLabelText={({ route }) => {
						const { options } = descriptors[route.key];
						const label =
							typeof options.tabBarLabel === "string"
								? options.tabBarLabel
								: typeof options.title === "string"
									? options.title
									: route.name;

						return label;
					}}
				/>
			)}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused, size = 26 }) =>
						focused ? (
							<HomeIcon color={color} size={size} />
						) : (
							<HomeInactiveIcon color={color} size={size} />
						),
				}}
			/>
			<Tabs.Screen
				name="recordings"
				options={{
					title: "Recordings",
					tabBarIcon: ({ color, focused, size = 26 }) =>
						focused ? (
							<RecordingsIcon color={color} size={size} />
						) : (
							<RecordingsInactiveIcon color={color} size={size} />
						),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	iconContainer: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
});

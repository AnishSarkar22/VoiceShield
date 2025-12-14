import { HomeIcon, RecordingsIcon } from "@/components/icons";
import { CommonActions } from "@react-navigation/native";
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
				name="home"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => <HomeIcon color={color} size={26} />,
				}}
			/>
			<Tabs.Screen
				name="recordings"
				options={{
					title: "Recordings",
					tabBarIcon: ({ color }) => <RecordingsIcon color={color} size={26} />,
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

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, View } from "react-native";

export default function RecordingsScreen() {
	return (
		<ThemedView style={styles.container}>
			<View style={styles.content}>
				<ThemedText style={styles.title}>Recordings</ThemedText>
				<ThemedText style={styles.subtitle}>
					Your saved recordings will appear here
				</ThemedText>
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		paddingVertical: 40,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 48,
		opacity: 0.7,
		textAlign: "center",
	},
});

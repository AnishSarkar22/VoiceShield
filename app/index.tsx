import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
	Dimensions,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import { RecordingModal } from "@/components/recording-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
	const [isRecording, setIsRecording] = useState(false);
	const screenWidth = Dimensions.get("window").width;
	const isWeb = Platform.OS === "web";

	const handleStartRecording = () => {
		setIsRecording(true);
	};

	const handleStopRecording = (uri: string) => {
		setIsRecording(false);
		console.log("Recording saved at:", uri);
		// Handle the saved recording URI here
	};

	const handleClose = () => {
		setIsRecording(false);
	};

	return (
		<ThemedView style={styles.container}>
			<View style={styles.content}>
				<ThemedText style={styles.title}>VoiceShield</ThemedText>
				<ThemedText style={styles.subtitle}>Tap to start recording</ThemedText>

				<TouchableOpacity
					style={[
						styles.recordButton,
						{
							width: isWeb ? Math.min(screenWidth * 0.3, 120) : 120,
							height: isWeb ? Math.min(screenWidth * 0.3, 120) : 120,
							borderRadius: isWeb ? Math.min(screenWidth * 0.15, 60) : 60,
						},
					]}
					onPress={handleStartRecording}
					activeOpacity={0.8}
				>
					<Ionicons name="mic" size={48} color="#FFFFFF" />
				</TouchableOpacity>
			</View>

			<RecordingModal
				visible={isRecording}
				onClose={handleClose}
				onStop={handleStopRecording}
			/>
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
	recordButton: {
		backgroundColor: "#FF3B30",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
});

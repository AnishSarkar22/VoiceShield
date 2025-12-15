import { MicIcon, ProfileIcon } from "@/components/icons";
import { ProfileModal } from "@/components/modals/profile-modal";
import { RecordingModal } from "@/components/modals/recording-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

export default function HomeScreen() {
	const [isRecording, setIsRecording] = useState(false);
	const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
	const screenWidth = Dimensions.get("window").width;
	const isWeb = Platform.OS === "web";
	const iconColor = useThemeColor({}, "text");
	const scaleAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.9,
			useNativeDriver: true,
			tension: 300,
			friction: 10,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(scaleAnim, {
			toValue: 1,
			useNativeDriver: true,
			tension: 300,
			friction: 10,
		}).start();
	};

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
			{/* Header */}
			<View style={styles.header}>
				<ThemedText style={styles.title}>VoiceShield</ThemedText>
				<TouchableOpacity
					style={styles.profileButton}
					onPress={() => setIsProfileModalVisible(true)}
					activeOpacity={0.7}
				>
					<ProfileIcon size={32} color={iconColor} />
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<ThemedText style={styles.subtitle}>Tap to start recording</ThemedText>

				<TouchableOpacity
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					onPress={handleStartRecording}
					activeOpacity={1}
				>
					<Animated.View
						style={[
							styles.recordButton,
							{
								width: isWeb ? Math.min(screenWidth * 0.3, 120) : 120,
								height: isWeb ? Math.min(screenWidth * 0.3, 120) : 120,
								borderRadius: isWeb ? Math.min(screenWidth * 0.15, 60) : 60,
								transform: [{ scale: scaleAnim }],
							},
						]}
					>
						<MicIcon size={48} color="#FFFFFF" />
					</Animated.View>
				</TouchableOpacity>
			</View>

			<RecordingModal
				visible={isRecording}
				onClose={handleClose}
				onStop={handleStopRecording}
			/>

			<ProfileModal
				visible={isProfileModalVisible}
				onClose={() => setIsProfileModalVisible(false)}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 50,
		paddingBottom: 20,
	},
	profileButton: {
		padding: 8,
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

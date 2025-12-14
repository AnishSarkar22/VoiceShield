import { CloseIcon, PersonIcon } from "@/components/icons";
import { BlurView } from "expo-blur";
import {
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ProfileModalProps {
	visible: boolean;
	onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
	const isWeb = Platform.OS === "web";
	const screenHeight = Dimensions.get("window").height;

	// Mock profile data - replace with actual data from your state/context
	const profileData = {
		name: "John Doe",
		email: "john.doe@example.com",
		phone: "+1 (555) 123-4567",
		memberSince: "January 2024",
		totalRecordings: 42,
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<View style={styles.container}>
				{/* Blurred background */}
				{isWeb ? (
					<View style={styles.blurBackground} />
				) : (
					<BlurView intensity={80} style={StyleSheet.absoluteFill} />
				)}

				{/* Profile overlay */}
				<View
					style={[styles.profileOverlay, { maxHeight: screenHeight * 0.7 }]}
				>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.headerTitle}>Profile</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<CloseIcon size={24} color="#FFFFFF" />
						</TouchableOpacity>
					</View>

					{/* Profile Avatar */}
					<View style={styles.avatarContainer}>
						<View style={styles.avatar}>
							<PersonIcon size={64} color="#FFFFFF" />
						</View>
					</View>

					{/* Profile Details */}
					<View style={styles.detailsContainer}>
						<ProfileDetailItem label="Name" value={profileData.name} />
						<ProfileDetailItem label="Email" value={profileData.email} />
						<ProfileDetailItem label="Phone" value={profileData.phone} />
						<ProfileDetailItem
							label="Member Since"
							value={profileData.memberSince}
						/>
						<ProfileDetailItem
							label="Total Recordings"
							value={profileData.totalRecordings.toString()}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}

function ProfileDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.detailItem}>
			<Text style={styles.detailLabel}>{label}</Text>
			<Text style={styles.detailValue}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	blurBackground: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	profileOverlay: {
		backgroundColor: "#1a1a1a",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: Platform.OS === "web" ? 40 : 60,
		width: "100%",
		minHeight: 400,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	headerTitle: {
		color: "#FFFFFF",
		fontSize: 28,
		fontWeight: "bold",
	},
	closeButton: {
		padding: 4,
	},
	avatarContainer: {
		alignItems: "center",
		marginBottom: 24,
	},
	avatar: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 3,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	detailsContainer: {
		gap: 16,
	},
	detailItem: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
	},
	detailLabel: {
		color: "#FFFFFF",
		fontSize: 14,
		opacity: 0.6,
		marginBottom: 4,
		fontWeight: "500",
	},
	detailValue: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});

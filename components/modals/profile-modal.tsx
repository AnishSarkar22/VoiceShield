import { DeleteIcon, EmailIcon } from "@/components/icons";
import { getAllRecordings } from "@/services/database";
import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Image,
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
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const [recordingsCount, setRecordingsCount] = useState(0);

	// Snap points for the bottom sheet
	const snapPoints = useMemo(() => ["85%"], []);

	// Mock profile data - replace with actual data from your state/context
	const profileData = {
		name: "John Doe",
		email: "john.doe@example.com",
		phone: "+1 (555) 123-4567",
		memberSince: "January 2024",
	};

	useEffect(() => {
		if (visible) {
			bottomSheetRef.current?.present();
			// Fetch actual recordings count
			getAllRecordings().then((recordings) => {
				setRecordingsCount(recordings.length);
			});
		} else {
			bottomSheetRef.current?.dismiss();
		}
	}, [visible]);

	const handleDismiss = useCallback(() => {
		onClose();
	}, [onClose]);

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				opacity={0.6}
			/>
		),
		[],
	);

	return (
		<BottomSheetModal
			ref={bottomSheetRef}
			snapPoints={snapPoints}
			onDismiss={handleDismiss}
			enablePanDownToClose
			backdropComponent={renderBackdrop}
			backgroundStyle={styles.sheetBackground}
			handleIndicatorStyle={styles.handleIndicator}
			topInset={130}
		>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Profile</Text>
				<TouchableOpacity
					onPress={() => {
						// TODO: Implement delete account functionality
						console.log("Delete account pressed");
					}}
					style={styles.deleteIconButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<DeleteIcon size={18} color="rgba(239, 68, 68, 0.7)" />
				</TouchableOpacity>
			</View>

			<BottomSheetScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Profile Card Section */}
				<View style={styles.profileCard}>
					<View style={styles.avatar}>
						<View style={styles.avatarInner}>
							<Image
								source={require("@/assets/images/profile1.png")}
								style={styles.avatarImage}
								resizeMode="cover"
							/>
						</View>
					</View>
					<Text style={styles.userName}>{profileData.name}</Text>
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>{recordingsCount}</Text>
							<Text style={styles.statLabel}>Recordings</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statItem}>
							<Text style={styles.statValue}>
								{profileData.memberSince.split(" ")[1]}
							</Text>
							<Text style={styles.statLabel}>Member Since</Text>
						</View>
					</View>
				</View>

				{/* Section Divider */}
				<View style={styles.sectionDivider}>
					<View style={styles.dividerLine} />
					<Text style={styles.sectionTitle}>Personal Information</Text>
					<View style={styles.dividerLine} />
				</View>

				{/* Personal Details */}
				<View style={styles.detailsContainer}>
					<ProfileDetailItem
						label="Email Address"
						value={profileData.email}
						icon={<EmailIcon size={20} color="rgba(255, 255, 255, 0.7)" />}
					/>
				</View>
			</BottomSheetScrollView>
		</BottomSheetModal>
	);
}

function ProfileDetailItem({
	label,
	value,
	icon,
}: {
	label: string;
	value: string;
	icon?: React.ReactNode;
}) {
	return (
		<View style={styles.detailItem}>
			<View style={styles.detailIconContainer}>{icon}</View>
			<View style={styles.detailContent}>
				<Text style={styles.detailLabel}>{label}</Text>
				<Text style={styles.detailValue}>{value}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	sheetBackground: {
		backgroundColor: "#1a1a1a",
	},
	handleIndicator: {
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		width: 40,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 32,
		paddingHorizontal: 24,
		paddingTop: 8,
	},
	headerTitle: {
		color: "#FFFFFF",
		fontSize: 32,
		fontWeight: "700",
		letterSpacing: -0.5,
	},
	deleteIconButton: {
		padding: 8,
		opacity: 0.6,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingBottom: Platform.OS === "web" ? 40 : 60,
	},
	profileCard: {
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.06)",
		borderRadius: 24,
		padding: 32,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	avatar: {
		width: 140,
		height: 140,
		borderRadius: 70,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 20,
		position: "relative",
	},
	avatarInner: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(255, 255, 255, 0.12)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
		overflow: "hidden",
	},
	avatarImage: {
		width: "100%",
		height: "100%",
	},
	userName: {
		color: "#FFFFFF",
		fontSize: 26,
		fontWeight: "700",
		letterSpacing: -0.4,
		marginBottom: 24,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		justifyContent: "center",
	},
	statItem: {
		flex: 1,
		alignItems: "center",
	},
	statValue: {
		color: "#FFFFFF",
		fontSize: 28,
		fontWeight: "700",
		marginBottom: 4,
		letterSpacing: -0.5,
	},
	statLabel: {
		color: "rgba(255, 255, 255, 0.6)",
		fontSize: 12,
		fontWeight: "500",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	statDivider: {
		width: 1,
		height: 40,
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		marginHorizontal: 24,
	},
	sectionDivider: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 24,
		paddingHorizontal: 4,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
	sectionTitle: {
		color: "rgba(255, 255, 255, 0.5)",
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginHorizontal: 16,
	},
	detailsContainer: {
		gap: 12,
		paddingHorizontal: 4,
		marginBottom: 8,
	},
	detailItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.08)",
	},
	detailIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	detailContent: {
		flex: 1,
	},
	detailLabel: {
		color: "rgba(255, 255, 255, 0.6)",
		fontSize: 13,
		marginBottom: 6,
		fontWeight: "500",
		letterSpacing: 0.2,
		textTransform: "uppercase",
	},
	detailValue: {
		color: "#FFFFFF",
		fontSize: 17,
		fontWeight: "600",
		letterSpacing: -0.2,
	},
});

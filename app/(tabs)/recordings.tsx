import { DeleteIcon, PlayIcon, StopIcon } from "@/components/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
	deleteRecording,
	getAllRecordings,
	type Recording,
} from "@/services/database";
import { deleteRecordingFile } from "@/services/recording-service";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	Alert,
	FlatList,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

export default function RecordingsScreen() {
	const [recordings, setRecordings] = useState<Recording[]>([]);
	const [loading, setLoading] = useState(true);
	const [playingId, setPlayingId] = useState<number | null>(null);
	const [currentSource, setCurrentSource] = useState<
		string | { uri: string } | null
	>(null);
	const textColor = useThemeColor({}, "text");
	const iconColor = useThemeColor({}, "icon");

	// Audio player - initialize with null, will be set when needed
	// For expo-audio, we need to provide a source, so we'll use a placeholder
	const placeholderSource =
		Platform.OS === "web" ? "data:audio/webm;base64," : { uri: "" };
	const player = useAudioPlayer(currentSource || placeholderSource);
	const playerStatus = useAudioPlayerStatus(player);

	const loadRecordings = useCallback(async () => {
		try {
			setLoading(true);
			const allRecordings = await getAllRecordings();
			setRecordings(allRecordings);
		} catch (error) {
			console.error("Failed to load recordings:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Load recordings when screen is focused
	useFocusEffect(
		useCallback(() => {
			void loadRecordings();
		}, [loadRecordings]),
	);

	const handlePlayPause = async (recording: Recording) => {
		try {
			if (playingId === recording.id && playerStatus.playing) {
				// Pause if playing this recording
				player.pause();
				setPlayingId(null);
			} else {
				// Stop current playback if any
				if (playerStatus.playing) {
					player.pause();
				}

				// Set new source
				const source =
					Platform.OS === "web" && recording.file_path.startsWith("data:")
						? recording.file_path
						: { uri: recording.file_path };

				setCurrentSource(source);
				player.replace(source);
				player.play();
				setPlayingId(recording.id);
			}
		} catch (error) {
			console.error("Failed to play recording:", error);
			Alert.alert("Error", "Failed to play recording");
		}
	};

	const handleDelete = (recording: Recording) => {
		Alert.alert(
			"Delete Recording",
			"Are you sure you want to delete this recording?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							// Stop playback if this recording is playing
							if (playingId === recording.id) {
								player.pause();
								setPlayingId(null);
							}

							// Delete file
							await deleteRecordingFile(recording.file_path);

							// Delete from database
							await deleteRecording(recording.id);

							// Reload recordings
							await loadRecordings();
						} catch (error) {
							console.error("Failed to delete recording:", error);
							Alert.alert("Error", "Failed to delete recording");
						}
					},
				},
			],
		);
	};

	const formatDuration = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const formatRecordingName = (createdAt: number): string => {
		const date = new Date(createdAt);
		return date.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const renderRecordingItem = ({ item }: { item: Recording }) => {
		const isPlaying = playingId === item.id && playerStatus.playing;
		const displayName = formatRecordingName(item.created_at);

		return (
			<TouchableOpacity
				style={[styles.recordingItem, { borderBottomColor: `${iconColor}20` }]}
				onPress={() => handlePlayPause(item)}
				activeOpacity={0.7}
			>
				<View style={styles.recordingInfo}>
					<ThemedText style={styles.recordingName} numberOfLines={1}>
						{displayName}
					</ThemedText>
					<View style={styles.recordingMeta}>
						<ThemedText style={[styles.metaText, { color: iconColor }]}>
							{formatDuration(item.duration)}
						</ThemedText>
						<ThemedText style={[styles.metaText, { color: iconColor }]}>
							•
						</ThemedText>
						<View
							style={[
								styles.statusBadge,
								item.status === "bonafide"
									? styles.statusBonafide
									: item.status === "spoof"
										? styles.statusSpoof
										: styles.statusPending,
							]}
						>
							<ThemedText style={styles.statusText}>
								{item.status === "bonafide"
									? "Bonafide"
									: item.status === "spoof"
										? "Spoof"
										: "Pending"}
							</ThemedText>
						</View>
					</View>
				</View>
				<View style={styles.actionButtons}>
					<TouchableOpacity
						onPress={(e) => {
							e.stopPropagation();
							handleDelete(item);
						}}
						style={styles.deleteButton}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<DeleteIcon size={18} color="#FF3B30" />
					</TouchableOpacity>
					<View style={styles.playButton}>
						{isPlaying ? (
							<StopIcon size={24} color={textColor} />
						) : (
							<PlayIcon size={24} color={textColor} />
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<ThemedView style={styles.container}>
				<View style={styles.content}>
					<ThemedText style={styles.title}>Recordings</ThemedText>
					<ThemedText style={styles.subtitle}>Loading...</ThemedText>
				</View>
			</ThemedView>
		);
	}

	return (
		<ThemedView style={styles.container}>
			<View style={styles.header}>
				<ThemedText style={styles.title}>Recordings</ThemedText>
			</View>

			{recordings.length === 0 ? (
				<View style={styles.emptyState}>
					<ThemedText style={styles.emptyTitle}>No recordings yet</ThemedText>
				</View>
			) : (
				<FlatList
					data={recordings}
					renderItem={renderRecordingItem}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 20,
		paddingTop: 50,
		paddingBottom: 20,
		overflow: "visible",
		zIndex: 1,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		lineHeight: 40,
	},
	count: {
		fontSize: 14,
		marginTop: 4,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		paddingVertical: 40,
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 48,
		opacity: 0.7,
		textAlign: "center",
	},
	listContent: {
		paddingTop: 8,
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	recordingItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	recordingInfo: {
		flex: 1,
		marginRight: 12,
	},
	recordingName: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	actionButtons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	deleteButton: {
		padding: 8,
	},
	recordingMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	metaText: {
		fontSize: 13,
		opacity: 0.7,
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
	},
	statusPending: {
		backgroundColor: "rgba(128, 128, 128, 0.2)",
	},
	statusBonafide: {
		backgroundColor: "rgba(52, 199, 89, 0.2)",
	},
	statusSpoof: {
		backgroundColor: "rgba(255, 59, 48, 0.2)",
	},
	statusText: {
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	playButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
	},
	playButtonText: {
		fontSize: 20,
	},
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},
	emptyTitle: {
		fontSize: 24,
		fontWeight: "600",
		marginBottom: 8,
		textAlign: "center",
	},
	emptySubtitle: {
		fontSize: 16,
		textAlign: "center",
		opacity: 0.7,
	},
});

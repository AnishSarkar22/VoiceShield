import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	Modal,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

interface RecordingModalProps {
	visible: boolean;
	onClose: () => void;
	onStop: (uri: string) => void;
}

export function RecordingModal({
	visible,
	onClose,
	onStop,
}: RecordingModalProps) {
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [duration, setDuration] = useState(0);
	const [isRecording, setIsRecording] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const meteringIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const recordingRef = useRef<Audio.Recording | null>(null);
	const waveformAnimations = useRef<Animated.Value[]>([]);
	const previousBarValues = useRef<number[]>([]); // Track previous values for smoothing
	const frequencyBands = useRef<number[]>([]); // Simulate different frequency band sensitivities
	const soundThreshold = -60; // Minimum sound level in dB to trigger animation (closer to 0 = louder)

	// Initialize waveform bars (50 bars for smooth visualization)
	useEffect(() => {
		if (waveformAnimations.current.length === 0) {
			waveformAnimations.current = Array.from(
				{ length: 50 },
				() => new Animated.Value(0.1),
			);
			previousBarValues.current = Array.from({ length: 50 }, () => 0.1);

			// Initialize frequency band sensitivities - simulate different frequency responses
			// Lower indices = lower frequencies, higher indices = higher frequencies
			frequencyBands.current = Array.from({ length: 50 }, (_, i) => {
				const position = i / 50; // 0 to 1
				// Create a more realistic frequency response curve
				// Bass frequencies (left) and mid-high frequencies (center-right) are typically more prominent
				if (position < 0.2) {
					// Low frequencies - slightly boosted
					return 0.7 + Math.random() * 0.3;
				} else if (position > 0.3 && position < 0.7) {
					// Mid frequencies - most prominent
					return 0.8 + Math.random() * 0.2;
				} else {
					// High frequencies - slightly reduced
					return 0.5 + Math.random() * 0.3;
				}
			});
		}
	}, []);

	// Update waveform based on audio metering
	const updateWaveform = useCallback(async () => {
		if (!recording) return;

		try {
			const status = await recording.getStatusAsync();
			if (status.isRecording && status.metering !== undefined) {
				const meterValue = status.metering; // Negative dB value (e.g., -160 to 0)

				// Only animate if sound is detected above threshold
				// Meter values closer to 0 are louder, so we check if meterValue > threshold
				if (meterValue > soundThreshold) {
					// Normalize meter value: map from -60 (threshold) to 0 (max) to 0-1 scale
					// Clamp to reasonable range (-60 to 0 dB)
					const clampedMeter = Math.max(
						soundThreshold,
						Math.min(0, meterValue),
					);
					const normalizedValue =
						(clampedMeter - soundThreshold) / Math.abs(soundThreshold);

					// Update waveform bars with realistic frequency-based variations
					waveformAnimations.current.forEach((anim, index) => {
						const frequencySensitivity = frequencyBands.current[index] || 0.7;
						const position = index / waveformAnimations.current.length; // 0 to 1

						// Base level from actual sound, scaled by frequency sensitivity
						const baseLevel = normalizedValue * frequencySensitivity;

						// Create natural variations:
						// 1. Time-based wave pattern (but not uniform - varies by position)
						const time = Date.now() * 0.003;
						const wavePhase = position * Math.PI * 2;
						const timeWave = Math.sin(wavePhase + time) * 0.3;

						// 2. Add frequency-specific patterns (different frequencies react differently)
						const freqPattern =
							Math.sin(position * Math.PI * 4 + time * 0.5) * 0.2;

						// 3. Add natural peaks and valleys (not uniform distribution)
						const peakPattern =
							Math.abs(Math.sin(position * Math.PI * 3)) * 0.25;

						// 4. Add subtle randomness that varies with sound level
						const randomFactor = (Math.random() - 0.5) * 0.15 * normalizedValue;

						// 5. Smooth transition from previous value (60% previous, 40% new)
						const previousValue = previousBarValues.current[index] || 0.1;
						const rawTarget = Math.max(
							0.1,
							Math.min(
								1,
								baseLevel * 0.6 + // Base from sound
									timeWave * normalizedValue + // Time-based wave
									freqPattern * normalizedValue + // Frequency pattern
									peakPattern * normalizedValue + // Peak pattern
									randomFactor + // Random variation
									0.15, // Minimum level when sound detected
							),
						);

						// Smooth the transition
						const targetValue = previousValue * 0.6 + rawTarget * 0.4;
						previousBarValues.current[index] = targetValue;

						Animated.timing(anim, {
							toValue: targetValue,
							duration: 60 + Math.random() * 40, // Vary animation speed for natural feel
							useNativeDriver: true,
						}).start();
					});
				} else {
					// No sound detected, smoothly fade bars to minimum
					waveformAnimations.current.forEach((anim, index) => {
						const previousValue = previousBarValues.current[index] || 0.1;
						const targetValue = Math.max(0.1, previousValue * 0.85); // Gradual fade
						previousBarValues.current[index] = targetValue;

						Animated.timing(anim, {
							toValue: targetValue,
							duration: 150,
							useNativeDriver: true,
						}).start();
					});
				}
			}
		} catch (err) {
			// Silently handle errors (recording might have stopped)
		}
	}, [recording]);

	// Start metering updates when recording
	useEffect(() => {
		if (isRecording && recording) {
			// Poll metering data every 50ms for smooth updates
			meteringIntervalRef.current = setInterval(() => {
				updateWaveform();
			}, 50);
		} else {
			if (meteringIntervalRef.current) {
				clearInterval(meteringIntervalRef.current);
				meteringIntervalRef.current = null;
			}
			// Reset waveform when not recording
			waveformAnimations.current.forEach((anim) => {
				anim.setValue(0.1);
			});
		}

		return () => {
			if (meteringIntervalRef.current) {
				clearInterval(meteringIntervalRef.current);
				meteringIntervalRef.current = null;
			}
		};
	}, [isRecording, recording, updateWaveform]);

	const stopRecording = useCallback(
		async (save: boolean = true) => {
			const currentRecording = recording;
			if (!currentRecording) return;

			try {
				setIsRecording(false);
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
				if (meteringIntervalRef.current) {
					clearInterval(meteringIntervalRef.current);
					meteringIntervalRef.current = null;
				}

				try {
					const status = await currentRecording.getStatusAsync();
					if (status.isRecording) {
						await currentRecording.stopAndUnloadAsync();
					} else {
						await currentRecording.unloadAsync();
					}
					const uri = currentRecording.getURI();
					if (uri && save) {
						onStop(uri);
					}
				} catch (stopErr) {
					// Try to unload even if stop fails
					try {
						await currentRecording.unloadAsync();
					} catch (unloadErr) {
						console.error("Failed to unload recording", unloadErr);
					}
				}
				recordingRef.current = null;
				setRecording(null);
				setDuration(0);
			} catch (err) {
				console.error("Failed to stop recording", err);
				recordingRef.current = null;
				setRecording(null);
			}
		},
		[recording, onStop],
	);

	const startRecording = useCallback(async () => {
		try {
			// Clean up any existing recording first
			const existingRecording = recordingRef.current;
			if (existingRecording) {
				try {
					const status = await existingRecording.getStatusAsync();
					if (status.isRecording) {
						await existingRecording.stopAndUnloadAsync();
					} else {
						await existingRecording.unloadAsync();
					}
				} catch (cleanupErr) {
					// Ignore cleanup errors, just try to unload
					try {
						await existingRecording.unloadAsync();
					} catch (e) {
						// Ignore
					}
				}
				recordingRef.current = null;
				setRecording(null);
			}

			await Audio.requestPermissionsAsync();
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});

			const { recording: newRecording } = await Audio.Recording.createAsync({
				...Audio.RecordingOptionsPresets.HIGH_QUALITY,
				android: {
					...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
					extension: ".m4a",
					outputFormat: Audio.AndroidOutputFormat.MPEG_4,
					audioEncoder: Audio.AndroidAudioEncoder.AAC,
					sampleRate: 44100,
					numberOfChannels: 2,
					bitRate: 128000,
				},
				ios: {
					...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
					extension: ".m4a",
					outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
					audioQuality: Audio.IOSAudioQuality.HIGH,
					sampleRate: 44100,
					numberOfChannels: 2,
					bitRate: 128000,
					linearPCMBitDepth: 16,
					linearPCMIsBigEndian: false,
					linearPCMIsFloat: false,
				},
				web: {
					mimeType: "audio/webm",
					bitsPerSecond: 128000,
				},
				isMeteringEnabled: true, // Enable metering for sound detection
			});
			recordingRef.current = newRecording;
			setRecording(newRecording);
			setIsRecording(true);
			setDuration(0);

			// Start timer
			intervalRef.current = setInterval(() => {
				setDuration((prev) => prev + 1);
			}, 1000);
		} catch (err) {
			console.error("Failed to start recording", err);
			recordingRef.current = null;
			setRecording(null);
			setIsRecording(false);
		}
	}, []);

	const handleClose = useCallback(async () => {
		const currentRecording = recording;
		if (currentRecording) {
			await stopRecording(false);
		}
		onClose();
	}, [recording, stopRecording, onClose]);

	useEffect(() => {
		if (visible && !recording && !isRecording) {
			// Small delay to ensure any previous recording is fully cleaned up
			const timeoutId = setTimeout(() => {
				startRecording();
			}, 100);

			return () => {
				clearTimeout(timeoutId);
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
			};
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [visible, recording, isRecording, startRecording]);

	// Cleanup when modal closes
	useEffect(() => {
		if (!visible && recording) {
			stopRecording(false);
		}
	}, [visible, recording, stopRecording]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const screenHeight = Dimensions.get("window").height;
	const isWeb = Platform.OS === "web";

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={handleClose}
			statusBarTranslucent
		>
			<View style={styles.container}>
				{/* Blurred background */}
				{isWeb ? (
					<View style={styles.blurBackground} />
				) : (
					<BlurView intensity={80} style={StyleSheet.absoluteFill} />
				)}

				{/* Recording overlay */}
				<View
					style={[styles.recordingOverlay, { maxHeight: screenHeight * 0.4 }]}
				>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.recordingIndicator}>
							<View style={styles.redDot} />
							<Text style={styles.recordingText}>RECORDING</Text>
						</View>
						<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
							<Ionicons name="close" size={24} color="#FFFFFF" />
						</TouchableOpacity>
					</View>

					{/* Timer */}
					<Text style={styles.timer}>{formatTime(duration)}</Text>

					{/* Waveform */}
					<View style={styles.waveformContainer}>
						{waveformAnimations.current.map((anim, index) => {
							const scaleY = anim.interpolate({
								inputRange: [0, 1],
								outputRange: [0.1, 1],
							});
							return (
								<Animated.View
									key={index}
									style={[
										styles.waveformBar,
										{
											transform: [{ scaleY }],
										},
									]}
								/>
							);
						})}
					</View>

					{/* Stop button */}
					<TouchableOpacity
						onPress={stopRecording}
						style={styles.stopButton}
						activeOpacity={0.8}
					>
						<View style={styles.stopButtonInner} />
					</TouchableOpacity>

					{/* Instruction text */}
					<Text style={styles.instructionText}>Tap to stop and save</Text>
				</View>
			</View>
		</Modal>
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
	recordingOverlay: {
		backgroundColor: "#000000",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: Platform.OS === "web" ? 40 : 60,
		width: "100%",
		minHeight: 300,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	recordingIndicator: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	redDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#FF0000",
	},
	recordingText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "600",
		letterSpacing: 0.5,
	},
	closeButton: {
		padding: 4,
	},
	timer: {
		color: "#FFFFFF",
		fontSize: 48,
		fontWeight: "300",
		textAlign: "center",
		marginBottom: 24,
		fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-light",
	},
	waveformContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		height: 50,
		gap: 2,
		marginBottom: 32,
		paddingHorizontal: 8,
	},
	waveformBar: {
		width: 3,
		height: 40,
		backgroundColor: "#FFFFFF",
		borderRadius: 1.5,
	},
	stopButton: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		alignSelf: "center",
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	stopButtonInner: {
		width: 28,
		height: 28,
		borderRadius: 4,
		backgroundColor: "#000000",
	},
	instructionText: {
		color: "#FFFFFF",
		fontSize: 12,
		textAlign: "center",
		opacity: 0.7,
	},
});

import { CloseIcon } from "@/components/icons";
import {
    AudioModule,
    RecordingPresets,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { BlurView } from "expo-blur";
import { useCallback, useEffect, useRef, useState } from "react";
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
	const [duration, setDuration] = useState(0);
	const [isRecording, setIsRecording] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	// expo-audio recorder
	const audioRecorder = useAudioRecorder({
		...RecordingPresets.HIGH_QUALITY,
		android: {
			extension: ".m4a",
			outputFormat: "mpeg4", // MPEG_4
			audioEncoder: "aac", // AAC
			sampleRate: 44100,
			numberOfChannels: 2,
			bitRate: 128000,
		},
		ios: {
			extension: ".m4a",
			outputFormat: "mpeg4aac", // MPEG4AAC
			audioQuality: 127, // HIGH (number)
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
		isMeteringEnabled: true,
	});

	// Get recorder state for metering
	const recordingState = useAudioRecorderState(audioRecorder, 50);
	const waveformAnimations = useRef<Animated.Value[]>([]);
	const previousBarValues = useRef<number[]>([]); // Track previous values for smoothing
	const frequencyBands = useRef<number[]>([]); // Simulate different frequency band sensitivities
	const soundThreshold = -60; // Minimum sound level in dB to trigger animation (closer to 0 = louder)

	// Web-specific audio recording refs
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const recordingMimeTypeRef = useRef<string>("audio/webm");
	const recordingStopPromiseRef = useRef<{
		resolve: () => void;
		reject: (reason?: unknown) => void;
	} | null>(null);
	const isWeb = Platform.OS === "web";

	// Initialize waveform bars (50 bars for smooth visualization)
	const waveformBarKeys = useRef<string[]>(
		Array.from({ length: 50 }, (_, i) => `waveform-${i}`),
	);

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

	// Update waveform based on audio metering (native) or Web Audio API (web)
	const updateWaveform = useCallback(async () => {
		if (isWeb) {
			// Web: Use Web Audio API AnalyserNode
			if (!analyserRef.current || !dataArrayRef.current) return;

			try {
				if (dataArrayRef.current) {
					// TypeScript type mismatch workaround for Web Audio API
					// @ts-expect-error - Web Audio API accepts Uint8Array but TypeScript types are strict
					analyserRef.current.getByteFrequencyData(dataArrayRef.current);
				}

				// Calculate average volume and get frequency data
				const dataArray = dataArrayRef.current;
				const numBars = waveformAnimations.current.length;
				const fftSize = dataArray.length; // Usually 1024
				const samplesPerBar = Math.floor(fftSize / numBars);

				// Calculate average volume for overall normalization
				let sum = 0;
				for (let i = 0; i < dataArray.length; i++) {
					sum += dataArray[i];
				}
				const averageVolume = sum / dataArray.length / 255; // Normalize to 0-1

				// Update each bar based on frequency data
				waveformAnimations.current.forEach((anim, index) => {
					// Get frequency data for this bar's range
					const startIdx = index * samplesPerBar;
					const endIdx = Math.min(startIdx + samplesPerBar, fftSize);
					let barSum = 0;
					for (let i = startIdx; i < endIdx; i++) {
						barSum += dataArray[i];
					}
					const barValue = barSum / samplesPerBar / 255; // Normalize to 0-1

					// Apply frequency sensitivity
					const frequencySensitivity = frequencyBands.current[index] || 0.7;
					const normalizedValue = Math.min(
						1,
						barValue * frequencySensitivity * 2,
					);

					// Only animate if sound is detected
					if (normalizedValue > 0.05 || averageVolume > 0.05) {
						const previousValue = previousBarValues.current[index] || 0.1;
						const rawTarget = Math.max(
							0.1,
							Math.min(
								1,
								normalizedValue * 0.8 + // Base from frequency data
									averageVolume * 0.2 + // Overall volume influence
									0.1, // Minimum level when sound detected
							),
						);

						// Smooth the transition
						const targetValue = previousValue * 0.6 + rawTarget * 0.4;
						previousBarValues.current[index] = targetValue;

						Animated.timing(anim, {
							toValue: targetValue,
							duration: 60 + Math.random() * 40,
							useNativeDriver: true,
						}).start();
					} else {
						// No sound detected, smoothly fade bars to minimum
						const previousValue = previousBarValues.current[index] || 0.1;
						const targetValue = Math.max(0.1, previousValue * 0.85);
						previousBarValues.current[index] = targetValue;

						Animated.timing(anim, {
							toValue: targetValue,
							duration: 150,
							useNativeDriver: true,
						}).start();
					}
				});
			} catch {
				// Silently handle errors
			}
		} else {
			// Native: Use expo-audio metering
			if (!recordingState || !recordingState.isRecording) return;

			try {
				if (recordingState.metering !== undefined) {
					const meterValue = recordingState.metering; // Negative dB value (e.g., -160 to 0)

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
							const randomFactor =
								(Math.random() - 0.5) * 0.15 * normalizedValue;

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
			} catch {
				// Silently handle errors (recording might have stopped)
			}
		}
	}, [recordingState, isWeb]);

	// Start metering updates when recording
	useEffect(() => {
		if (isRecording) {
			if (isWeb) {
				// Web: Update waveform if analyser is available
				if (analyserRef.current) {
					meteringIntervalRef.current = setInterval(() => {
						updateWaveform();
					}, 50);
				}
			} else {
				// Native: Poll metering data every 50ms for smooth updates
				if (audioRecorder.isRecording) {
					meteringIntervalRef.current = setInterval(() => {
						updateWaveform();
					}, 50);
				}
			}
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
	}, [
		isRecording,
		recordingState,
		updateWaveform,
		isWeb,
		audioRecorder.isRecording,
	]);

	// Drive timer independent of recording implementation
	useEffect(() => {
		if (!isRecording) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			setDuration(0);
			return;
		}

		setDuration(0);
		const id = setInterval(() => {
			setDuration((prev) => prev + 1);
		}, 1000);
		intervalRef.current = id;

		return () => {
			clearInterval(id);
			if (intervalRef.current === id) {
				intervalRef.current = null;
			}
		};
	}, [isRecording]);

	const stopRecording = useCallback(
		async (save: boolean = true) => {
			if (isWeb) {
				// Web: Stop MediaRecorder and cleanup Web Audio API
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

					if (
						mediaRecorderRef.current &&
						mediaRecorderRef.current.state !== "inactive"
					) {
						// Create a promise that resolves when recording stops
						const stopPromise = new Promise<void>((resolve, reject) => {
							recordingStopPromiseRef.current = { resolve, reject };
						});

						mediaRecorderRef.current.stop();

						// Wait for the recording to finish processing
						if (save) {
							await stopPromise;
						} else {
							// If not saving, still wait a bit for cleanup
							await new Promise((resolve) => setTimeout(resolve, 100));
						}
					}

					// Cleanup Web Audio API
					if (analyserRef.current) {
						analyserRef.current.disconnect();
						analyserRef.current = null;
					}
					if (audioContextRef.current) {
						await audioContextRef.current.close();
						audioContextRef.current = null;
					}
					if (mediaStreamRef.current) {
						mediaStreamRef.current.getTracks().forEach((track) => {
							track.stop();
						});
						mediaStreamRef.current = null;
					}

					mediaRecorderRef.current = null;
					setDuration(0);
				} catch (err) {
					console.error("Failed to stop web recording", err);
					if (recordingStopPromiseRef.current) {
						recordingStopPromiseRef.current.reject(err);
						recordingStopPromiseRef.current = null;
					}
				}
			} else {
				// Native: Stop expo-audio recording
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

					if (audioRecorder.isRecording) {
						await audioRecorder.stop();
						const uri = audioRecorder.uri;
						if (uri && save) {
							onStop(uri);
						}
					} else {
						// Already stopped, just get the URI
						const uri = audioRecorder.uri;
						if (uri && save) {
							onStop(uri);
						}
					}
					setDuration(0);
				} catch (err) {
					console.error("Failed to stop recording", err);
				}
			}
		},
		[audioRecorder, onStop, isWeb],
	);

	// Web-specific recording function
	const startRecordingWeb = useCallback(async () => {
		try {
			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 44100,
				},
			});

			mediaStreamRef.current = stream;

			// Create AudioContext for real-time audio analysis
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			const audioContext = new AudioContextClass();
			audioContextRef.current = audioContext;

			// Create analyser node for frequency data
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048; // Higher resolution for better frequency analysis
			analyser.smoothingTimeConstant = 0.8;
			analyserRef.current = analyser;

			// Create data array for frequency data
			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);
			dataArrayRef.current = dataArray;

			// Connect microphone to analyser
			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);

			// Create MediaRecorder for actual recording
			const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
				? "audio/webm;codecs=opus"
				: MediaRecorder.isTypeSupported("audio/webm")
					? "audio/webm"
					: "audio/ogg";

			recordingMimeTypeRef.current = mimeType;

			const mediaRecorder = new MediaRecorder(stream, {
				mimeType,
				audioBitsPerSecond: 128000,
			});
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			// Handle data available events
			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			// Handle recording stop
			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: recordingMimeTypeRef.current,
				});

				// Create a data URL for consistent format with mobile
				const reader = new FileReader();
				reader.onloadend = () => {
					const dataUrl = reader.result as string;
					if (recordingStopPromiseRef.current) {
						recordingStopPromiseRef.current.resolve();
						recordingStopPromiseRef.current = null;
					}

					// Trigger download
					const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
					const extension = recordingMimeTypeRef.current.includes("webm")
						? "webm"
						: recordingMimeTypeRef.current.includes("ogg")
							? "ogg"
							: "audio";
					const filename = `recording-${timestamp}.${extension}`;

					const link = document.createElement("a");
					link.href = dataUrl;
					link.download = filename;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);

					// Call onStop with data URL (similar format to mobile file://)
					onStop(dataUrl);
					audioChunksRef.current = [];
				};
				reader.readAsDataURL(audioBlob);
			};

			// Start recording
			mediaRecorder.start(100); // Collect data every 100ms

			setIsRecording(true);
			setDuration(0);
		} catch (err) {
			console.error("Failed to start web recording", err);
			setIsRecording(false);
		}
	}, [onStop]);

	// Native recording function
	const startRecordingNative = useCallback(async () => {
		try {
			// Clean up any existing recording first
			if (audioRecorder.isRecording) {
				try {
					await audioRecorder.stop();
				} catch {
					// Ignore cleanup errors
				}
			}

			// Request permissions
			const permissionStatus =
				await AudioModule.requestRecordingPermissionsAsync();
			if (!permissionStatus.granted) {
				console.error("Microphone permission denied");
				setIsRecording(false);
				return;
			}

			// Prepare and start recording
			await audioRecorder.prepareToRecordAsync({
				...RecordingPresets.HIGH_QUALITY,
				android: {
					extension: ".m4a",
					outputFormat: "mpeg4", // MPEG_4
					audioEncoder: "aac", // AAC
					sampleRate: 44100,
					numberOfChannels: 2,
					bitRate: 128000,
				},
				ios: {
					extension: ".m4a",
					outputFormat: "mpeg4aac", // MPEG4AAC
					audioQuality: 127, // HIGH (number)
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

			audioRecorder.record();
			setIsRecording(true);
			setDuration(0);
		} catch (err) {
			console.error("Failed to start recording", err);
			setIsRecording(false);
		}
	}, [audioRecorder]);

	// Unified start recording function
	const startRecording = useCallback(async () => {
		if (isWeb) {
			await startRecordingWeb();
		} else {
			await startRecordingNative();
		}
	}, [isWeb, startRecordingWeb, startRecordingNative]);

	const handleClose = useCallback(async () => {
		if (isWeb) {
			// Web: Stop recording if active
			if (isRecording) {
				await stopRecording(false);
			}
		} else {
			// Native: Stop recording if active
			if (audioRecorder.isRecording) {
				await stopRecording(false);
			}
		}
		onClose();
	}, [audioRecorder.isRecording, stopRecording, onClose, isWeb, isRecording]);

	useEffect(() => {
		if (visible && !isRecording) {
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
	}, [visible, isRecording, startRecording]);

	// Cleanup when modal closes
	useEffect(() => {
		if (!visible && isRecording) {
			stopRecording(false);
		}
	}, [visible, isRecording, stopRecording]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const screenHeight = Dimensions.get("window").height;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
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
							<CloseIcon size={24} color="#FFFFFF" />
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
							const barKey = waveformBarKeys.current[index];
							return (
								<Animated.View
									key={barKey}
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
						onPress={() => {
							void stopRecording(true);
						}}
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
		backgroundColor: "#1a1a1a",
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

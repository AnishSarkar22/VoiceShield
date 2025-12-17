import { Directory, File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Platform } from "react-native";
import { type Recording, saveRecording } from "./database";

/**
 * Ensure the recordings directory exists
 */
function ensureRecordingsDirectory(): string {
	// Use legacy API to get documentDirectory path, then use new API for operations
	const documentDir = FileSystemLegacy.documentDirectory;
	if (!documentDir) {
		throw new Error("Document directory not available");
	}
	
	const dir = new Directory(documentDir, 'recordings');

	try {
		if (!dir.exists) {
			dir.create({ intermediates: true, idempotent: true });
		}
	} catch {
		// Directory might not exist, create it
		dir.create({ intermediates: true, idempotent: true });
	}

	return dir.uri;
}

/**
 * Generate a unique filename for a recording
 */
function generateFileName(extension: string = "m4a"): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	return `recording-${timestamp}.${extension}`;
}

/**
 * Get file extension from URI or path
 */
function getFileExtension(uri: string): string {
	// Handle data URLs (web)
	if (uri.startsWith("data:")) {
		const match = uri.match(/data:audio\/([^;]+)/);
		if (match) {
			const mimeType = match[1];
			// Map common MIME types to extensions
			if (mimeType.includes("webm")) return "webm";
			if (mimeType.includes("ogg")) return "ogg";
			if (mimeType.includes("mpeg") || mimeType.includes("mp4")) return "m4a";
			return "audio";
		}
		return "webm"; // Default for web
	}

	// Handle file paths
	const match = uri.match(/\.([^.]+)$/);
	return match ? match[1] : "m4a";
}

/**
 * Save a recording file and its metadata
 * @param sourceUri - The URI of the source recording (from expo-audio or web)
 * @param duration - Duration in seconds (optional)
 * @returns The saved recording object
 */
export async function saveRecordingFile(
	sourceUri: string,
	duration: number = 0,
): Promise<Recording> {
	const recordingsDir = ensureRecordingsDirectory();
	const extension = getFileExtension(sourceUri);
	const fileName = generateFileName(extension);
	const destinationPath = `${recordingsDir}${fileName}`;

	if (Platform.OS === "web") {
		// Web: Handle data URLs
		if (sourceUri.startsWith("data:")) {
			// For web, we'll store the data URL in the database
			// In a real app, you might want to upload to cloud storage
			const recording = await saveRecording(sourceUri, fileName, duration);
			return recording;
		}
		// If it's a file path on web, try to copy it
		try {
			const sourceFile = new File(sourceUri);
			const destFile = new File(destinationPath);
			sourceFile.copy(destFile);
		} catch (error) {
			console.error("Failed to copy file on web:", error);
			// Fallback: store the original URI
			return saveRecording(sourceUri, fileName, duration);
		}
	} else {
		// Native: Copy file to permanent location
		try {
			const sourceFile = new File(sourceUri);
			const destFile = new File(destinationPath);
			sourceFile.copy(destFile);
		} catch (error) {
			console.error("Failed to copy recording file:", error);
			throw new Error("Failed to save recording file");
		}
	}

	// Save metadata to database
	const recording = await saveRecording(destinationPath, fileName, duration);
	return recording;
}

/**
 * Check if a recording file exists
 */
export async function recordingFileExists(filePath: string): Promise<boolean> {
	if (Platform.OS === "web" && filePath.startsWith("data:")) {
		// Data URLs always "exist"
		return true;
	}

	try {
		const file = new File(filePath);
		return file.exists;
	} catch {
		return false;
	}
}

/**
 * Delete a recording file
 */
export async function deleteRecordingFile(filePath: string): Promise<boolean> {
	if (Platform.OS === "web" && filePath.startsWith("data:")) {
		// Data URLs don't need file deletion
		return true;
	}

	try {
		const file = new File(filePath);
		if (file.exists) {
			file.delete();
		}
		return true;
	} catch (error) {
		console.error("Failed to delete recording file:", error);
		return false;
	}
}

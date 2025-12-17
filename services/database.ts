import * as SQLite from "expo-sqlite";

// Use default database file (not specific to recordings)
const DB_NAME = "app.db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) {
		return db;
	}

	db = await SQLite.openDatabaseAsync(DB_NAME);

	// Initialize recordings table if it doesn't exist
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS recordings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			file_path TEXT NOT NULL,
			file_name TEXT NOT NULL,
			duration INTEGER DEFAULT 0,
			status TEXT DEFAULT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
	`);

	// Add status column if it doesn't exist (for existing databases)
	try {
		await db.execAsync(`ALTER TABLE recordings ADD COLUMN status TEXT DEFAULT NULL;`);
	} catch {
		// Column already exists, ignore error
	}

	return db;
}

/**
 * Recording model
 */
export type RecordingStatus = "pending" | "bonafide" | "spoof" | null;

export interface Recording {
	id: number;
	file_path: string;
	file_name: string;
	duration: number;
	status: RecordingStatus;
	created_at: number;
	updated_at: number;
}

/**
 * Save a new recording to the database
 */
export async function saveRecording(
	filePath: string,
	fileName: string,
	duration: number = 0,
): Promise<Recording> {
	const database = await getDatabase();
	const now = Date.now();

	const result = await database.runAsync(
		`INSERT INTO recordings (file_path, file_name, duration, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?)`,
		[filePath, fileName, duration, now, now],
	);

	return {
		id: result.lastInsertRowId,
		file_path: filePath,
		file_name: fileName,
		duration,
		created_at: now,
		updated_at: now,
	};
}

/**
 * Get all recordings, ordered by most recent first
 */
export async function getAllRecordings(): Promise<Recording[]> {
	const database = await getDatabase();
	const result = await database.getAllAsync<Recording>(
		`SELECT * FROM recordings ORDER BY created_at DESC`,
	);
	return result;
}

/**
 * Get a recording by ID
 */
export async function getRecordingById(id: number): Promise<Recording | null> {
	const database = await getDatabase();
	const result = await database.getFirstAsync<Recording>(
		`SELECT * FROM recordings WHERE id = ?`,
		[id],
	);
	return result || null;
}

/**
 * Delete a recording from the database
 */
export async function deleteRecording(id: number): Promise<boolean> {
	const database = await getDatabase();
	const result = await database.runAsync(`DELETE FROM recordings WHERE id = ?`, [
		id,
	]);
	return result.changes > 0;
}

/**
 * Update recording metadata
 */
export async function updateRecording(
	id: number,
	updates: Partial<Pick<Recording, "file_name" | "duration" | "status">>,
): Promise<boolean> {
	const database = await getDatabase();
	const fields: string[] = [];
	const values: unknown[] = [];

	if (updates.file_name !== undefined) {
		fields.push("file_name = ?");
		values.push(updates.file_name);
	}

	if (updates.duration !== undefined) {
		fields.push("duration = ?");
		values.push(updates.duration);
	}

	if (updates.status !== undefined) {
		fields.push("status = ?");
		values.push(updates.status);
	}

	if (fields.length === 0) {
		return false;
	}

	fields.push("updated_at = ?");
	values.push(Date.now());
	values.push(id);

	const result = await database.runAsync(
		`UPDATE recordings SET ${fields.join(", ")} WHERE id = ?`,
		values,
	);

	return result.changes > 0;
}

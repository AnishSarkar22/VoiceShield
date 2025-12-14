import Svg, { Defs, G, Mask, Path, Rect } from "react-native-svg";

type IconProps = {
	size?: number;
	color?: string;
};

export function HomeIcon({ size = 24, color = "#fff" }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				fill={color}
				d="M4 19v-9q0-.475.213-.9t.587-.7l6-4.5q.525-.4 1.2-.4t1.2.4l6 4.5q.375.275.588.7T20 10v9q0 .825-.588 1.413T18 21h-3q-.425 0-.712-.288T14 20v-5q0-.425-.288-.712T13 14h-2q-.425 0-.712.288T10 15v5q0 .425-.288.713T9 21H6q-.825 0-1.412-.587T4 19"
			/>
		</Svg>
	);
}

export function RecordingsIcon({ size = 24, color = "#fff" }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
			<Defs>
				<Mask id="microphone-mask">
					<G fill="none" strokeLinejoin="round" strokeWidth="4">
						{/* White strokes - visible parts */}
						<Rect
							width="38"
							height="24"
							x="5"
							y="18"
							fill="#fff"
							stroke="#fff"
							strokeLinecap="round"
							rx="2"
						/>
						<Path stroke="#fff" strokeLinecap="round" d="M8 12h32" />
						<Path stroke="#fff" strokeLinecap="round" d="M15 6h18" />
						{/* Black strokes - cutouts */}
						<Path stroke="#000" strokeLinecap="round" d="M26 24v6" />
						<Path
							stroke="#000"
							d="M18 32.75c0-1.52 1.29-2.75 2.88-2.75H26v3.25c0 1.52-1.29 2.75-2.88 2.75h-2.24C19.29 36 18 34.77 18 33.25z"
						/>
						<Path stroke="#000" strokeLinecap="round" d="m31 25l-5-1" />
					</G>
				</Mask>
			</Defs>
			<Path fill={color} d="M0 0h48v48H0z" mask="url(#microphone-mask)" />
		</Svg>
	);
}

export function ProfileIcon({ size = 24, color = "#fff" }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
			<Path
				fill={color}
				d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"
			/>
			<Path
				fill={color}
				fillRule="evenodd"
				d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"
			/>
		</Svg>
	);
}

export function MicIcon({ size = 24, color = "#fff" }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				fill={color}
				d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2t2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 6v-2.075q-2.3-.325-3.937-1.95t-1.988-3.95q-.05-.425.225-.725T6 11t.713.288T7.1 12q.35 1.75 1.738 2.875T12 16q1.8 0 3.175-1.137T16.9 12q.1-.425.388-.712T18 11t.7.3t.225.725q-.35 2.275-1.975 3.925T13 17.925V20q0 .425-.288.713T12 21t-.712-.288T11 20"
			/>
		</Svg>
	);
}

export function CloseIcon({ size = 24, color = "#fff" }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				stroke={color}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M18 6L6 18M6 6l12 12"
			/>
		</Svg>
	);
}

export function PersonIcon({ size = 24, color = "#fff" }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
			<Path
				fill={color}
				d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
			/>
		</Svg>
	);
}

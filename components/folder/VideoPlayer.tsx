"use client";

import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { buildOptimizedUrl } from "@/lib/cloudinaryOptimization";

interface VideoPlayerProps {
	videoUrl: string;
	fileName: string;
	onClose: () => void;
}

export default function VideoPlayer({
	videoUrl,
	fileName,
	onClose,
}: VideoPlayerProps) {
	const downloadUrl = buildOptimizedUrl(videoUrl, {
		quality: "auto",
		format: "auto",
	});

	return (
		<Dialog
			open={true}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: {
					backgroundColor: "#000",
					height: { xs: "80vh", md: "82vh" },
					display: "flex",
					flexDirection: "column",
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					backgroundColor: "#000",
					color: "#fff",
					borderBottom: "1px solid #333",
					py: 1.5,
					px: 2,
				}}
			>
				<Typography
					variant="subtitle1"
					sx={{
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						flex: 1,
						fontWeight: 500,
					}}
				>
					{fileName}
				</Typography>
				<IconButton
					onClick={onClose}
					sx={{
						color: "#fff",
						ml: 2,
						"&:hover": {
							backgroundColor: "rgba(255, 255, 255, 0.1)",
						},
					}}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent
				sx={{
					backgroundColor: "#000",
					display: "flex",
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					p: 0,
				}}
			>
				<Box
					sx={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						px: { xs: 1.5, sm: 2 },
						pb: { xs: 1.5, sm: 2 },
						borderRadius: 2,
						overflow: "hidden",
					}}
				>
					<Box
						component="video"
						src={videoUrl}
						controls
						playsInline
						autoPlay
						preload="metadata"
						sx={{
							width: "100%",
							height: "100%",
							maxWidth: "100%",
							maxHeight: "100%",
							backgroundColor: "#000",
						}}
					/>
				</Box>
			</DialogContent>

			<DialogActions
				sx={{
					backgroundColor: "#000",
					borderTop: "1px solid #222",
					px: 2,
					py: 1.5,
					gap: 1,
				}}
			>
				<Button
					onClick={onClose}
					sx={{
						color: "#fff",
						"&:hover": {
							backgroundColor: "rgba(255, 255, 255, 0.1)",
						},
					}}
				>
					Close
				</Button>
				<a
					href={downloadUrl}
					download={fileName}
					style={{ textDecoration: "none" }}
				>
					<Button
						variant="contained"
						color="primary"
						sx={{
							backgroundColor: "#1976d2",
							"&:hover": {
								backgroundColor: "#1565c0",
							},
						}}
					>
						Download
					</Button>
				</a>
			</DialogActions>
		</Dialog>
	);
}

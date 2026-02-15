"use client";

import { useState } from "react";
import { useToast } from "@/providers/ToastProvider";
import {
	Grid,
	Card,
	CardMedia,
	CardActionArea,
	Typography,
	Box,
	Skeleton,
	Chip,
	Stack,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Tooltip,
} from "@mui/material";
import { format } from "date-fns";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import {
	buildOptimizedUrl,
	getDownloadUrl,
	getResponsiveSrcSet,
	getThumbnailUrl,
	getVideoPosterUrl,
} from "@/lib/cloudinaryOptimization";
import ImageLightbox from "./ImageLightbox";
import VideoPlayer from "./VideoPlayer";

interface MediaItem {
	id: string;
	fileName: string;
	cloudinaryUrl: string;
	mediaType: string;
	fileSize: number;
	mimeType: string;
	uploadedAt: string;
}

interface AdminMediaGridProps {
	media: MediaItem[];
	isLoading?: boolean;
	onDeleteSuccess?: () => void;
	adminToken: string;
}

export default function AdminMediaGrid({
	media,
	isLoading = false,
	onDeleteSuccess,
	adminToken,
}: AdminMediaGridProps) {
	const { showSuccess, showError } = useToast();
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
		null,
	);
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const images = media.filter((m) => m.mediaType === "image");
	const videos = media.filter((m) => m.mediaType === "video");

	const handleImageClick = (index: number) => {
		setSelectedImageIndex(index);
	};

	const handleVideoClick = (id: string) => {
		setSelectedVideoId(id);
	};

	const downloadFile = async (url: string, fileName: string) => {
		try {
			const response = await fetch(url, { cache: "no-store" });
			if (!response.ok) {
				throw new Error("Failed to download");
			}
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download = fileName || "download";
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch (error) {
			console.error("Download failed:", error);
			window.location.href = url;
		}
	};

	const getMediaDownloadUrl = (item: MediaItem): string => {
		if (item.mediaType === "image") {
			return getDownloadUrl(item.cloudinaryUrl);
		}
		if (item.mediaType === "video") {
			return buildOptimizedUrl(item.cloudinaryUrl, {
				quality: "auto",
				format: "auto",
			});
		}
		return item.cloudinaryUrl;
	};

	const handleDeleteClick = (e: React.MouseEvent, mediaId: string) => {
		e.stopPropagation();
		setSelectedMediaId(mediaId);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedMediaId) return;

		try {
			setDeleteLoading(true);
			const response = await fetch(`/api/media/${selectedMediaId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to delete media");
			}

			showSuccess("Media deleted successfully");
			setDeleteDialogOpen(false);
			setSelectedMediaId(null);
			onDeleteSuccess?.();
		} catch (error) {
			console.error("Error deleting media:", error);
			showError("Failed to delete media. Please try again.");
		} finally {
			setDeleteLoading(false);
		}
	};

	// Format file size to human readable
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	if (isLoading) {
		return (
			<Grid container spacing={2}>
				{[...Array(6)].map((_, i) => (
					<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
						<Skeleton variant="rectangular" height={300} />
					</Grid>
				))}
			</Grid>
		);
	}

	if (media.length === 0) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "400px",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<ImageIcon sx={{ fontSize: 80, color: "text.disabled" }} />
				<Typography variant="h6" color="text.secondary">
					No media uploaded yet
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Upload images and videos to see them here
				</Typography>
			</Box>
		);
	}

	const selectedMediaFile = media.find((m) => m.id === selectedMediaId);

	return (
		<>
			{/* Render media grid */}
			<Grid container spacing={2}>
				{media.map((item, index) => {
					const isVideo = item.mediaType === "video";
					const isImage = item.mediaType === "image";

					return (
						<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
							<Card
								sx={{
									height: "100%",
									display: "flex",
									flexDirection: "column",
									transition: "transform 0.2s, box-shadow 0.2s",
									"&:hover": {
										transform: "translateY(-4px)",
										boxShadow: 4,
									},
									position: "relative",
								}}
							>
								<CardActionArea
									onClick={() => {
										if (isImage) {
											handleImageClick(
												images.findIndex((m) => m.id === item.id),
											);
										} else if (isVideo) {
											handleVideoClick(item.id);
										}
									}}
									sx={{ position: "relative", height: 250, overflow: "hidden" }}
								>
									<Box
										sx={{
											position: "absolute",
											inset: 0,
											background:
												"linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
											zIndex: 1,
											pointerEvents: "none",
										}}
									/>
									<CardMedia
										component="img"
										image={
											isVideo
												? getVideoPosterUrl(item.cloudinaryUrl)
												: getThumbnailUrl(item.cloudinaryUrl)
										}
										alt={item.fileName}
										sx={{
											height: "100%",
											objectFit: "cover",
											backgroundColor: "#f5f5f5",
											position: "relative",
											zIndex: 0,
										}}
										loading="lazy"
										srcSet={
											isImage
												? getResponsiveSrcSet(item.cloudinaryUrl)
												: undefined
										}
										sizes={
											isImage
												? "(max-width: 600px) 300px, (max-width: 1200px) 600px, 900px"
												: undefined
										}
									/>

									{/* Play icon overlay for videos */}
									{isVideo && (
										<Box
											sx={{
												position: "absolute",
												top: "50%",
												left: "50%",
												transform: "translate(-50%, -50%)",
												backgroundColor: "rgba(0, 0, 0, 0.6)",
												borderRadius: "50%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												width: 60,
												height: 60,
												transition: "background-color 0.2s",
												zIndex: 2,
											}}
										>
											<PlayCircleIcon
												sx={{
													fontSize: 40,
													color: "white",
												}}
											/>
										</Box>
									)}

									{/* Download button */}
									<Box
										sx={{
											position: "absolute",
											bottom: 8,
											right: 8,
											zIndex: 3,
										}}
									>
										<Tooltip title="Download">
											<IconButton
												size="small"
												aria-label={`Download ${item.fileName}`}
												onClick={(event) => {
													event.stopPropagation();
													const url = getMediaDownloadUrl(item);
													if (url) {
														void downloadFile(url, item.fileName);
													}
												}}
												sx={{
													backgroundColor: "rgba(255, 255, 255, 0.9)",
													backdropFilter: "blur(6px)",
													"&:hover": {
														backgroundColor: "rgba(255, 255, 255, 1)",
													},
												}}
											>
												<DownloadIcon sx={{ fontSize: 18 }} />
											</IconButton>
										</Tooltip>
									</Box>

									{/* Media type badge */}
									<Box
										sx={{
											position: "absolute",
											top: 8,
											right: 8,
											zIndex: 2,
										}}
									>
										<Chip
											icon={isVideo ? <VideoLibraryIcon /> : <ImageIcon />}
											label={isVideo ? "Video" : "Image"}
											size="small"
											sx={{
												backgroundColor: "rgba(0, 0, 0, 0.6)",
												color: "white",
												"& .MuiChip-icon": {
													color: "white !important",
												},
											}}
										/>
									</Box>

									{/* Admin delete button */}
									<Box
										sx={{
											position: "absolute",
											top: 8,
											left: 8,
											zIndex: 3,
										}}
									>
										<IconButton
											size="small"
											color="error"
											onClick={(e) => handleDeleteClick(e, item.id)}
											sx={{
												backgroundColor: "rgba(255, 255, 255, 0.9)",
												"&:hover": {
													backgroundColor: "rgba(255, 255, 255, 1)",
												},
											}}
										>
											<DeleteIcon sx={{ fontSize: 18 }} />
										</IconButton>
									</Box>
								</CardActionArea>

								{/* Card content with metadata */}
								<Box
									sx={{
										p: 1.5,
										display: "flex",
										flexDirection: "column",
										gap: 0.5,
										flexGrow: 1,
									}}
								>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 500,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
										title={item.fileName}
									>
										{item.fileName}
									</Typography>

									<Stack spacing={0.5}>
										<Typography variant="caption" color="text.secondary">
											{formatFileSize(item.fileSize)}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{format(new Date(item.uploadedAt), "MMM d, yyyy")}
										</Typography>
									</Stack>
								</Box>
							</Card>
						</Grid>
					);
				})}
			</Grid>

			{/* Image Lightbox */}
			{selectedImageIndex !== null && (
				<ImageLightbox
					images={images}
					initialIndex={selectedImageIndex}
					onClose={() => setSelectedImageIndex(null)}
				/>
			)}

			{/* Video Player Modal */}
			{selectedVideoId !== null && (
				<VideoPlayer
					videoUrl={
						media.find((m) => m.id === selectedVideoId)?.cloudinaryUrl || ""
					}
					fileName={media.find((m) => m.id === selectedVideoId)?.fileName || ""}
					onClose={() => setSelectedVideoId(null)}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
			>
				<DialogTitle>Delete Media?</DialogTitle>
				<DialogContent>
					<Typography sx={{ mb: 1 }}>
						Are you sure you want to delete{" "}
						<strong>{selectedMediaFile?.fileName}</strong>?
					</Typography>
					<Typography color="warning.main" variant="body2">
						This file will be permanently deleted from Cloudinary and cannot be
						undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						disabled={deleteLoading}
					>
						{deleteLoading ? "Deleting..." : "Delete"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

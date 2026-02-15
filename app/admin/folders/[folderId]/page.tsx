"use client";

import { useToast } from "@/providers/ToastProvider";
import AdminMediaGrid from "@/components/folder/AdminMediaGrid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Paper,
	Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	buildOptimizedUrl,
	getDownloadUrl,
} from "@/lib/cloudinaryOptimization";

interface MediaItem {
	id: string;
	fileName: string;
	cloudinaryUrl: string;
	mediaType: string;
	fileSize: number;
	mimeType: string;
	uploadedAt: string;
}

interface FolderData {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	sizeInBytes: number;
	mediaCount: number;
}

export default function AdminFolderViewPage() {
	const router = useRouter();
	const params = useParams();
	const { showSuccess, showError } = useToast();
	const folderId = params.folderId as string;

	const [folder, setFolder] = useState<FolderData | null>(null);
	const [media, setMedia] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [mediaLoading, setMediaLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		// Check admin token
		const token = localStorage.getItem("adminToken");
		if (!token) {
			router.push("/admin/login");
			return;
		}

		const fetchFolder = async () => {
			try {
				const response = await fetch(`/api/folders/${folderId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error("Failed to load folder");
				}

				const data = await response.json();
				setFolder(data);
			} catch (err) {
				console.error("Error loading folder:", err);
				throw err;
			}
		};

		const fetchMedia = async () => {
			try {
				setMediaLoading(true);
				setError(null);

				const response = await fetch(`/api/folders/${folderId}/media`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error("Failed to load media");
				}

				const data = await response.json();
				setMedia(data.media || []);
			} catch (err) {
				console.error("Error loading media:", err);
				setError(err instanceof Error ? err.message : "Failed to load media");
			} finally {
				setMediaLoading(false);
			}
		};

		// Fetch folder details and media
		Promise.all([fetchFolder(), fetchMedia()])
			.catch((err) => {
				console.error("Error loading folder:", err);
				setError("Failed to load folder");
			})
			.finally(() => setLoading(false));
	}, [router, folderId]);

	const handleUpload = () => {
		router.push(`/admin/folders/${folderId}/upload`);
	};

	const handleMediaDeleteSuccess = async () => {
		// Refresh media list and folder data after deletion
		const token = localStorage.getItem("adminToken");
		if (!token) return;

		try {
			// Refresh folder data (to get updated size)
			const folderRes = await fetch(`/api/folders/${folderId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (folderRes.ok) {
				const folderData = await folderRes.json();
				setFolder(folderData);
			}

			// Refresh media list
			const mediaRes = await fetch(`/api/folders/${folderId}/media`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (mediaRes.ok) {
				const mediaData = await mediaRes.json();
				setMedia(mediaData.media || []);
			}
		} catch (err) {
			console.error("Error refreshing data:", err);
		}
	};

	const handleDeleteFolder = async () => {
		try {
			setDeleteLoading(true);
			const token = localStorage.getItem("adminToken");

			const response = await fetch(`/api/folders/${folderId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to delete folder");
			}

			// Show success and redirect
			showSuccess("Folder deleted successfully! Redirecting...");
			setTimeout(() => {
				router.push("/admin/folders");
			}, 1500);
		} catch (err) {
			console.error("Error deleting folder:", err);
			showError("Failed to delete folder. Please try again.");
		} finally {
			setDeleteLoading(false);
			setDeleteDialogOpen(false);
		}
	};

	const handleGoBack = () => {
		router.back();
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

	const handleDownloadAll = async () => {
		if (media.length === 0) return;
		for (const item of media) {
			const url = getMediaDownloadUrl(item);
			if (url) {
				await downloadFile(url, item.fileName);
			}
			await new Promise((resolve) => setTimeout(resolve, 150));
		}
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (!folder) {
		return (
			<Container maxWidth="lg">
				<Box sx={{ my: 4 }}>
					<Alert severity="error">Folder not found</Alert>
					<Button variant="contained" onClick={handleGoBack} sx={{ mt: 2 }}>
						Go Back
					</Button>
				</Box>
			</Container>
		);
	}

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	return (
		<Container maxWidth="lg">
			<Box sx={{ my: 4 }}>
				<Paper
					elevation={3}
					sx={{
						p: { xs: 3, md: 4 },
						borderRadius: 3,
						background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-start",
							mb: 4,
							flexWrap: "wrap",
							gap: 2,
						}}
					>
						<Box sx={{ flex: 1, minWidth: 200 }}>
							<Button
								startIcon={<ArrowBackIcon />}
								onClick={handleGoBack}
								sx={{ mb: 2 }}
							>
								Back to Folders
							</Button>
							<Typography variant="h4" component="h1" gutterBottom>
								{folder.name}
							</Typography>
							{folder.description && (
								<Typography variant="body1" color="text.secondary">
									{folder.description}
								</Typography>
							)}
							<Box
								sx={{
									mt: 2,
									display: "flex",
									gap: 3,
									flexWrap: "wrap",
								}}
							>
								<Box>
									<Typography variant="caption" color="text.secondary">
										Files
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{media.length}
									</Typography>
								</Box>
								<Box>
									<Typography variant="caption" color="text.secondary">
										Size
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{formatFileSize(folder.sizeInBytes)}
									</Typography>
								</Box>
								<Box>
									<Typography variant="caption" color="text.secondary">
										Created
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{new Date(folder.createdAt).toLocaleDateString()}
									</Typography>
								</Box>
							</Box>
						</Box>

						<Box
							sx={{
								display: "flex",
								gap: 1,
								flexWrap: "wrap",
								justifyContent: "flex-end",
							}}
						>
							<Button
								variant="contained"
								startIcon={<DownloadIcon />}
								onClick={handleDownloadAll}
								disabled={media.length === 0}
							>
								Download all
							</Button>
							<Button
								variant="contained"
								color="primary"
								startIcon={<CloudUploadIcon />}
								onClick={handleUpload}
							>
								Upload Files
							</Button>
							<Button
								variant="outlined"
								color="error"
								startIcon={<DeleteIcon />}
								onClick={() => setDeleteDialogOpen(true)}
							>
								Delete Folder
							</Button>
						</Box>
					</Box>

					{error && (
						<Alert severity="error" sx={{ mb: 3 }}>
							{error}
						</Alert>
					)}

					<Box sx={{ mt: 4 }}>
						<Typography variant="h6" sx={{ mb: 2 }}>
							Gallery
						</Typography>
						<AdminMediaGrid
							media={media}
							isLoading={mediaLoading}
							adminToken={localStorage.getItem("adminToken") || ""}
							onDeleteSuccess={handleMediaDeleteSuccess}
						/>
					</Box>
				</Paper>
			</Box>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
			>
				<DialogTitle>Delete Folder?</DialogTitle>
				<DialogContent>
					<Typography sx={{ mb: 2 }}>
						Are you sure you want to delete <strong>{folder.name}</strong>?
					</Typography>
					<Typography color="error" variant="body2">
						This will permanently delete all {media.length} file(s) from
						Cloudinary and cannot be undone. You will free up{" "}
						<strong>{formatFileSize(folder.sizeInBytes)}</strong>.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleDeleteFolder}
						color="error"
						variant="contained"
						disabled={deleteLoading}
					>
						{deleteLoading ? "Deleting..." : "Delete Folder"}
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
	Container,
	Box,
	Typography,
	CircularProgress,
	Button,
	Paper,
	Alert,
	ToggleButton,
	ToggleButtonGroup,
	useMediaQuery,
	useTheme,
	Chip,
} from "@mui/material";
import MediaGrid from "@/components/folder/MediaGrid";
import LogoutIcon from "@mui/icons-material/Logout";
import DownloadIcon from "@mui/icons-material/Download";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
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

export default function FolderViewPage() {
	const router = useRouter();
	const params = useParams();
	const folderId = params.folderId as string;

	const [folder, setFolder] = useState<any>(null);
	const [media, setMedia] = useState<MediaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [mediaLoading, setMediaLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mobileColumns, setMobileColumns] = useState<1 | 2 | 3>(1);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const fetchMedia = useCallback(
		async (token: string) => {
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
		},
		[folderId],
	);

	useEffect(() => {
		// Check if user has access token
		const token = localStorage.getItem("folderToken");
		const folderData = localStorage.getItem("folderData");

		if (!token || !folderData) {
			router.push(`/folder/access?id=${folderId}`);
			return;
		}

		const parsedFolder = JSON.parse(folderData);

		// Verify folder ID matches
		if (parsedFolder.id !== folderId) {
			router.push(`/folder/access?id=${folderId}`);
			return;
		}

		setFolder(parsedFolder);
		setLoading(false);

		// Fetch media
		fetchMedia(token);
	}, [fetchMedia, router, folderId]);

	const handleLogout = () => {
		localStorage.removeItem("folderToken");
		localStorage.removeItem("folderData");
		router.push("/folder/access");
	};

	const handleMobileColumnsChange = (
		_: React.MouseEvent<HTMLElement>,
		value: 1 | 2 | null,
	) => {
		if (value) {
			setMobileColumns(value);
		}
	};

	const getMediaDownloadUrl = (item: MediaItem): string => {
		if (item.mediaType === "image") {
			return getDownloadUrl(item.cloudinaryUrl);
		}
		if (item.mediaType === "video") {
			return buildOptimizedUrl(item.cloudinaryUrl, {
				quality: 100,
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
							<Typography variant="h4" component="h1" gutterBottom>
								{folder?.name}
							</Typography>
							{folder?.description && (
								<Typography variant="body1" color="text.secondary">
									{folder.description}
								</Typography>
							)}
							<Box
								sx={{
									mt: 2,
									display: "flex",
									gap: 1,
									flexWrap: "wrap",
								}}
							>
								<Chip
									label={`${media.length} file${media.length !== 1 ? "s" : ""}`}
									color="primary"
									variant="outlined"
									size="small"
									sx={{ fontWeight: 600 }}
								/>
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
								variant="outlined"
								color="error"
								onClick={handleLogout}
								startIcon={<LogoutIcon />}
							>
								Logout
							</Button>
						</Box>
					</Box>

					{error && (
						<Alert severity="error" sx={{ mb: 3 }}>
							{error}
						</Alert>
					)}

					{isMobile && (
						<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
							<ToggleButtonGroup
								value={mobileColumns}
								exclusive
								onChange={handleMobileColumnsChange}
								aria-label="Mobile gallery layout"
							>
								<ToggleButton
									value={1}
									aria-label="1 column"
									sx={{
										minWidth: 48,
										minHeight: 48,
										"& .MuiSvgIcon-root": { fontSize: 28 },
									}}
								>
									<ViewAgendaIcon />
								</ToggleButton>
								<ToggleButton
									value={2}
									aria-label="2 columns"
									sx={{
										minWidth: 48,
										minHeight: 48,
										"& .MuiSvgIcon-root": { fontSize: 28 },
									}}
								>
									<ViewModuleIcon />
								</ToggleButton>
							</ToggleButtonGroup>
						</Box>
					)}

					<Box sx={{ mt: 4 }}>
						<MediaGrid
							media={media}
							isLoading={mediaLoading}
							mobileColumns={mobileColumns}
						/>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
}

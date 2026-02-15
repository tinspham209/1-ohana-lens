"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
	Box,
	Typography,
	LinearProgress,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Alert,
	Paper,
	CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";

interface MediaLimits {
	imageMaxSizeMB: number;
	videoMaxSizeMB: number;
	imageMaxPx: number;
	assetMaxTotalPx: number;
	rateLimit: {
		allowed: number;
		remaining: number;
		percentageRemaining: number;
	};
}

interface FileUploadResult {
	fileName: string;
	success: boolean;
	error?: string;
	code?: string;
	suggestion?: string;
	compressed?: boolean;
	originalSize?: number;
	compressedSize?: number;
	compressionRatio?: number;
	media?: {
		id: string;
		url: string;
		type: string;
	};
}

interface FileUploadZoneProps {
	folderId: string;
	onUploadComplete: () => void;
}

export default function FileUploadZone({
	folderId,
	onUploadComplete,
}: FileUploadZoneProps) {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [results, setResults] = useState<FileUploadResult[]>([]);
	const [error, setError] = useState("");
	const [limits, setLimits] = useState<MediaLimits | null>(null);
	const [loadingLimits, setLoadingLimits] = useState(true);

	// Fetch media limits on component mount
	useEffect(() => {
		const fetchLimits = async () => {
			try {
				const response = await fetch("/api/media/limits");
				if (response.ok) {
					const data = await response.json();
					setLimits(data.data);
				}
			} catch (err) {
				console.error("Error fetching media limits:", err);
				// Use defaults if fetch fails
				setLimits({
					imageMaxSizeMB: 10,
					videoMaxSizeMB: 100,
					imageMaxPx: 25000000,
					assetMaxTotalPx: 50000000,
					rateLimit: {
						allowed: 500,
						remaining: 500,
						percentageRemaining: 100,
					},
				});
			} finally {
				setLoadingLimits(false);
			}
		};

		fetchLimits();
	}, []);

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (acceptedFiles.length === 0) return;

			setUploading(true);
			setProgress(0);
			setError("");
			setResults([]);

			const token = localStorage.getItem("adminToken");

			if (!token) {
				setError("Admin token not found. Please login again.");
				setUploading(false);
				return;
			}

			try {
				const formData = new FormData();

				acceptedFiles.forEach((file) => {
					formData.append("files", file);
				});

				const response = await fetch(`/api/media/upload/${folderId}`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Upload failed");
				}

				setResults(data.results);
				setProgress(100);

				// Call callback after successful upload
				setTimeout(() => {
					onUploadComplete();
				}, 1000);
			} catch (err: any) {
				console.error("Upload error:", err);
				setError(err.message || "Upload failed");
			} finally {
				setUploading(false);
			}
		},
		[folderId, onUploadComplete],
	);

	const onDropRejected = useCallback((fileRejections: any[]) => {
		const rejectionReasons = fileRejections.map((rejection) => {
			const errors = rejection.errors.map((e: any) => {
				if (e.code === "file-too-large") {
					return `${rejection.file.name}: File too large (max ${limits?.videoMaxSizeMB || 100}MB)`;
				}
				if (e.code === "file-invalid-type") {
					return `${rejection.file.name}: Invalid file type`;
				}
				return `${rejection.file.name}: ${e.message}`;
			});
			return errors.join(", ");
		});
		
		setError(rejectionReasons.join("; "));
		console.error("Files rejected:", rejectionReasons);
	}, [limits]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		accept: {
			"image/*": [".jpg", ".jpeg", ".png", ".gif"],
			"video/*": [".mp4", ".mov", ".webm"],
		},
		maxSize: limits ? limits.videoMaxSizeMB * 1024 * 1024 : 100 * 1024 * 1024, // Use video limit (100MB) as max
		disabled: uploading || loadingLimits,
	});

	return (
		<Box>
			{loadingLimits && (
				<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
					<CircularProgress size={24} />
					<Typography variant="body2" sx={{ ml: 1 }}>
						Loading limits...
					</Typography>
				</Box>
			)}

			<Paper
				{...getRootProps()}
				sx={{
					border: "2px dashed",
					borderColor: isDragActive ? "primary.main" : "grey.400",
					borderRadius: 2,
					padding: 4,
					textAlign: "center",
					cursor: uploading || loadingLimits ? "not-allowed" : "pointer",
					bgcolor: isDragActive ? "action.hover" : "background.paper",
					"&:hover": {
						borderColor:
							uploading || loadingLimits ? "grey.400" : "primary.main",
						bgcolor:
							uploading || loadingLimits ? "background.paper" : "action.hover",
					},
					opacity: uploading || loadingLimits ? 0.7 : 1,
				}}
			>
				<input {...getInputProps()} />
				<CloudUploadIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
				{isDragActive ? (
					<Typography variant="h6">Drop files here...</Typography>
				) : (
					<>
						<Typography variant="h6" gutterBottom>
							Drag & drop files here
						</Typography>
						<Typography variant="body2" color="text.secondary">
							or click to select files
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							display="block"
							sx={{ mt: 1 }}
						>
							Supported: JPG, PNG, GIF, MP4, MOV, WebM
						</Typography>
						{limits && (
							<Typography
								variant="caption"
								color="text.secondary"
								display="block"
								sx={{ mt: 1, fontWeight: 500 }}
							>
								Max: {limits.imageMaxSizeMB}MB (images) •{" "}
								{limits.videoMaxSizeMB}MB (videos)
							</Typography>
						)}
					</>
				)}
			</Paper>

			{limits && limits.rateLimit.percentageRemaining < 20 && (
				<Alert severity="warning" sx={{ mt: 2 }}>
					Rate limit approaching: {limits.rateLimit.remaining} /
					{limits.rateLimit.allowed} requests remaining
				</Alert>
			)}

			{uploading && (
				<Box sx={{ mt: 2 }}>
					<LinearProgress variant="determinate" value={progress} />
					<Typography
						variant="body2"
						color="text.secondary"
						align="center"
						sx={{ mt: 1 }}
					>
						Uploading files...
					</Typography>
				</Box>
			)}

			{error && (
				<Alert severity="error" sx={{ mt: 2 }}>
					{error}
				</Alert>
			)}

			{results.length > 0 && (
				<Box sx={{ mt: 2 }}>
					<Typography variant="h6" gutterBottom>
						Upload Results
					</Typography>
					<List>
						{results.map((result, index) => (
							<ListItem key={index}>
								<ListItemIcon>
									{result.success ? (
										<CheckCircleIcon color="success" />
									) : (
										<ErrorIcon color="error" />
									)}
								</ListItemIcon>
								<ListItemText
									primary={result.fileName}
									secondary={
										<Box sx={{ mt: 1 }}>
											<Typography variant="body2">
												{result.success
													? result.compressed
														? `Uploaded (compressed: ${(result.originalSize! / (1024 * 1024)).toFixed(2)}MB → ${(result.compressedSize! / (1024 * 1024)).toFixed(2)}MB)`
														: "Uploaded successfully"
													: result.error}
											</Typography>
											{result.suggestion && (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														mt: 0.5,
													}}
												>
													<InfoIcon
														sx={{ fontSize: 14, mr: 0.5, color: "info.main" }}
													/>
													<Typography variant="caption" color="info.main">
														{result.suggestion}
													</Typography>
												</Box>
											)}
										</Box>
									}
								/>
							</ListItem>
						))}
					</List>
				</Box>
			)}
		</Box>
	);
}

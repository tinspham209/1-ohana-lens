"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
	Container,
	Box,
	Typography,
	Button,
	Paper,
	CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileUploadZone from "@/components/FileUploadZone";

export default function UploadPage() {
	const router = useRouter();
	const params = useParams();
	const folderId = params.folderId as string;

	const [folder, setFolder] = useState<any>(null);
	console.log("folder: ", folder);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchFolder();
	}, []);

	const fetchFolder = async () => {
		const token = localStorage.getItem("adminToken");

		if (!token) {
			router.push("/admin/login");
			return;
		}

		try {
			const response = await fetch(`/api/folders/${folderId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Folder not found");
			}

			const data = await response.json();
			console.log("data: ", data);
			console.log("data.folder: ", data.folder);
			setFolder(data);
		} catch (error) {
			console.error("Fetch folder error:", error);
			router.push("/admin/folders");
		} finally {
			setLoading(false);
		}
	};

	const handleUploadComplete = () => {
		// Refresh folder data to update media count
		fetchFolder();
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
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push("/admin/folders")}
					sx={{ mb: 2 }}
				>
					Back to Folders
				</Button>

				<Paper elevation={3} sx={{ p: 4 }}>
					<Typography variant="h4" gutterBottom>
						Upload Media
					</Typography>
					<Typography variant="body1" color="text.secondary" paragraph>
						<strong>Folder:</strong> {folder?.name}
					</Typography>
					{folder?.description && (
						<Typography variant="body2" color="text.secondary" paragraph>
							{folder.description}
						</Typography>
					)}

					<Box sx={{ mt: 4 }}>
						<FileUploadZone
							folderId={folderId}
							onUploadComplete={handleUploadComplete}
						/>
					</Box>

					<Box sx={{ mt: 4 }}>
						<Typography variant="body2" color="text.secondary">
							<strong>Media Count:</strong> {folder?._count?.media || 0} files
						</Typography>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
}

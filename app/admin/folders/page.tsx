"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import FolderExplorer from "@/components/admin/FolderExplorer";
import FolderFormDialog, {
	FolderFormInputs,
} from "@/components/admin/FolderFormDialog";
import DeleteFolderDialog from "@/components/admin/DeleteFolderDialog";
import {
	Container,
	Box,
	Typography,
	Button,
	CircularProgress,
	Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface Folder {
	id: string;
	name: string;
	description?: string;
	folderKey: string;
	sizeInBytes: number;
	createdAt: string;
	_count?: {
		media: number;
	};
}

export default function FoldersPage() {
	const router = useRouter();
	const { showSuccess, showError } = useToast();
	const [folders, setFolders] = useState<Folder[]>([]);
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
	const [generatedPassword, setGeneratedPassword] = useState("");
	const [error, setError] = useState("");
	const [actionLoading, setActionLoading] = useState(false);

	useEffect(() => {
		fetchFolders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchFolders = async () => {
		const token = localStorage.getItem("adminToken");

		if (!token) {
			router.push("/admin/login");
			return;
		}

		try {
			const response = await fetch("/api/folders", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch folders");
			}

			const data = await response.json();
			setFolders(data.folders);
		} catch (error) {
			console.error("Fetch folders error:", error);
			setError("Failed to load folders");
			showError("Failed to load folders");
		} finally {
			setLoading(false);
		}
	};

	const onCreateSubmit = async (data: FolderFormInputs) => {
		setError("");
		setActionLoading(true);

		const token = localStorage.getItem("adminToken");

		try {
			const response = await fetch("/api/folders", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error || "Failed to create folder");
			}

			setGeneratedPassword(responseData.password);
			fetchFolders();
		} catch (error: any) {
			setError(error.message);
			showError(error.message || "Failed to create folder");
		} finally {
			setActionLoading(false);
		}
	};

	const onEditSubmit = async (data: FolderFormInputs) => {
		if (!selectedFolder) return;

		setError("");
		setActionLoading(true);

		const token = localStorage.getItem("adminToken");

		try {
			const response = await fetch(`/api/folders/${selectedFolder.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error("Failed to update folder");
			}

			showSuccess("Folder updated successfully!");
			setEditDialogOpen(false);
			setSelectedFolder(null);
			setSelectedFolderId(null);
			fetchFolders();
		} catch (error: any) {
			setError(error.message);
			showError(error.message);
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteFolder = async () => {
		if (!selectedFolder) return;

		setError("");
		setActionLoading(true);

		const token = localStorage.getItem("adminToken");

		try {
			const response = await fetch(`/api/folders/${selectedFolder.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to delete folder");
			}

			showSuccess("Folder deleted successfully!");
			setDeleteDialogOpen(false);
			setSelectedFolder(null);
			setSelectedFolderId(null);
			fetchFolders();
		} catch (error: any) {
			setError(error.message);
			showError(error.message);
		} finally {
			setActionLoading(false);
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
		<Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
			<Box sx={{ py: { xs: 1.5, sm: 2, md: 3 } }}>
				{/* Header */}
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						justifyContent: "space-between",
						alignItems: { xs: "flex-start", sm: "center" },
						gap: { xs: 2, sm: 2 },
						mb: { xs: 2, sm: 3 },
					}}
				>
					<Typography
						variant="h4"
						sx={{
							fontWeight: 600,
							fontSize: { xs: "1.5rem", sm: "2.125rem" },
						}}
					>
						📁 Manage Folders
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: 1,
							flexDirection: { xs: "column-reverse", sm: "row" },
							width: { xs: "100%", sm: "auto" },
						}}
					>
						<Button
							variant="outlined"
							startIcon={<ArrowBackIcon />}
							onClick={() => router.push("/admin")}
							size="small"
							sx={{ width: { xs: "100%", sm: "auto" } }}
						>
							Back
						</Button>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => setCreateDialogOpen(true)}
							size="small"
							sx={{ width: { xs: "100%", sm: "auto" } }}
						>
							Create Folder
						</Button>
					</Box>
				</Box>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
						{error}
					</Alert>
				)}

				{/* Main Explorer View */}
				<Box
					sx={{
						height: { xs: "calc(100vh - 250px)", sm: "calc(100vh - 200px)" },
					}}
				>
					<FolderExplorer
						folders={folders}
						selectedFolderId={selectedFolderId}
						onSelectFolder={setSelectedFolderId}
						onEdit={(folder) => {
							setSelectedFolder(folder);
							setEditDialogOpen(true);
						}}
						onDelete={(folder) => {
							setSelectedFolder(folder);
							setDeleteDialogOpen(true);
						}}
						onOpen={(folderId) => {
							router.push(`/admin/folders/${folderId}`);
						}}
					/>
				</Box>

				<FolderFormDialog
					open={createDialogOpen}
					isEdit={false}
					generatedPassword={generatedPassword}
					onSubmit={onCreateSubmit}
					onClose={() => {
						if (actionLoading) return;
						setCreateDialogOpen(false);
						setGeneratedPassword("");
						setActionLoading(false);
					}}
					disabled={actionLoading}
				/>

				<FolderFormDialog
					open={editDialogOpen}
					isEdit={true}
					initialValues={
						selectedFolder
							? {
									name: selectedFolder.name,
									description: selectedFolder.description || "",
								}
							: undefined
					}
					onSubmit={onEditSubmit}
					onClose={() => {
						if (actionLoading) return;
						setEditDialogOpen(false);
						setSelectedFolder(null);
						setSelectedFolderId(null);
					}}
					disabled={actionLoading}
				/>

				<DeleteFolderDialog
					open={deleteDialogOpen}
					folder={selectedFolder}
					loading={actionLoading}
					onClose={() => setDeleteDialogOpen(false)}
					onConfirm={handleDeleteFolder}
				/>
			</Box>
		</Container>
	);
}

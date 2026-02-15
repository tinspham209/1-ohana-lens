"use client";

import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Alert,
	Box,
	Typography,
	Button,
	CircularProgress,
} from "@mui/material";

interface FolderSummary {
	id: string;
	name: string;
	sizeInBytes: number;
	_count?: {
		media: number;
	};
}

interface DeleteFolderDialogProps {
	open: boolean;
	folder: FolderSummary | null;
	loading: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export default function DeleteFolderDialog({
	open,
	folder,
	loading,
	onClose,
	onConfirm,
}: DeleteFolderDialogProps) {
	return (
		<Dialog open={open} onClose={() => !loading && onClose()}>
			<DialogTitle>Delete Folder</DialogTitle>
			<DialogContent sx={{ minWidth: 400 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					This will permanently delete the folder and all its media.
				</Alert>
				{folder && (
					<Box>
						<Typography variant="body2" sx={{ mb: 1 }}>
							<strong>Folder:</strong> {folder.name}
						</Typography>
						<Typography variant="body2" sx={{ mb: 1 }}>
							<strong>Files:</strong> {folder._count?.media || 0}
						</Typography>
						<Typography variant="body2">
							<strong>Size:</strong>{" "}
							{folder.sizeInBytes > 0
								? `${(folder.sizeInBytes / 1024 / 1024).toFixed(2)} MB`
								: "0 Bytes"}
						</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					color="error"
					disabled={loading}
				>
					{loading ? <CircularProgress size={24} /> : "Delete"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

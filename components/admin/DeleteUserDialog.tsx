"use client";

import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Alert,
	CircularProgress,
	Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface DeleteUserDialogProps {
	open: boolean;
	loading: boolean;
	error: string;
	username: string;
	onClose: () => void;
	onConfirm: () => void;
}

export default function DeleteUserDialog({
	open,
	loading,
	error,
	username,
	onClose,
	onConfirm,
}: DeleteUserDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 3 },
			}}
		>
			<DialogTitle>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<WarningAmberIcon color="error" />
					Delete Admin User
				</Box>
			</DialogTitle>
			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				<Typography>
					Are you sure you want to delete the admin user{" "}
					<strong>{username}</strong>?
				</Typography>

				<Alert severity="warning" sx={{ mt: 2 }}>
					<Typography variant="body2">
						This action cannot be undone. All sessions associated with this user
						will be terminated.
					</Typography>
				</Alert>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} disabled={loading}>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					color="error"
					disabled={loading}
					startIcon={loading ? <CircularProgress size={16} /> : null}
				>
					{loading ? "Deleting..." : "Delete User"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

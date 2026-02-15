"use client";

import { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Box,
	Alert,
	CircularProgress,
} from "@mui/material";

interface UserFormDialogProps {
	open: boolean;
	loading: boolean;
	error: string;
	onClose: () => void;
	onSubmit: (data: UserFormInputs) => void;
}

export interface UserFormInputs {
	username: string;
	email: string;
	password: string;
}

export default function UserFormDialog({
	open,
	loading,
	error,
	onClose,
	onSubmit,
}: UserFormDialogProps) {
	const [formData, setFormData] = useState<UserFormInputs>({
		username: "",
		email: "",
		password: "",
	});

	const [validationErrors, setValidationErrors] = useState<
		Partial<Record<keyof UserFormInputs, string>>
	>({});

	const handleChange = (field: keyof UserFormInputs, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear validation error for this field
		setValidationErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const validate = (): boolean => {
		const errors: Partial<Record<keyof UserFormInputs, string>> = {};

		if (!formData.username.trim()) {
			errors.username = "Username is required";
		} else if (formData.username.length < 3) {
			errors.username = "Username must be at least 3 characters";
		}

		if (!formData.email.trim()) {
			errors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = "Invalid email format";
		}

		if (!formData.password) {
			errors.password = "Password is required";
		} else if (formData.password.length < 8) {
			errors.password = "Password must be at least 8 characters";
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		onSubmit(formData);
	};

	const handleClose = () => {
		setFormData({ username: "", email: "", password: "" });
		setValidationErrors({});
		onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 3 },
			}}
		>
			<form onSubmit={handleSubmit}>
				<DialogTitle>Create New Admin User</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					<Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
						<TextField
							label="Username"
							value={formData.username}
							onChange={(e) => handleChange("username", e.target.value)}
							error={!!validationErrors.username}
							helperText={validationErrors.username}
							disabled={loading}
							fullWidth
							required
						/>

						<TextField
							label="Email"
							type="email"
							value={formData.email}
							onChange={(e) => handleChange("email", e.target.value)}
							error={!!validationErrors.email}
							helperText={validationErrors.email}
							disabled={loading}
							fullWidth
							required
						/>

						<TextField
							label="Password"
							type="password"
							value={formData.password}
							onChange={(e) => handleChange("password", e.target.value)}
							error={!!validationErrors.password}
							helperText={
								validationErrors.password ||
								"Must be at least 8 characters long"
							}
							disabled={loading}
							fullWidth
							required
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={loading}
						startIcon={loading ? <CircularProgress size={16} /> : null}
					>
						{loading ? "Creating..." : "Create User"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
	Box,
	Container,
	TextField,
	Button,
	Typography,
	Paper,
	Alert,
	CircularProgress,
} from "@mui/material";
import { PasswordField } from "@/components/shared/PasswordField";

// Validation schema
const folderAccessSchema = yup.object({
	folderId: yup
		.string()
		.required("Folder ID is required")
		.uuid("Please enter a valid Folder ID"),
	password: yup
		.string()
		.required("Password is required")
		.min(1, "Password cannot be empty"),
});

type FolderAccessInputs = yup.InferType<typeof folderAccessSchema>;

function FolderAccessContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const folderIdParam = searchParams.get("id") || "";

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
	} = useForm<FolderAccessInputs>({
		resolver: yupResolver(folderAccessSchema),
		mode: "onBlur",
		defaultValues: {
			folderId: folderIdParam,
			password: "",
		},
	});

	// Set folder ID from query param on mount
	if (folderIdParam && searchParams.size > 0) {
		setValue("folderId", folderIdParam);
	}

	const onSubmit = async (data: FolderAccessInputs) => {
		setError("");
		setLoading(true);

		try {
			const response = await fetch("/api/auth/verify-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const responseData = await response.json();

			if (!response.ok) {
				setError(responseData.error || "Access denied");
				setLoading(false);
				return;
			}

			// Store token in localStorage
			localStorage.setItem("folderToken", responseData.token);
			localStorage.setItem("folderData", JSON.stringify(responseData.folder));

			// Redirect to folder view
			router.push(`/folder/${data.folderId}`);
		} catch (err) {
			console.error("Access error:", err);
			setError("An unexpected error occurred");
			setLoading(false);
		}
	};

	return (
		<Container maxWidth="sm">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
					<Typography component="h1" variant="h4" align="center" gutterBottom>
						Access Folder
					</Typography>
					<Typography
						variant="body2"
						align="center"
						color="text.secondary"
						sx={{ mb: 3 }}
					>
						Enter folder ID and password to view photos and videos
					</Typography>

					{error && (
						<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
							{error}
						</Alert>
					)}

					<form onSubmit={handleSubmit(onSubmit)}>
						<Controller
							name="folderId"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									margin="normal"
									required
									fullWidth
									id="folderId"
									label="Folder ID"
									autoFocus={!folderIdParam}
									disabled={isSubmitting}
									error={!!errors.folderId}
									helperText={errors.folderId?.message}
								/>
							)}
						/>
						<PasswordField
							name="password"
							control={control}
							id="password"
							autoFocus={!!folderIdParam}
							disabled={isSubmitting}
						/>
						<Button
							type="submit"
							fullWidth
							variant="contained"
							sx={{ mt: 3, mb: 2 }}
							disabled={isSubmitting || loading}
						>
							{isSubmitting || loading ? (
								<CircularProgress size={24} />
							) : (
								"Access Folder"
							)}
						</Button>
					</form>

					<Box sx={{ mt: 2, textAlign: "center" }}>
						<Typography variant="body2" color="text.secondary">
							<a href="/" style={{ textDecoration: "none", color: "inherit" }}>
								← Back to Home
							</a>
						</Typography>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
}

export default function FolderAccessPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<FolderAccessContent />
		</Suspense>
	);
}

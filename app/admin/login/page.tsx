"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
const loginSchema = yup.object({
	username: yup
		.string()
		.required("Username is required")
		.min(2, "Username must be at least 2 characters"),
	password: yup
		.string()
		.required("Password is required")
		.min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = yup.InferType<typeof loginSchema>;

export default function AdminLoginPage() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormInputs>({
		resolver: yupResolver(loginSchema),
		mode: "onBlur",
	});

	const onSubmit = async (data: LoginFormInputs) => {
		setError("");
		setLoading(true);

		try {
			const response = await fetch("/api/auth/admin-login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const responseData = await response.json();

			if (!response.ok) {
				setError(responseData.error || "Login failed");
				setLoading(false);
				return;
			}

			// Store token in localStorage
			localStorage.setItem("adminToken", responseData.token);
			localStorage.setItem("adminUser", JSON.stringify(responseData.admin));

			// Redirect to admin dashboard
			router.push("/admin");
		} catch (err) {
			console.error("Login error:", err);
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
						Admin Login
					</Typography>
					<Typography
						variant="body2"
						align="center"
						color="text.secondary"
						sx={{ mb: 3 }}
					>
						1 Ohana Lens
					</Typography>

					{error && (
						<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
							{error}
						</Alert>
					)}

					<form onSubmit={handleSubmit(onSubmit)}>
						<Controller
							name="username"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									margin="normal"
									required
									fullWidth
									id="username"
									label="Username"
									autoComplete="username"
									autoFocus
									disabled={isSubmitting}
									error={!!errors.username}
									helperText={errors.username?.message}
								/>
							)}
						/>
						<PasswordField
							name="password"
							control={control}
							id="password"
							autoComplete="current-password"
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
								"Sign In"
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

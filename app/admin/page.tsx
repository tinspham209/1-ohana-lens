"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Container,
	Box,
	Typography,
	CircularProgress,
	Button,
	Paper,
	Grid,
	Card,
	CardContent,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import StorageWarning from "@/components/admin/StorageWarning";
import { formatBytes } from "@/lib/formatBytes";
import { formatDate } from "@/lib/formatDate";
import FolderIcon from "@mui/icons-material/Folder";
import ImageIcon from "@mui/icons-material/Image";
import StorageIcon from "@mui/icons-material/Storage";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";

interface StorageData {
	currentGb: number;
	quotaGb: number;
	percentUsed: number;
	status: "ok" | "warning" | "critical";
	recommendation: string;
	totalFolders: number;
	totalFiles: number;
	bytesUsed: number;
	cloudinary: {
		plan: string;
		lastUpdated: string;
		dateRequested: string;
		credits: {
			used: number;
			limit: number;
			usedPercent: number;
		};
		storage: {
			usedBytes: number;
			usedReadable: string;
			creditsUsage: number;
		};
		bandwidth: {
			usedBytes: number;
			usedReadable: string;
			creditsUsage: number;
		};
		transformations: {
			usage: number;
			creditsUsage: number;
			breakdown: Record<string, number>;
		};
		objects: {
			usage: number;
		};
		impressions: {
			usage: number;
			creditsUsage: number;
		};
		secondsDelivered: {
			usage: number;
			creditsUsage: number;
		};
		resources: {
			primary: number;
			derived: number;
		};
		requests: number;
		mediaLimits: {
			imageMaxSizeBytes: number;
			imageMaxSizeReadable: string;
			videoMaxSizeBytes: number;
			videoMaxSizeReadable: string;
			rawMaxSizeBytes: number;
			rawMaxSizeReadable: string;
			imageMaxPx: number;
			assetMaxTotalPx: number;
		};
		rateLimit: {
			allowed: number;
			remaining: number;
			resetAt: string;
		};
	};
}

export default function AdminDashboard() {
	const router = useRouter();
	const [admin, setAdmin] = useState<any>(null);
	const [storage, setStorage] = useState<StorageData | null>(null);
	const [loading, setLoading] = useState(true);
	const [storageLoading, setStorageLoading] = useState(false);

	useEffect(() => {
		// Check if admin is logged in
		const token = localStorage.getItem("adminToken");
		const adminUser = localStorage.getItem("adminUser");

		if (!token || !adminUser) {
			router.push("/admin/login");
			return;
		}

		setAdmin(JSON.parse(adminUser));
		setLoading(false);

		// Fetch storage data
		fetchStorageData(token);
	}, [router]);

	const fetchStorageData = async (token: string) => {
		try {
			setStorageLoading(true);
			const response = await fetch("/api/storage-usage", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to load storage data");
			}

			const data = await response.json();
			setStorage(data);
		} catch (error) {
			console.error("Error loading storage data:", error);
		} finally {
			setStorageLoading(false);
		}
	};

	const handleLogout = async () => {
		const token = localStorage.getItem("adminToken");

		if (token) {
			try {
				await fetch("/api/auth/admin-logout", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
			} catch (error) {
				console.error("Logout error:", error);
			}
		}

		localStorage.removeItem("adminToken");
		localStorage.removeItem("adminUser");
		router.push("/admin/login");
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
					elevation={0}
					sx={{
						p: { xs: 3, sm: 4 },
						borderRadius: 3,
						background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
						border: "1px solid",
						borderColor: "divider",
						boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
					}}
				>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 4,
							gap: 2,
							flexWrap: "wrap",
						}}
					>
						<Box>
							<Typography variant="h4" component="h1" gutterBottom>
								Admin Dashboard
							</Typography>
							<Typography variant="body1" color="text.secondary">
								Welcome, {admin?.username}!
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Admin ID: {admin?.id}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Email: {admin?.email}
							</Typography>
						</Box>
						<Button
							variant="outlined"
							color="error"
							onClick={handleLogout}
							sx={{ borderRadius: 2, px: 2.5 }}
						>
							Logout
						</Button>
					</Box>

					{/* Storage Warning */}
					{!storageLoading && storage && (
						<StorageWarning
							currentGb={storage.currentGb}
							bytesUsed={storage.bytesUsed}
							quotaGb={storage.quotaGb}
							percentUsed={storage.percentUsed}
							status={storage.status}
							recommendation={storage.recommendation}
						/>
					)}

					{/* Stats Grid */}
					<Grid container spacing={2} sx={{ mb: 4 }}>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Card
								sx={(theme) => ({
									borderRadius: 3,
									border: "1px solid",
									borderColor: theme.palette.divider,
									background: `linear-gradient(135deg, ${alpha(
										theme.palette.primary.light,
										0.18,
									)} 0%, ${alpha(theme.palette.common.white, 0.95)} 60%)`,
									boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									transition: "transform 0.2s ease, box-shadow 0.2s ease",
									"&:hover": {
										transform: "translateY(-2px)",
										boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
									},
								})}
							>
								<CardContent sx={{ p: 2.5 }}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 2,
										}}
									>
										<Box
											sx={(theme) => ({
												width: 48,
												height: 48,
												borderRadius: 2,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												backgroundColor: alpha(
													theme.palette.primary.main,
													0.12,
												),
											})}
										>
											<FolderIcon
												sx={{ fontSize: 28, color: "primary.main" }}
											/>
										</Box>
										<Box>
											<Typography color="text.secondary" variant="caption">
												Total Folders
											</Typography>
											<Typography variant="h5" fontWeight={700}>
												{storage?.totalFolders ?? "-"}
											</Typography>
										</Box>
									</Box>
								</CardContent>
							</Card>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Card
								sx={(theme) => ({
									borderRadius: 3,
									border: "1px solid",
									borderColor: theme.palette.divider,
									background: `linear-gradient(135deg, ${alpha(
										theme.palette.info.light,
										0.18,
									)} 0%, ${alpha(theme.palette.common.white, 0.95)} 60%)`,
									boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									transition: "transform 0.2s ease, box-shadow 0.2s ease",
									"&:hover": {
										transform: "translateY(-2px)",
										boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
									},
								})}
							>
								<CardContent sx={{ p: 2.5 }}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 2,
										}}
									>
										<Box
											sx={(theme) => ({
												width: 48,
												height: 48,
												borderRadius: 2,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												backgroundColor: alpha(theme.palette.info.main, 0.12),
											})}
										>
											<ImageIcon sx={{ fontSize: 28, color: "info.main" }} />
										</Box>
										<Box>
											<Typography color="text.secondary" variant="caption">
												Total Files
											</Typography>
											<Typography variant="h5" fontWeight={700}>
												{storage?.totalFiles ?? "-"}
											</Typography>
										</Box>
									</Box>
								</CardContent>
							</Card>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Card
								sx={(theme) => ({
									borderRadius: 3,
									border: "1px solid",
									borderColor: theme.palette.divider,
									background: `linear-gradient(135deg, ${alpha(
										theme.palette.success.light,
										0.18,
									)} 0%, ${alpha(theme.palette.common.white, 0.95)} 60%)`,
									boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									transition: "transform 0.2s ease, box-shadow 0.2s ease",
									"&:hover": {
										transform: "translateY(-2px)",
										boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
									},
								})}
							>
								<CardContent sx={{ p: 2.5 }}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 2,
										}}
									>
										<Box
											sx={(theme) => ({
												width: 48,
												height: 48,
												borderRadius: 2,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												backgroundColor: alpha(
													theme.palette.success.main,
													0.12,
												),
											})}
										>
											<StorageIcon
												sx={{ fontSize: 28, color: "success.main" }}
											/>
										</Box>
										<Box>
											<Typography color="text.secondary" variant="caption">
												Storage Used
											</Typography>
											<Typography variant="h5" fontWeight={700}>
												{storage?.bytesUsed !== undefined
													? formatBytes(storage.bytesUsed)
													: "-"}
											</Typography>
										</Box>
									</Box>
								</CardContent>
							</Card>
						</Grid>

						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<Card
								sx={(theme) => ({
									borderRadius: 3,
									border: "1px solid",
									borderColor: theme.palette.divider,
									background: `linear-gradient(135deg, ${alpha(
										theme.palette.secondary.light,
										0.18,
									)} 0%, ${alpha(theme.palette.common.white, 0.95)} 60%)`,
									boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									transition: "transform 0.2s ease, box-shadow 0.2s ease",
									"&:hover": {
										transform: "translateY(-2px)",
										boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
									},
								})}
							>
								<CardContent sx={{ p: 2.5 }}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 2,
										}}
									>
										<Box
											sx={(theme) => ({
												width: 48,
												height: 48,
												borderRadius: 2,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												backgroundColor: alpha(
													theme.palette.secondary.main,
													0.12,
												),
											})}
										>
											<PieChartOutlinedIcon
												sx={{ fontSize: 28, color: "secondary.main" }}
											/>
										</Box>
										<Box>
											<Typography color="text.secondary" variant="caption">
												Storage Free
											</Typography>
											<Typography variant="h5" fontWeight={700}>
												{storage?.bytesUsed !== undefined
													? formatBytes(
															storage.quotaGb * 1024 * 1024 * 1024 -
																storage.bytesUsed,
														)
													: "-"}
											</Typography>
										</Box>
									</Box>
								</CardContent>
							</Card>
						</Grid>
					</Grid>

					<Box sx={{ mt: 4 }}>
						<Typography variant="h6" gutterBottom>
							Quick Actions
						</Typography>
						<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
							<Button
								variant="contained"
								href="/admin/folders"
								color="primary"
								sx={{ borderRadius: 2, px: 2.5 }}
							>
								Manage Folders
							</Button>
							<Button
								LinkComponent={"a"}
								variant="outlined"
								href={process.env.NEXT_PUBLIC_CLOUDINARY_DASHBOARD_URL || ""}
								color="primary"
								target="_blank"
								sx={{ borderRadius: 2, px: 2.5 }}
							>
								View Cloudinary Dashboard
							</Button>
						</Box>
					</Box>

					{/* Cloudinary Usage */}
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" gutterBottom>
							Cloudinary Usage
						</Typography>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, md: 6 }}>
								<Card
									sx={{
										borderRadius: 3,
										border: "1px solid",
										borderColor: "divider",
										boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									}}
								>
									<CardContent sx={{ p: 2.5 }}>
										<Typography variant="subtitle1" fontWeight={600}>
											Plan & Credits
										</Typography>
										<Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
											<Typography variant="body2" color="text.secondary">
												Plan: <strong>{storage?.cloudinary.plan ?? "-"}</strong>
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Credits: {storage?.cloudinary.credits.used ?? 0} /{" "}
												{storage?.cloudinary.credits.limit ?? 0} (
												{storage?.cloudinary.credits.usedPercent ?? 0}%)
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Last Updated: {storage?.cloudinary.lastUpdated || "-"}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Requested: {storage?.cloudinary.dateRequested || "-"}
											</Typography>
										</Box>
									</CardContent>
								</Card>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<Card
									sx={{
										borderRadius: 3,
										border: "1px solid",
										borderColor: "divider",
										boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									}}
								>
									<CardContent sx={{ p: 2.5 }}>
										<Typography variant="subtitle1" fontWeight={600}>
											Storage & Bandwidth
										</Typography>
										<Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
											<Typography variant="body2" color="text.secondary">
												Storage Used:{" "}
												{storage?.cloudinary.storage.usedReadable ?? "-"}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Bandwidth Used:{" "}
												{storage?.cloudinary.bandwidth.usedReadable ?? "-"}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Storage Credits:{" "}
												{storage?.cloudinary.storage.creditsUsage ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Bandwidth Credits:{" "}
												{storage?.cloudinary.bandwidth.creditsUsage ?? 0}
											</Typography>
										</Box>
									</CardContent>
								</Card>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<Card
									sx={{
										borderRadius: 3,
										border: "1px solid",
										borderColor: "divider",
										boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									}}
								>
									<CardContent sx={{ p: 2.5 }}>
										<Typography variant="subtitle1" fontWeight={600}>
											Activity
										</Typography>
										<Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
											<Typography variant="body2" color="text.secondary">
												Requests: {storage?.cloudinary.requests ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Transformations:{" "}
												{storage?.cloudinary.transformations.usage ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Transformation Credits:{" "}
												{storage?.cloudinary.transformations.creditsUsage ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Resources: {storage?.cloudinary.resources.primary ?? 0}{" "}
												(Derived: {storage?.cloudinary.resources.derived ?? 0})
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Objects: {storage?.cloudinary.objects.usage ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Impressions:{" "}
												{storage?.cloudinary.impressions.usage ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Seconds Delivered:{" "}
												{storage?.cloudinary.secondsDelivered.usage ?? 0}
											</Typography>
										</Box>
									</CardContent>
								</Card>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<Card
									sx={{
										borderRadius: 3,
										border: "1px solid",
										borderColor: "divider",
										boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
									}}
								>
									<CardContent sx={{ p: 2.5 }}>
										<Typography variant="subtitle1" fontWeight={600}>
											Media Limits & Rate Limit
										</Typography>
										<Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
											<Typography variant="body2" color="text.secondary">
												Image Max Size:{" "}
												{storage?.cloudinary.mediaLimits.imageMaxSizeReadable ??
													"-"}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Video Max Size:{" "}
												{storage?.cloudinary.mediaLimits.videoMaxSizeReadable ??
													"-"}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Raw Max Size:{" "}
												{storage?.cloudinary.mediaLimits.rawMaxSizeReadable ??
													"-"}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Image Max Px:{" "}
												{storage?.cloudinary.mediaLimits.imageMaxPx ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Asset Max Total Px:{" "}
												{storage?.cloudinary.mediaLimits.assetMaxTotalPx ?? 0}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Rate Limit:{" "}
												{storage?.cloudinary.rateLimit.remaining ?? 0} /{" "}
												{storage?.cloudinary.rateLimit.allowed ?? 0} (resets{" "}
												{formatDate(storage?.cloudinary.rateLimit.resetAt)})
											</Typography>
										</Box>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
}

"use client";

import {
	Alert,
	AlertTitle,
	Box,
	LinearProgress,
	Stack,
	Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { formatBytes } from "@/lib/formatBytes";

interface StorageWarningProps {
	currentGb: number;
	quotaGb: number;
	percentUsed: number;
	status: "ok" | "warning" | "critical";
	recommendation: string;
	bytesUsed?: number;
}

export default function StorageWarning({
	currentGb,
	quotaGb,
	percentUsed,
	status,
	recommendation,
	bytesUsed,
}: StorageWarningProps) {
	const getColor = (): "success" | "warning" | "error" => {
		if (status === "critical") return "error";
		if (status === "warning") return "warning";
		return "success";
	};

	const severityColor = getColor();

	const getIcon = () => {
		if (status === "critical") return <ErrorIcon />;
		if (status === "warning") return <WarningIcon />;
		return <CheckCircleIcon />;
	};

	const getProgressColor = (): "success" | "warning" | "error" => {
		if (percentUsed > 95) return "error";
		if (percentUsed > 80) return "warning";
		return "success";
	};

	return (
		<Alert
			severity={severityColor}
			icon={getIcon()}
			sx={(theme) => ({
				mb: 3,
				borderRadius: 2.5,
				border: "1px solid",
				borderColor: alpha(theme.palette[severityColor].main, 0.25),
				backgroundColor: alpha(theme.palette[severityColor].main, 0.08),
				boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
			})}
		>
			<AlertTitle
				sx={{
					fontWeight: 600,
					display: "flex",
					alignItems: "center",
					gap: 1,
				}}
			>
				Storage Usage: {bytesUsed !== undefined ? formatBytes(bytesUsed) : "-"}{" "}
				/ {quotaGb}GB ({percentUsed}%)
			</AlertTitle>
			<Stack spacing={1.5}>
				<Box>
					<LinearProgress
						variant="determinate"
						value={Math.min(percentUsed, 100)}
						color={getProgressColor()}
						sx={(theme) => ({
							height: 10,
							borderRadius: 999,
							mb: 0.5,
							backgroundColor: alpha(theme.palette.grey[500], 0.12),
							"& .MuiLinearProgress-bar": {
								borderRadius: 999,
							},
						})}
					/>
				</Box>
				<Typography variant="body2">{recommendation}</Typography>

				{status === "critical" && (
					<Typography
						variant="body2"
						sx={{
							color: "error.main",
							fontWeight: 600,
						}}
					>
						⚠️ Immediate action required! Delete a folder to free up space.
					</Typography>
				)}

				{status === "warning" && (
					<Typography
						variant="body2"
						sx={{
							color: "warning.main",
							fontWeight: 600,
						}}
					>
						📋 Plan to delete the oldest folder within the next week.
					</Typography>
				)}

				{status === "ok" && (
					<Typography
						variant="body2"
						sx={{
							color: "success.main",
						}}
					>
						✅ Storage is in good shape. No action needed right now.
					</Typography>
				)}
			</Stack>
		</Alert>
	);
}

"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
	Box,
	Button,
	CircularProgress,
	Container,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
	Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { formatDate } from "@/lib/formatDate";

interface AccessLogEntry {
	id: string;
	action: string;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string;
	admin: {
		id: string;
		username: string;
	} | null;
	folder: {
		id: string;
		name: string;
	} | null;
}

type SortField = "createdAt" | "action";
type SortOrder = "asc" | "desc";

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

export default function AccessLogsPage() {
	const router = useRouter();
	const [logs, setLogs] = useState<AccessLogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(25);
	const [total, setTotal] = useState(0);
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	const columns = useMemo(
		() => [
			{ id: "createdAt", label: "Time", sortable: true },
			{ id: "action", label: "Action", sortable: true },
			{ id: "admin", label: "Admin" },
			{ id: "folder", label: "Folder" },
			{ id: "ipAddress", label: "IP Address" },
			{ id: "userAgent", label: "User Agent" },
		],
		[],
	);

	useEffect(() => {
		const token = localStorage.getItem("adminToken");
		const adminUser = localStorage.getItem("adminUser");
		if (!token || !adminUser) {
			router.push("/admin/login");
			return;
		}

		const controller = new AbortController();
		const fetchLogs = async () => {
			try {
				setLoading(true);
				setError("");

				const params = new URLSearchParams({
					page: String(page + 1),
					pageSize: String(rowsPerPage),
					sortField,
					sortOrder,
				});

				const response = await fetch(`/api/access-logs?${params}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: controller.signal,
				});

				const data = await response.json();

				if (!response.ok || !data.ok) {
					throw new Error(data.error || "Failed to load access logs");
				}

				setLogs(data.data.items || []);
				setTotal(data.data.total || 0);
			} catch (err: any) {
				if (err?.name === "AbortError") return;
				console.error("Access logs fetch error:", err);
				setError(err?.message || "Failed to load access logs");
			} finally {
				setLoading(false);
			}
		};

		fetchLogs();

		return () => controller.abort();
	}, [page, rowsPerPage, sortField, sortOrder, router]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortOrder("asc");
		}
		setPage(0);
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
		const value = Number(event.target.value);
		setRowsPerPage(value);
		setPage(0);
	};

	return (
		<Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
			<Box sx={{ py: { xs: 1.5, sm: 2, md: 3 } }}>
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
						📊 Access Logs
					</Typography>
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push("/admin")}
						size="small"
						sx={{ width: { xs: "100%", sm: "auto" } }}
					>
						Back
					</Button>
				</Box>

				{loading && logs.length === 0 ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							minHeight: 240,
						}}
					>
						<CircularProgress />
					</Box>
				) : (
					<Paper
						elevation={0}
						sx={{
							borderRadius: 3,
							border: "1px solid",
							borderColor: "divider",
							boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
						}}
					>
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										{columns.map((column) => (
											<TableCell
												key={column.id}
												sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
											>
												{column.sortable ? (
													<TableSortLabel
														active={sortField === column.id}
														direction={
															sortField === column.id ? sortOrder : "asc"
														}
														onClick={() => handleSort(column.id as SortField)}
													>
														{column.label}
													</TableSortLabel>
												) : (
													column.label
												)}
											</TableCell>
										))}
									</TableRow>
								</TableHead>
								<TableBody>
									{error && (
										<TableRow>
											<TableCell colSpan={columns.length}>
												<Typography color="error" variant="body2">
													{error}
												</Typography>
											</TableCell>
										</TableRow>
									)}
									{!error && logs.length === 0 && (
										<TableRow>
											<TableCell colSpan={columns.length}>
												<Typography variant="body2" color="text.secondary">
													No access logs found.
												</Typography>
											</TableCell>
										</TableRow>
									)}
									{logs.map((log) => (
										<TableRow key={log.id} hover>
											<TableCell sx={{ whiteSpace: "nowrap" }}>
												{formatDate(log.createdAt, "DD/MMM/YYYY HH:mm:ss")}
											</TableCell>
											<TableCell sx={{ whiteSpace: "nowrap" }}>
												{log.action}
											</TableCell>
											<TableCell>{log.admin?.username || "-"}</TableCell>
											<TableCell>{log.folder?.name || "-"}</TableCell>
											<TableCell sx={{ whiteSpace: "nowrap" }}>
												{log.ipAddress || "-"}
											</TableCell>
											<TableCell
												sx={{
													maxWidth: 360,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{log.userAgent || "-"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						<TablePagination
							component="div"
							count={total}
							page={page}
							onPageChange={handleChangePage}
							rowsPerPage={rowsPerPage}
							onRowsPerPageChange={handleChangeRowsPerPage}
							rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
							labelRowsPerPage="Rows per page"
						/>
					</Paper>
				)}
			</Box>
		</Container>
	);
}

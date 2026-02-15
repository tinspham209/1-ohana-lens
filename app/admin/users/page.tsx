"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import UserManagementTable from "@/components/admin/UserManagementTable";
import UserFormDialog, {
	UserFormInputs,
} from "@/components/admin/UserFormDialog";
import DeleteUserDialog from "@/components/admin/DeleteUserDialog";
import {
	Container,
	Box,
	Typography,
	Button,
	CircularProgress,
	Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface AdminUser {
	id: string;
	username: string;
	email: string;
	isActive: boolean;
	createdAt: string;
	lastLogin: string | null;
}

interface PaginationData {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export default function UsersPage() {
	const router = useRouter();
	const { showSuccess, showError } = useToast();
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [pagination, setPagination] = useState<PaginationData>({
		page: 1,
		limit: 25,
		total: 0,
		totalPages: 0,
	});
	const [sortBy, setSortBy] = useState<string>("createdAt");
	const [order, setOrder] = useState<"asc" | "desc">("desc");
	const [loading, setLoading] = useState(true);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const [error, setError] = useState("");
	const [actionLoading, setActionLoading] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<string>("");

	useEffect(() => {
		// Get current admin user ID
		const adminUser = localStorage.getItem("adminUser");
		if (adminUser) {
			const parsed = JSON.parse(adminUser);
			setCurrentUserId(parsed.id);
		}

		fetchUsers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.page, pagination.limit, sortBy, order]);

	const fetchUsers = async () => {
		const token = localStorage.getItem("adminToken");

		if (!token) {
			router.push("/admin/login");
			return;
		}

		try {
			setLoading(true);

			const params = new URLSearchParams({
				page: pagination.page.toString(),
				limit: pagination.limit.toString(),
				sortBy,
				order,
			});

			const response = await fetch(`/api/auth/admin-list?${params}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch users");
			}

			const data = await response.json();
			setUsers(data.admins);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Fetch users error:", error);
			setError("Failed to load users");
			showError("Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	const handlePageChange = (newPage: number) => {
		setPagination((prev) => ({ ...prev, page: newPage }));
	};

	const handleRowsPerPageChange = (newRowsPerPage: number) => {
		setPagination((prev) => ({ ...prev, page: 1, limit: newRowsPerPage }));
	};

	const handleSort = (field: string) => {
		if (sortBy === field) {
			// Toggle order if same field
			setOrder(order === "asc" ? "desc" : "asc");
		} else {
			// New field, default to descending
			setSortBy(field);
			setOrder("desc");
		}
		// Reset to first page when sorting changes
		setPagination((prev) => ({ ...prev, page: 1 }));
	};

	const handleCreateSubmit = async (data: UserFormInputs) => {
		setError("");
		setActionLoading(true);

		const token = localStorage.getItem("adminToken");

		try {
			const response = await fetch("/api/auth/admin-signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error || "Failed to create user");
			}

			showSuccess("User created successfully!");
			setCreateDialogOpen(false);
			fetchUsers();
		} catch (error: any) {
			setError(error.message);
			showError(error.message || "Failed to create user");
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteClick = (userId: string) => {
		const user = users.find((u) => u.id === userId);
		if (user) {
			setSelectedUser(user);
			setDeleteDialogOpen(true);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!selectedUser) return;

		setError("");
		setActionLoading(true);

		const token = localStorage.getItem("adminToken");

		try {
			const response = await fetch("/api/auth/admin-delete", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ adminId: selectedUser.id }),
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error || "Failed to delete user");
			}

			showSuccess("User deleted successfully!");
			setDeleteDialogOpen(false);
			setSelectedUser(null);
			fetchUsers();
		} catch (error: any) {
			setError(error.message);
			showError(error.message || "Failed to delete user");
		} finally {
			setActionLoading(false);
		}
	};

	const handleCloseCreateDialog = () => {
		setCreateDialogOpen(false);
		setError("");
	};

	const handleCloseDeleteDialog = () => {
		setDeleteDialogOpen(false);
		setSelectedUser(null);
		setError("");
	};

	if (loading && users.length === 0) {
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
					{/* Header */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 3,
							gap: 2,
							flexWrap: "wrap",
						}}
					>
						<Box>
							<Button
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push("/admin")}
								sx={{ mb: 2 }}
							>
								Back to Dashboard
							</Button>
							<Typography variant="h4" component="h1" gutterBottom>
								User Management
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Manage admin users - create new users, view details, and remove
								access
							</Typography>
						</Box>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => setCreateDialogOpen(true)}
							sx={{ borderRadius: 2, px: 2.5 }}
						>
							Create User
						</Button>
					</Box>

					{/* Table */}
					{loading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
							<CircularProgress />
						</Box>
					) : (
						<UserManagementTable
							users={users}
							page={pagination.page - 1} // MUI uses 0-indexed pages
							rowsPerPage={pagination.limit}
							totalCount={pagination.total}
							sortBy={sortBy}
							order={order}
							onPageChange={(newPage) => handlePageChange(newPage + 1)} // Convert back to 1-indexed
							onRowsPerPageChange={handleRowsPerPageChange}
							onSort={handleSort}
							onDelete={handleDeleteClick}
							currentUserId={currentUserId}
						/>
					)}
				</Paper>
			</Box>

			{/* Create User Dialog */}
			<UserFormDialog
				open={createDialogOpen}
				loading={actionLoading}
				error={error}
				onClose={handleCloseCreateDialog}
				onSubmit={handleCreateSubmit}
			/>

			{/* Delete User Dialog */}
			<DeleteUserDialog
				open={deleteDialogOpen}
				loading={actionLoading}
				error={error}
				username={selectedUser?.username || ""}
				onClose={handleCloseDeleteDialog}
				onConfirm={handleDeleteConfirm}
			/>
		</Container>
	);
}

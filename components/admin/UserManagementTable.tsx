"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TablePagination,
	Paper,
	IconButton,
	Tooltip,
	Chip,
	Box,
	TableSortLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatDate } from "@/lib/formatDate";

interface AdminUser {
	id: string;
	username: string;
	email: string;
	isActive: boolean;
	createdAt: string;
	lastLogin: string | null;
}

interface UserManagementTableProps {
	users: AdminUser[];
	page: number;
	rowsPerPage: number;
	totalCount: number;
	sortBy: string;
	order: "asc" | "desc";
	onPageChange: (newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
	onSort: (field: string) => void;
	onDelete: (userId: string) => void;
	currentUserId: string;
}

type SortableField = "createdAt" | "username" | "email" | "lastLogin";

export default function UserManagementTable({
	users,
	page,
	rowsPerPage,
	totalCount,
	sortBy,
	order,
	onPageChange,
	onRowsPerPageChange,
	onSort,
	onDelete,
	currentUserId,
}: UserManagementTableProps) {
	const handleChangePage = (_event: unknown, newPage: number) => {
		onPageChange(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		onRowsPerPageChange(parseInt(event.target.value, 10));
	};

	const createSortHandler = (field: SortableField) => {
		return () => {
			onSort(field);
		};
	};

	return (
		<Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
			<TableContainer sx={{ maxHeight: 600 }}>
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>
								<TableSortLabel
									active={sortBy === "username"}
									direction={sortBy === "username" ? order : "asc"}
									onClick={createSortHandler("username")}
								>
									Username
								</TableSortLabel>
							</TableCell>
							<TableCell>
								<TableSortLabel
									active={sortBy === "email"}
									direction={sortBy === "email" ? order : "asc"}
									onClick={createSortHandler("email")}
								>
									Email
								</TableSortLabel>
							</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>
								<TableSortLabel
									active={sortBy === "lastLogin"}
									direction={sortBy === "lastLogin" ? order : "asc"}
									onClick={createSortHandler("lastLogin")}
								>
									Last Login
								</TableSortLabel>
							</TableCell>
							<TableCell>
								<TableSortLabel
									active={sortBy === "createdAt"}
									direction={sortBy === "createdAt" ? order : "asc"}
									onClick={createSortHandler("createdAt")}
								>
									Created At
								</TableSortLabel>
							</TableCell>
							<TableCell align="center">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{users.map((user) => (
							<TableRow
								key={user.id}
								hover
								sx={{
									"&:last-child td, &:last-child th": { border: 0 },
									backgroundColor:
										user.id === currentUserId
											? "rgba(25, 118, 210, 0.05)"
											: "inherit",
								}}
							>
								<TableCell>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										{user.username}
										{user.id === currentUserId && (
											<Chip label="You" size="small" color="primary" />
										)}
									</Box>
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Chip
										label={user.isActive ? "Active" : "Inactive"}
										size="small"
										color={user.isActive ? "success" : "default"}
									/>
								</TableCell>
								<TableCell>
									{user.lastLogin ? formatDate(user.lastLogin) : "Never"}
								</TableCell>
								<TableCell>{formatDate(user.createdAt)}</TableCell>
								<TableCell align="center">
									<Tooltip
										title={
											user.id === currentUserId
												? "Cannot delete your own account"
												: "Delete user"
										}
									>
										<span>
											<IconButton
												size="small"
												color="error"
												onClick={() => onDelete(user.id)}
												disabled={user.id === currentUserId}
											>
												<DeleteIcon fontSize="small" />
											</IconButton>
										</span>
									</Tooltip>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				rowsPerPageOptions={[25, 50, 100]}
				component="div"
				count={totalCount}
				rowsPerPage={rowsPerPage}
				page={page}
				onPageChange={handleChangePage}
				onRowsPerPageChange={handleChangeRowsPerPage}
			/>
		</Paper>
	);
}

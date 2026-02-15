"use client";

import {
	Box,
	Paper,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Typography,
	Divider,
	Chip,
	IconButton,
	Grid,
	Card,
	CardContent,
	Menu,
	MenuItem,
	Drawer,
	useMediaQuery,
	useTheme,
	Button,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Folder {
	id: string;
	name: string;
	description?: string;
	folderKey: string;
	sizeInBytes: number;
	createdAt: string;
	_count?: {
		media: number;
	};
}

interface FolderExplorerProps {
	folders: Folder[];
	selectedFolderId: string | null;
	onSelectFolder: (folderId: string) => void;
	onEdit: (folder: Folder) => void;
	onDelete: (folder: Folder) => void;
	onOpen: (folderId: string) => void;
	loading?: boolean;
}

export default function FolderExplorer({
	folders,
	selectedFolderId,
	onSelectFolder,
	onEdit,
	onDelete,
	onOpen,
	loading = false,
}: FolderExplorerProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedMenuFolderId, setSelectedMenuFolderId] = useState<
		string | null
	>(null);
	// Auto-open drawer on mobile when no folder is selected
	const [drawerOpen, setDrawerOpen] = useState(isMobile && !selectedFolderId);

	const selectedFolder = folders.find((f) => f.id === selectedFolderId);

	// Handle drawer opening/closing based on mobile state and folder selection
	useEffect(() => {
		if (isMobile && !selectedFolderId) {
			setDrawerOpen(true);
		} else if (!isMobile) {
			setDrawerOpen(false);
		} else if (selectedFolderId) {
			setDrawerOpen(false);
		}
	}, [isMobile, selectedFolderId]);

	const handleMenuOpen = (
		e: React.MouseEvent<HTMLElement>,
		folderId: string,
	) => {
		e.stopPropagation();
		setAnchorEl(e.currentTarget);
		setSelectedMenuFolderId(folderId);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedMenuFolderId(null);
	};

	const handleEdit = (folder: Folder) => {
		onEdit(folder);
		handleMenuClose();
	};

	const handleDelete = (folder: Folder) => {
		onDelete(folder);
		handleMenuClose();
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	const handleShare = async (folderId: string) => {
		const folderUrl = `${window.location.origin}/folder/${folderId}`;
		try {
			await navigator.clipboard.writeText(folderUrl);
			// Optional: Show a toast notification (if toast is available)
			alert("Folder link copied to clipboard!");
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
			alert("Failed to copy link");
		}
	};

	return (
		<Box sx={{ display: "flex", height: "100%", gap: { xs: 0, sm: 2 } }}>
			{/* Mobile Menu Button */}
			{isMobile && (
				<Box sx={{ position: "absolute", top: 0, left: 0, zIndex: 1100 }}>
					<IconButton
						onClick={() => setDrawerOpen(true)}
						size="large"
						sx={{ color: "primary.main" }}
					>
						<MenuIcon />
					</IconButton>
				</Box>
			)}

			{/* Sidebar - Desktop */}
			{!isMobile && (
				<Paper
					elevation={0}
					sx={{
						width: 280,
						flexShrink: 0,
						bgcolor: "grey.50",
						border: "1px solid",
						borderColor: "divider",
						borderRadius: 1,
						overflow: "auto",
					}}
				>
					<Box sx={{ p: 2, bgcolor: "primary.main" }}>
						<Typography
							variant="subtitle1"
							sx={{ color: "white", fontWeight: 600 }}
						>
							📁 All Folders ({folders.length})
						</Typography>
					</Box>
					<Divider />

					{folders.length === 0 ? (
						<Box sx={{ p: 3, textAlign: "center" }}>
							<Typography color="text.secondary" variant="body2">
								No folders yet. Create your first folder!
							</Typography>
						</Box>
					) : (
						<List sx={{ p: 0 }}>
							{folders.map((folder) => (
								<ListItemButton
									key={folder.id}
									selected={selectedFolderId === folder.id}
									onClick={() => onSelectFolder(folder.id)}
									sx={{
										py: 1.5,
										px: 2,
										borderLeft:
											selectedFolderId === folder.id
												? "4px solid"
												: "4px solid transparent",
										borderLeftColor:
											selectedFolderId === folder.id
												? "primary.main"
												: "transparent",
										backgroundColor:
											selectedFolderId === folder.id
												? "primary.lighter"
												: "transparent",
										"&:hover": {
											backgroundColor: "action.hover",
										},
									}}
								>
									<ListItemIcon sx={{ minWidth: 40 }}>
										<FolderIcon
											color={
												selectedFolderId === folder.id ? "primary" : "inherit"
											}
										/>
									</ListItemIcon>
									<ListItemText
										primary={
											<Typography
												variant="body2"
												sx={{
													fontWeight:
														selectedFolderId === folder.id ? 600 : 500,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{folder.name}
											</Typography>
										}
										secondary={
											<Typography variant="caption" color="text.secondary">
												{folder._count?.media || 0} files •{" "}
												{formatFileSize(folder.sizeInBytes)}
												<br />
												{format(new Date(folder.createdAt), "MMM d, yyyy")}
											</Typography>
										}
									/>
									<IconButton
										size="small"
										onClick={(e) => handleMenuOpen(e, folder.id)}
										sx={{ ml: 1 }}
									>
										<MoreVertIcon fontSize="small" />
									</IconButton>
								</ListItemButton>
							))}
						</List>
					)}
				</Paper>
			)}

			{/* Mobile Drawer Sidebar */}
			<Drawer
				anchor="left"
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				sx={{ "& .MuiDrawer-paper": { width: 280 } }}
			>
				<Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
					<Box
						sx={{
							p: 2,
							bgcolor: "primary.main",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography
							variant="subtitle1"
							sx={{ color: "white", fontWeight: 600 }}
						>
							📁 Folders
						</Typography>
						<IconButton
							onClick={() => setDrawerOpen(false)}
							size="small"
							sx={{ color: "white" }}
						>
							<CloseIcon />
						</IconButton>
					</Box>
					<Divider />

					{folders.length === 0 ? (
						<Box sx={{ p: 3, textAlign: "center" }}>
							<Typography color="text.secondary" variant="body2">
								No folders yet. Create your first folder!
							</Typography>
						</Box>
					) : (
						<List sx={{ p: 0, flex: 1, overflow: "auto" }}>
							{folders.map((folder) => (
								<ListItemButton
									key={folder.id}
									selected={selectedFolderId === folder.id}
									onClick={() => {
										onSelectFolder(folder.id);
										setDrawerOpen(false);
									}}
									sx={{
										py: 1.5,
										px: 2,
										borderLeft:
											selectedFolderId === folder.id
												? "4px solid"
												: "4px solid transparent",
										borderLeftColor:
											selectedFolderId === folder.id
												? "primary.main"
												: "transparent",
										backgroundColor:
											selectedFolderId === folder.id
												? "primary.lighter"
												: "transparent",
										"&:hover": {
											backgroundColor: "action.hover",
										},
									}}
								>
									<ListItemIcon sx={{ minWidth: 40 }}>
										<FolderIcon
											color={
												selectedFolderId === folder.id ? "primary" : "inherit"
											}
										/>
									</ListItemIcon>
									<ListItemText
										primary={
											<Typography
												variant="body2"
												sx={{
													fontWeight:
														selectedFolderId === folder.id ? 600 : 500,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{folder.name}
											</Typography>
										}
										secondary={
											<Typography variant="caption" color="text.secondary">
												{folder._count?.media || 0} files •{" "}
												{formatFileSize(folder.sizeInBytes)}
											</Typography>
										}
									/>
									<IconButton
										size="small"
										onClick={(e) => handleMenuOpen(e, folder.id)}
										sx={{ ml: 1 }}
									>
										<MoreVertIcon fontSize="small" />
									</IconButton>
								</ListItemButton>
							))}
						</List>
					)}
				</Box>
			</Drawer>

			{/* Main Content Area */}
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					gap: { xs: 1, sm: 2 },
				}}
			>
				{selectedFolder ? (
					<>
						{/* Folder Header Card */}
						<Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
							<Box
								sx={{
									display: "flex",
									flexDirection: { xs: "column", sm: "row" },
									alignItems: { xs: "center", sm: "flex-start" },
									gap: 2,
									mb: 2,
								}}
							>
								<FolderIcon
									sx={{
										fontSize: { xs: 40, sm: 48 },
										color: "primary.main",
										flexShrink: 0,
									}}
								/>
								<Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" } }}>
									<Typography
										variant="h5"
										sx={{
											fontWeight: 600,
											mb: 0.5,
											fontSize: { xs: "1.25rem", sm: "1.5rem" },
										}}
									>
										{selectedFolder.name}
									</Typography>
									{selectedFolder.description && (
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}
										>
											{selectedFolder.description}
										</Typography>
									)}
									<Box
										sx={{
											display: "flex",
											gap: 1,
											flexWrap: "wrap",
											justifyContent: { xs: "center", sm: "flex-start" },
										}}
									>
										<Chip
											label={`${selectedFolder._count?.media || 0} Files`}
											size="small"
											variant="outlined"
										/>
										<Chip
											label={`Size: ${formatFileSize(selectedFolder.sizeInBytes)}`}
											size="small"
											variant="outlined"
										/>
										<Chip
											label={`Created ${format(new Date(selectedFolder.createdAt), "MMM d, yyyy")}`}
											size="small"
											variant="outlined"
										/>
									</Box>
								</Box>
								<Box
									sx={{
										display: "flex",
										gap: 1,
										flexWrap: "wrap",
										justifyContent: { xs: "center", sm: "flex-end" },
									}}
								>
									<IconButton
										size="small"
										color="primary"
										onClick={() => handleShare(selectedFolder.id)}
										title="Copy folder link to clipboard"
										sx={{ minWidth: 44, minHeight: 44 }}
									>
										<ShareIcon />
									</IconButton>
									<IconButton
										size="small"
										color="primary"
										onClick={() => onOpen(selectedFolder.id)}
										title="Open folder to manage media"
										sx={{ minWidth: 44, minHeight: 44 }}
									>
										<OpenInNewIcon />
									</IconButton>
									<IconButton
										size="small"
										color="primary"
										onClick={() => onEdit(selectedFolder)}
										title="Edit folder"
										sx={{ minWidth: 44, minHeight: 44 }}
									>
										<EditIcon />
									</IconButton>
									<IconButton
										size="small"
										color="error"
										onClick={() => onDelete(selectedFolder)}
										title="Delete folder"
									>
										<DeleteIcon />
									</IconButton>
								</Box>
							</Box>
						</Paper>

						{/* Properties Grid */}
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card variant="outlined">
									<CardContent>
										<Typography color="text.secondary" variant="caption">
											FOLDER ID
										</Typography>
										<Typography
											variant="body2"
											sx={{
												fontFamily: "monospace",
												fontSize: "0.8rem",
												wordBreak: "break-all",
											}}
										>
											{selectedFolder.id}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card variant="outlined">
									<CardContent>
										<Typography color="text.secondary" variant="caption">
											FOLDER KEY
										</Typography>
										<Typography
											variant="body2"
											sx={{
												fontFamily: "monospace",
												fontSize: "0.8rem",
												wordBreak: "break-all",
											}}
										>
											{selectedFolder.folderKey}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card variant="outlined">
									<CardContent>
										<Typography color="text.secondary" variant="caption">
											FILES COUNT
										</Typography>
										<Typography variant="h6">
											{selectedFolder._count?.media || 0}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card variant="outlined">
									<CardContent>
										<Typography color="text.secondary" variant="caption">
											TOTAL SIZE
										</Typography>
										<Typography variant="h6">
											{formatFileSize(selectedFolder.sizeInBytes)}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Card variant="outlined">
									<CardContent>
										<Typography color="text.secondary" variant="caption">
											CREATED DATE
										</Typography>
										<Typography variant="body2">
											{format(new Date(selectedFolder.createdAt), "PPpp")}
										</Typography>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					</>
				) : (
					<Paper
						elevation={0}
						sx={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "text.secondary",
							bgcolor: "grey.50",
							borderRadius: 1,
							border: "1px dashed",
							borderColor: "divider",
						}}
					>
						<Typography variant="body2">
							Select a folder to view details
						</Typography>
					</Paper>
				)}
			</Box>

			{/* Context Menu */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
			>
				{selectedMenuFolderId &&
					folders.find((f) => f.id === selectedMenuFolderId) && (
						<>
							<MenuItem
								onClick={() =>
									handleEdit(
										folders.find((f) => f.id === selectedMenuFolderId)!,
									)
								}
							>
								<EditIcon fontSize="small" sx={{ mr: 1 }} />
								Edit
							</MenuItem>
							<MenuItem onClick={() => onOpen(selectedMenuFolderId)}>
								<OpenInNewIcon fontSize="small" sx={{ mr: 1 }} />
								Open
							</MenuItem>
							<Divider />
							<MenuItem
								onClick={() =>
									handleDelete(
										folders.find((f) => f.id === selectedMenuFolderId)!,
									)
								}
								sx={{ color: "error.main" }}
							>
								<DeleteIcon fontSize="small" sx={{ mr: 1 }} />
								Delete
							</MenuItem>
						</>
					)}
			</Menu>
		</Box>
	);
}

"use client";

import { Container, Box, Typography, Button, Stack, Link } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";

export default function Home() {
	return (
		<Box
			sx={{
				minHeight: "100vh",
				background:
					"linear-gradient(180deg, #f8fbff 0%, #ffffff 45%, #f1f5f9 100%)",
			}}
		>
			<Container maxWidth="lg">
				<Box
					component="nav"
					sx={{
						py: { xs: 2, md: 3 },
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 2,
						flexWrap: "wrap",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Image
							src="/logo.png"
							alt="1 Ohana Lens Logo"
							width={36}
							height={36}
						/>
						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							1 Ohana Lens
						</Typography>
					</Box>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							flexWrap: "wrap",
						}}
					>
						<Button
							variant="contained"
							href="/folder/access"
							sx={{
								textTransform: "none",
								borderRadius: 999,
								px: 2.5,
								boxShadow: "0 10px 22px rgba(25, 118, 210, 0.28)",
								"&:hover": {
									boxShadow: "0 14px 28px rgba(25, 118, 210, 0.35)",
								},
							}}
						>
							Members
						</Button>
						<Button
							variant="text"
							href="/admin/login"
							sx={{
								textTransform: "none",
								borderRadius: 999,
								color: "text.secondary",
							}}
						>
							Admins
						</Button>
					</Box>
				</Box>

				<Box
					sx={{
						py: { xs: 5, md: 9 },
						display: "grid",
						gap: { xs: 6, md: 10 },
						alignItems: "center",
						gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
					}}
				>
					<Stack spacing={3.5} sx={{ maxWidth: 560 }}>
						<Box
							sx={(theme) => ({
								display: "inline-flex",
								alignItems: "center",
								gap: 1,
								px: 2,
								py: 0.75,
								borderRadius: 999,
								backgroundColor: alpha(theme.palette.primary.main, 0.1),
								color: theme.palette.primary.dark,
								fontWeight: 600,
								fontSize: "0.85rem",
								letterSpacing: "0.01em",
								width: "fit-content",
							})}
						>
							<Link
								href="https://www.instagram.com/1ohana.runclub"
								target="_blank"
								rel="noopener noreferrer"
							>
								1 Ohana Club
							</Link>{" "}
							- Media hub
						</Box>
						<Typography
							variant="h2"
							component="h1"
							sx={{
								fontWeight: 750,
								letterSpacing: "-0.025em",
								lineHeight: 1.05,
								textWrap: "balance",
								fontSize: { xs: "2.5rem", sm: "3.15rem", md: "3.75rem" },
							}}
						>
							Social sharing for every run, organized in minutes.
						</Typography>
						<Typography
							variant="h6"
							color="text.secondary"
							sx={{
								maxWidth: 520,
								fontSize: { xs: "1rem", sm: "1.1rem" },
								lineHeight: 1.7,
							}}
						>
							Create event folders, upload photos and videos, and let members
							access everything with a single password.
						</Typography>
						<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
							<Button
								variant="contained"
								size="large"
								href="/folder/access"
								disableElevation
								sx={{
									px: 4.5,
									borderRadius: 2.5,
									fontWeight: 700,
									boxShadow: "0 16px 28px rgba(25, 118, 210, 0.32)",
									"&:hover": {
										boxShadow: "0 20px 34px rgba(25, 118, 210, 0.4)",
									},
								}}
							>
								Access Folder
							</Button>
							<Button
								variant="outlined"
								size="large"
								href="/admin/login"
								sx={{
									px: 3.5,
									borderRadius: 2.5,
									color: "text.primary",
									borderColor: "divider",
									"&:hover": {
										borderColor: "text.primary",
										backgroundColor: "rgba(15, 23, 42, 0.04)",
									},
								}}
							>
								Admin Login
							</Button>
						</Box>
						<Typography variant="body2" color="text.secondary">
							Members: enter your folder password to view photos and videos — no
							account needed.
						</Typography>
					</Stack>

					<Box
						sx={{
							position: "relative",
							height: { xs: 320, sm: 380, md: 460 },
							width: "100%",
							isolation: "isolate",
							"&::before": {
								content: '""',
								position: "absolute",
								inset: "6% 0 0 8%",
								borderRadius: "50%",
								background:
									"radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(59, 130, 246, 0) 70%)",
								filter: "blur(30px)",
								zIndex: 0,
							},
						}}
					>
						<Box
							sx={(theme) => ({
								position: "absolute",
								top: 0,
								right: { xs: 0, md: 10 },
								width: { xs: "82%", md: "72%" },
								height: { xs: "55%", md: "60%" },
								borderRadius: 4,
								overflow: "hidden",
								border: "1px solid",
								borderColor: theme.palette.divider,
								boxShadow: "0 24px 50px rgba(15, 23, 42, 0.15)",
								transform: "rotate(-0.6deg)",
								zIndex: 2,
							})}
						>
							<Image
								src="/hero/hero_3.webp"
								alt="Run club memories in a shared folder"
								fill
								priority
								sizes="(max-width: 900px) 82vw, 45vw"
								style={{ objectFit: "cover" }}
							/>
						</Box>
						<Box
							sx={(theme) => ({
								position: "absolute",
								bottom: 0,
								left: 0,
								width: { xs: "60%", md: "55%" },
								height: { xs: "40%", md: "42%" },
								borderRadius: 4,
								overflow: "hidden",
								border: "1px solid",
								borderColor: alpha(theme.palette.primary.main, 0.2),
								boxShadow: "0 18px 36px rgba(15, 23, 42, 0.12)",
								transform: "rotate(0.7deg)",
								zIndex: 1,
							})}
						>
							<Image
								src="/hero/hero_4.webp"
								alt="Event photos organized by folder"
								fill
								sizes="(max-width: 900px) 60vw, 35vw"
								style={{ objectFit: "cover" }}
							/>
						</Box>
						<Box
							sx={(theme) => ({
								position: "absolute",
								top: "16%",
								left: "4%",
								width: 128,
								height: 92,
								borderRadius: 3,
								overflow: "hidden",
								border: "1px solid",
								borderColor: theme.palette.divider,
								boxShadow: "0 16px 28px rgba(15, 23, 42, 0.12)",
								transform: "rotate(-1.2deg)",
								zIndex: 3,
							})}
						>
							<Image
								src="/hero/hero_1.webp"
								alt="Shared media preview"
								fill
								sizes="128px"
								style={{ objectFit: "cover" }}
							/>
						</Box>
						<Box
							sx={(theme) => ({
								position: "absolute",
								bottom: "18%",
								right: "6%",
								width: 152,
								height: 104,
								borderRadius: 3,
								overflow: "hidden",
								border: "1px solid",
								borderColor: alpha(theme.palette.secondary.main, 0.3),
								boxShadow: "0 16px 28px rgba(15, 23, 42, 0.12)",
								transform: "rotate(1deg)",
								zIndex: 2,
							})}
						>
							<Image
								src="/hero/hero_2.webp"
								alt="Highlights from recent runs"
								fill
								sizes="140px"
								style={{ objectFit: "cover" }}
							/>
						</Box>
					</Box>
				</Box>
			</Container>
			<Box
				component="footer"
				sx={{
					mt: { xs: 6, md: 10 },
					py: { xs: 3, md: 4 },
					borderTop: "1px solid",
					borderColor: "divider",
					backgroundColor: "rgba(255, 255, 255, 0.7)",
					backdropFilter: "blur(6px)",
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ textAlign: "center" }}
					>
						{new Date().getFullYear()} - Make with love by{" "}
						<Link
							href="https://www.instagram.com/1ohana.runclub"
							target="_blank"
							rel="noopener noreferrer"
							underline="hover"
							color="text.primary"
						>
							@1ohana.runclub
						</Link>
					</Typography>
				</Container>
			</Box>
		</Box>
	);
}

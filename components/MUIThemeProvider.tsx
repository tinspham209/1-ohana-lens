"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastProvider } from "@/providers/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const theme = createTheme({
	palette: {
		primary: {
			main: "#1976d2",
		},
		secondary: {
			main: "#dc004e",
		},
	},
});

export default function MUIThemeProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ErrorBoundary>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<ToastProvider>{children}</ToastProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}

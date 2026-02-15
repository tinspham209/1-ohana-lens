import React, { ReactNode } from "react";
import { Alert, Box, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("[Error Boundary] Caught error:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						minHeight: "100vh",
						p: 2,
					}}
				>
					<Box sx={{ maxWidth: 500 }}>
						<Alert severity="error" sx={{ mb: 2 }}>
							<strong>Something went wrong!</strong>
						</Alert>
						<Box
							component="pre"
							sx={{
								bgcolor: "grey.100",
								p: 2,
								borderRadius: 1,
								overflow: "auto",
								mb: 2,
								fontSize: "0.85rem",
								fontFamily: "monospace",
								color: "error.main",
							}}
						>
							{this.state.error?.message}
						</Box>
						<Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
							<Button
								variant="contained"
								startIcon={<RefreshIcon />}
								onClick={this.handleReset}
							>
								Try Again
							</Button>
							<Button variant="outlined" href="/admin">
								Go to Dashboard
							</Button>
						</Box>
					</Box>
				</Box>
			);
		}

		return this.props.children;
	}
}

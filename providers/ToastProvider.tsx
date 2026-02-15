"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

export interface Toast {
	id: string;
	message: string;
	type: AlertColor;
	duration?: number;
}

interface ToastContextType {
	showToast: (message: string, type?: AlertColor, duration?: number) => void;
	showSuccess: (message: string, duration?: number) => void;
	showError: (message: string, duration?: number) => void;
	showWarning: (message: string, duration?: number) => void;
	showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback(
		(message: string, type: AlertColor = "info", duration = 4000) => {
			const id = `${Date.now()}-${Math.random()}`;
			const newToast: Toast = { id, message, type, duration };

			setToasts((prev) => [...prev, newToast]);

			if (duration > 0) {
				setTimeout(() => {
					setToasts((prev) => prev.filter((t) => t.id !== id));
				}, duration);
			}
		},
		[],
	);

	const showSuccess = useCallback(
		(message: string, duration?: number) =>
			showToast(message, "success", duration),
		[showToast],
	);

	const showError = useCallback(
		(message: string, duration?: number) =>
			showToast(message, "error", duration),
		[showToast],
	);

	const showWarning = useCallback(
		(message: string, duration?: number) =>
			showToast(message, "warning", duration),
		[showToast],
	);

	const showInfo = useCallback(
		(message: string, duration?: number) =>
			showToast(message, "info", duration),
		[showToast],
	);

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<ToastContext.Provider
			value={{ showToast, showSuccess, showError, showWarning, showInfo }}
		>
			{children}

			{/* Toast notifications */}
			{toasts.map((toast) => (
				<Snackbar
					key={toast.id}
					open={true}
					autoHideDuration={toast.duration}
					onClose={() => removeToast(toast.id)}
					anchorOrigin={{ vertical: "top", horizontal: "right" }}
					sx={{ mt: 1, mr: 1 }}
				>
					<Alert
						onClose={() => removeToast(toast.id)}
						severity={toast.type}
						variant="filled"
						sx={{
							width: "100%",
							maxWidth: 400,
						}}
					>
						{toast.message}
					</Alert>
				</Snackbar>
			))}
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

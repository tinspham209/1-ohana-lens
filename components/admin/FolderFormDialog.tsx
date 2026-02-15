"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Alert,
	Box,
	CircularProgress,
} from "@mui/material";

export interface FolderFormInputs {
	name: string;
	description: string;
}

const folderFormSchema = yup.object().shape({
	name: yup
		.string()
		.required("Folder name is required")
		.min(1, "Folder name must be at least 1 character")
		.max(100, "Folder name must be at most 100 characters"),
	description: yup
		.string()
		.max(500, "Description must be at most 500 characters")
		.default(""),
});

interface FolderFormDialogProps {
	open: boolean;
	isEdit: boolean;
	initialValues?: FolderFormInputs;
	generatedPassword?: string;
	onSubmit: (data: FolderFormInputs) => Promise<void>;
	onClose: () => void;
	disabled?: boolean;
}

export default function FolderFormDialog({
	open,
	isEdit,
	initialValues,
	generatedPassword,
	onSubmit,
	onClose,
	disabled = false,
}: FolderFormDialogProps) {
	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<FolderFormInputs>({
		resolver: yupResolver(folderFormSchema) as any,
		mode: "onBlur",
		defaultValues: {
			name: "",
			description: "",
		},
	});

	useEffect(() => {
		if (!open) return;

		if (isEdit && initialValues) {
			reset({
				name: initialValues.name,
				description: initialValues.description || "",
			});
			return;
		}

		reset({ name: "", description: "" });
	}, [open, isEdit, initialValues, reset]);

	return (
		<Dialog
			open={open}
			onClose={() => !isSubmitting && !disabled && onClose()}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle>{isEdit ? "Edit Folder" : "Create New Folder"}</DialogTitle>
			<DialogContent sx={{ minWidth: { xs: 0, sm: 400 } }}>
				{!isEdit && generatedPassword ? (
					<Box>
						<Alert severity="success" sx={{ mb: 2 }}>
							Folder created successfully!
						</Alert>
						<Alert severity="warning" sx={{ mb: 2 }}>
							<strong>Save this password! It will only be shown once.</strong>
						</Alert>
						<TextField
							fullWidth
							label="Generated Password"
							value={generatedPassword}
							InputProps={{ readOnly: true }}
							sx={{ mt: 2 }}
						/>
					</Box>
				) : (
					<Box>
						<form onSubmit={handleSubmit(onSubmit)}>
							<Controller
								name="name"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										autoFocus
										margin="dense"
										label="Folder Name"
										fullWidth
										disabled={isSubmitting || disabled}
										error={!!errors.name}
										helperText={errors.name?.message}
										required
									/>
								)}
							/>
							<Controller
								name="description"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										margin="dense"
										label={isEdit ? "Description" : "Description (optional)"}
										fullWidth
										multiline
										rows={3}
										disabled={isSubmitting || disabled}
										error={!!errors.description}
										helperText={errors.description?.message}
									/>
								)}
							/>
							<DialogActions sx={{ mt: 2, px: 0 }}>
								<Button onClick={onClose} disabled={isSubmitting || disabled}>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={isSubmitting || disabled}
								>
									{isSubmitting ? (
										<CircularProgress size={24} />
									) : isEdit ? (
										"Update"
									) : (
										"Create"
									)}
								</Button>
							</DialogActions>
						</form>
					</Box>
				)}
			</DialogContent>
			{!isEdit && generatedPassword && (
				<DialogActions>
					<Button onClick={onClose}>Close</Button>
				</DialogActions>
			)}
		</Dialog>
	);
}

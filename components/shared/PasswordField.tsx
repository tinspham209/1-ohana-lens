"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
	TextField,
	InputAdornment,
	IconButton,
	TextFieldProps,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

interface PasswordFieldProps<TFieldValues extends FieldValues> {
	name: Path<TFieldValues>;
	control: Control<TFieldValues>;
	label?: string;
	autoComplete?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	required?: boolean;
	id?: string;
	margin?: TextFieldProps["margin"];
	fullWidth?: boolean;
	helperText?: string;
}

export function PasswordField<TFieldValues extends FieldValues>(
	props: PasswordFieldProps<TFieldValues>,
) {
	const {
		name,
		control,
		label = "Password",
		autoComplete = "current-password",
		autoFocus,
		disabled,
		required = true,
		id,
		margin = "normal",
		fullWidth = true,
		helperText,
	} = props;

	const [showPassword, setShowPassword] = useState(false);

	const handleToggleVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
	};

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<TextField
					{...field}
					margin={margin}
					required={required}
					fullWidth={fullWidth}
					label={label}
					type={showPassword ? "text" : "password"}
					id={id}
					autoComplete={autoComplete}
					autoFocus={autoFocus}
					disabled={disabled}
					error={!!fieldState.error}
					helperText={fieldState.error?.message || helperText}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									onClick={handleToggleVisibility}
									onMouseDown={handleMouseDown}
									edge="end"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? <VisibilityOff /> : <Visibility />}
								</IconButton>
							</InputAdornment>
						),
					}}
				/>
			)}
		/>
	);
}

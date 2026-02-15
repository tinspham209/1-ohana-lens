"use client";

import dynamic from "next/dynamic";
import { Box, Typography } from "@mui/material";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerUiClient() {
	return (
		<Box sx={{ p: { xs: 2, md: 4 } }}>
			<Typography variant="h4" sx={{ mb: 2 }}>
				API Documentation
			</Typography>
			<SwaggerUI url="/api/swagger" />
		</Box>
	);
}

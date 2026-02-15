"use client";

import { Box } from "@mui/material";
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerUiClient() {
	return (
		<Box sx={{ p: { xs: 2, md: 4 } }}>
			<SwaggerUI url="/api/swagger" />
		</Box>
	);
}

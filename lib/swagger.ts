import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = () => {
	const spec = createSwaggerSpec({
		apiFolder: "app/api",
		definition: {
			openapi: "3.0.0",
			info: {
				title: "1 Ohana Lens API",
				version: "1.0.0",
				description:
					"API documentation for 1 Ohana Lens media management application",
			},
			servers: [
				{
					url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
					description: "Development server",
				},
			],
			components: {
				securitySchemes: {
					BearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
						description: "Admin or folder JWT token",
					},
				},
			},
			security: [
				{
					BearerAuth: [],
				},
			],
		},
	});

	return spec;
};

import { notFound } from "next/navigation";
import SwaggerUiClient from "@/components/SwaggerUiClient";

export default function ApiDocsPage() {
	if (process.env.NODE_ENV !== "development") {
		notFound();
	}

	return <SwaggerUiClient />;
}

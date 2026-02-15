import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/utils";

interface FolderMetadata {
	id: string;
	name: string;
	description?: string;
}

export async function generateMetadata({
	params,
}: {
	params: { folderId: string };
}): Promise<Metadata> {
	try {
		const baseUrl = getBaseUrl();
		const response = await fetch(
			`${baseUrl}/api/folders/${params.folderId}/metadata`,
			{
				next: { revalidate: 3600 }, // Revalidate every hour
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch folder metadata");
		}

		const folder: FolderMetadata = await response.json();

		const title = `Manage ${folder.name} - 1 Ohana Lens`;
		const description = folder.description
			? `Admin panel for ${folder.name} - ${folder.description}`
			: `Admin panel for ${folder.name}`;

		return {
			title,
			description,
			robots: {
				index: false, // Don't index admin pages
				follow: false,
			},
		};
	} catch (error) {
		console.error("[Metadata] Error fetching folder metadata:", error);
		// Return default metadata if fetch fails
		return {
			title: "Folder Management - 1 Ohana Lens",
			description: "Admin panel for managing folder media",
			robots: {
				index: false,
				follow: false,
			},
		};
	}
}

export default function AdminFolderLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export async function generateMetadata({
	params,
}: {
	params: { folderId: string };
}): Promise<Metadata> {
	try {
		// Query database directly to avoid HTTP fetch issues in production
		const folder = await prisma.folder.findUnique({
			where: { id: params.folderId },
			select: {
				id: true,
				name: true,
				description: true,
			},
		});

		if (!folder) {
			console.warn(`[Metadata] Folder not found: ${params.folderId}`);
			return {
				title: "Folder Not Found - 1 Ohana Lens",
				description: "The requested folder could not be found",
				robots: {
					index: false,
					follow: false,
				},
			};
		}

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
		// Return default metadata if database query fails
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

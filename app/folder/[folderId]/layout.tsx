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
			};
		}

		const title = `${folder.name} - 1 Ohana Lens`;
		const description = folder.description
			? `Explore the media of ${folder.name} - ${folder.description}`
			: `Explore the media from ${folder.name}`;

		const baseUrl =
			process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL
				? `https://${process.env.VERCEL_URL}`
				: "http://localhost:3000";

		return {
			title,
			description,
			openGraph: {
				title,
				description,
				url: `${baseUrl}/folder/${params.folderId}`,
				type: "website",
				images: [
					{
						url: "/opengraph-image.webp",
						width: 1200,
						height: 630,
						alt: title,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title,
				description,
				images: ["/opengraph-image.webp"],
			},
			alternates: {
				canonical: `${baseUrl}/folder/${params.folderId}`,
			},
		};
	} catch (error) {
		console.error("[Metadata] Error fetching folder metadata:", error);
		// Return default metadata if database query fails
		return {
			title: "Run Club Media - 1 Ohana Lens",
			description: "Access shared media from the run club",
		};
	}
}

export default function FolderLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

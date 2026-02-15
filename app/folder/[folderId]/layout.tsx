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

		const title = `${folder.name} - 1 Ohana Lens`;
		const description = folder.description
			? `Explore the media of ${folder.name} - ${folder.description}`
			: `Explore the media from ${folder.name}`;

		return {
			title,
			description,
			openGraph: {
				title,
				description,
				url: `${process.env.NEXT_PUBLIC_URL}/folder/${params.folderId}`,
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
				canonical: `${process.env.NEXT_PUBLIC_URL}/folder/${params.folderId}`,
			},
		};
	} catch (error) {
		console.error("[Metadata] Error fetching folder metadata:", error);
		// Return default metadata if fetch fails
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

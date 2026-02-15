import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken, verifyFolderToken } from "@/lib/auth";

/**
 * @swagger
 * /api/folders/{folderId}/media:
 *   get:
 *     summary: Get media in folder
 *     description: Get all media files in a folder
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of media
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Folder not found
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { folderId: string } },
) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];

		// Verify token (admin or folder access)
		const admin = await verifyAdminToken(token);
		const folderAuth = !admin ? await verifyFolderToken(token) : null;

		if (!admin && !folderAuth) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		// If folder token, verify it matches the requested folder
		if (folderAuth && folderAuth.folderId !== params.folderId) {
			return NextResponse.json(
				{ error: "Access denied to this folder", code: "ACCESS_DENIED" },
				{ status: 403 },
			);
		}

		// Get media
		const media = await prisma.media.findMany({
			where: { folderId: params.folderId },
			orderBy: { uploadedAt: "desc" },
			select: {
				id: true,
				fileName: true,
				cloudinaryUrl: true,
				mediaType: true,
				fileSize: true,
				mimeType: true,
				uploadedAt: true,
			},
		});

		// Convert BigInt to Number for JSON serialization
		const serializedMedia = media.map((item) => ({
			...item,
			fileSize: Number(item.fileSize),
		}));

		return NextResponse.json({ media: serializedMedia });
	} catch (error) {
		console.error("[API] Get media error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

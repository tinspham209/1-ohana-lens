import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

/**
 * @swagger
 * /api/media/save:
 *   post:
 *     summary: Save media metadata after Cloudinary upload
 *     description: Save media information to database after successful direct upload to Cloudinary (admin only)
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *               fileName:
 *                 type: string
 *               cloudinaryUrl:
 *                 type: string
 *               cloudinaryPublicId:
 *                 type: string
 *               mediaType:
 *                 type: string
 *                 enum: [image, video]
 *               fileSize:
 *                 type: number
 *               mimeType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media metadata saved
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Folder not found
 */
export async function POST(request: NextRequest) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const {
			folderId,
			fileName,
			cloudinaryUrl,
			cloudinaryPublicId,
			mediaType,
			fileSize,
			mimeType,
		} = body;

		// Validate required fields
		if (
			!folderId ||
			!fileName ||
			!cloudinaryUrl ||
			!cloudinaryPublicId ||
			!mediaType ||
			!fileSize
		) {
			return NextResponse.json(
				{ error: "Missing required fields", code: "MISSING_FIELDS" },
				{ status: 400 },
			);
		}

		// Check if folder exists
		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
		});

		if (!folder) {
			return NextResponse.json(
				{ error: "Folder not found", code: "FOLDER_NOT_FOUND" },
				{ status: 404 },
			);
		}

		// Save media to database
		const media = await prisma.media.create({
			data: {
				folderId,
				fileName,
				cloudinaryUrl,
				cloudinaryPublicId,
				mediaType,
				fileSize: BigInt(fileSize),
				mimeType: mimeType || "application/octet-stream",
			},
		});

		// Update folder size
		await prisma.folder.update({
			where: { id: folderId },
			data: {
				sizeInBytes: {
					increment: BigInt(fileSize),
				},
			},
		});

		// Log access
		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				folderId,
				action: "MEDIA_UPLOAD",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json(
			{
				media: {
					id: media.id,
					url: media.cloudinaryUrl,
					type: mediaType,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("[API] Error saving media metadata:", error);
		return NextResponse.json(
			{ error: "Failed to save media", code: "SAVE_ERROR" },
			{ status: 500 },
		);
	}
}

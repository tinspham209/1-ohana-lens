import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/media/{mediaId}:
 *   delete:
 *     summary: Delete a media file
 *     description: Delete a single media file from a folder (admin only)
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: mediaId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 mediaId:
 *                   type: string
 *                 folderId:
 *                   type: string
 *                 freedBytes:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Media not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { mediaId: string } },
) {
	try {
		// Verify admin token from Bearer header
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		const mediaId = params.mediaId;

		// Find media record in database
		const media = await prisma.media.findUnique({
			where: { id: mediaId },
			include: { folder: true },
		});

		if (!media) {
			return NextResponse.json(
				{ error: "Media not found", code: "NOT_FOUND" },
				{ status: 404 },
			);
		}

		const folderId = media.folderId;
		const cloudinaryPublicId = media.cloudinaryPublicId;
		const fileSize = media.fileSize;

		// Delete from Cloudinary first (if it fails, don't delete from DB)
		if (cloudinaryPublicId) {
			try {
				await deleteFromCloudinary(cloudinaryPublicId);
			} catch (error) {
				console.error("[API] Cloudinary delete failed:", error);
				return NextResponse.json(
					{
						error: "Failed to delete from cloud storage",
						code: "CLOUDINARY_ERROR",
					},
					{ status: 500 },
				);
			}
		}

		// Delete from database
		await prisma.media.delete({
			where: { id: mediaId },
		});

		// Update folder sizeInBytes (subtract file size)
		await prisma.folder.update({
			where: { id: folderId },
			data: {
				sizeInBytes: {
					decrement: fileSize,
				},
			},
		});

		return NextResponse.json(
			{
				ok: true,
				message: "Media deleted successfully",
				mediaId,
				folderId,
				freedBytes: Number(fileSize),
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("[API] Delete media error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "INTERNAL_ERROR" },
			{ status: 500 },
		);
	}
}

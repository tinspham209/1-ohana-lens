import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/admin/storage-usage:
 *   get:
 *     summary: Get storage usage statistics
 *     description: Get current storage usage from all folders
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Storage usage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentGb:
 *                   type: number
 *                 quotaGb:
 *                   type: number
 *                 percentUsed:
 *                   type: number
 *                 status:
 *                   type: string
 *                   enum: [ok, warning, critical]
 *                 recommendation:
 *                   type: string
 *                 totalFolders:
 *                   type: number
 *                 totalFiles:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];

		// Verify admin token
		const admin = await verifyAdminToken(token);
		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		// Get all media files to calculate actual storage usage
		const allMedia = await prisma.media.findMany({
			select: {
				fileSize: true,
				folderId: true,
			},
		});

		// Get total folders
		const totalFolders = await prisma.folder.count();

		// Calculate totals from actual media files
		const totalBytes = allMedia.reduce(
			(sum, media) => sum + Number(media.fileSize),
			0,
		);
		const totalFiles = allMedia.length;

		const quotaBytes = 25 * 1024 * 1024 * 1024; // 25GB
		const quotaGb = 25;
		const currentGb = parseFloat(
			(totalBytes / (1024 * 1024 * 1024)).toFixed(2),
		);
		const percentUsed = parseFloat(
			((totalBytes / quotaBytes) * 100).toFixed(1),
		);

		// Determine status
		let status = "ok";
		let recommendation = "Storage usage is normal";

		if (percentUsed > 95) {
			status = "critical";
			recommendation =
				"🚨 CRITICAL: Storage at 95%+! Delete oldest folder immediately!";
		} else if (percentUsed > 80) {
			status = "warning";
			recommendation =
				"⚠️ WARNING: Storage at 80%+. Plan to delete oldest folder within a week.";
		}

		return NextResponse.json({
			currentGb,
			quotaGb,
			percentUsed,
			status,
			recommendation,
			totalFolders,
			totalFiles,
			bytesUsed: totalBytes,
		});
	} catch (error) {
		console.error("[API] Get storage usage error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

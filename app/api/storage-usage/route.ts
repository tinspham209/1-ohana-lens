import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { getStorageUsage } from "@/lib/cloudinary";
import { formatBytes } from "@/lib/formatBytes";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/storage-usage:
 *   get:
 *     summary: Get storage usage statistics
 *     description: Get current storage usage from all folders
 *     tags: [Storage]
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

		// Get storage usage from Cloudinary
		const storageUsage = await getStorageUsage();

		// Get total folders/files from database for metadata
		const [totalFolders, totalFiles] = await Promise.all([
			prisma.folder.count(),
			prisma.media.count(),
		]);

		const quotaGb = storageUsage.totalGB;
		const currentGb = storageUsage.usedGB;
		const percentUsed = storageUsage.percentageUsed;

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
			bytesUsed: storageUsage.usedBytes,
			cloudinary: {
				plan: storageUsage.usage.plan,
				lastUpdated: storageUsage.usage.lastUpdated,
				dateRequested: storageUsage.usage.dateRequested,
				credits: {
					used: storageUsage.usage.creditsUsage,
					limit: storageUsage.usage.creditsLimit,
					usedPercent: storageUsage.usage.creditsUsedPercent,
				},
				storage: {
					usedBytes: storageUsage.usage.storageUsageBytes,
					usedReadable: formatBytes(storageUsage.usage.storageUsageBytes),
					creditsUsage: storageUsage.usage.storageCreditsUsage,
				},
				bandwidth: {
					usedBytes: storageUsage.usage.bandwidthUsageBytes,
					usedReadable: formatBytes(storageUsage.usage.bandwidthUsageBytes),
					creditsUsage: storageUsage.usage.bandwidthCreditsUsage,
				},
				transformations: {
					usage: storageUsage.usage.transformationsUsage,
					creditsUsage: storageUsage.usage.transformationsCreditsUsage,
					breakdown: storageUsage.usage.transformationsBreakdown ?? {},
				},
				objects: {
					usage: storageUsage.usage.objectsUsage,
				},
				impressions: {
					usage: storageUsage.usage.impressionsUsage,
					creditsUsage: storageUsage.usage.impressionsCreditsUsage,
				},
				secondsDelivered: {
					usage: storageUsage.usage.secondsDeliveredUsage,
					creditsUsage: storageUsage.usage.secondsDeliveredCreditsUsage,
				},
				resources: {
					primary: storageUsage.usage.resources,
					derived: storageUsage.usage.derivedResources,
				},
				requests: storageUsage.usage.requests,
				mediaLimits: {
					imageMaxSizeBytes: storageUsage.usage.mediaLimits.imageMaxSizeBytes,
					imageMaxSizeReadable: formatBytes(
						storageUsage.usage.mediaLimits.imageMaxSizeBytes,
					),
					videoMaxSizeBytes: storageUsage.usage.mediaLimits.videoMaxSizeBytes,
					videoMaxSizeReadable: formatBytes(
						storageUsage.usage.mediaLimits.videoMaxSizeBytes,
					),
					rawMaxSizeBytes: storageUsage.usage.mediaLimits.rawMaxSizeBytes,
					rawMaxSizeReadable: formatBytes(
						storageUsage.usage.mediaLimits.rawMaxSizeBytes,
					),
					imageMaxPx: storageUsage.usage.mediaLimits.imageMaxPx,
					assetMaxTotalPx: storageUsage.usage.mediaLimits.assetMaxTotalPx,
				},
				rateLimit: {
					allowed: storageUsage.usage.rateLimitAllowed,
					remaining: storageUsage.usage.rateLimitRemaining,
					resetAt: storageUsage.usage.rateLimitResetAt,
				},
			},
		});
	} catch (error) {
		console.error("[API] Get storage usage error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

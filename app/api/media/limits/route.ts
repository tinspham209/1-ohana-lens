import { NextResponse } from "next/server";
import { getMediaLimits } from "@/lib/validateMediaLimits";

/**
 * @swagger
 * /api/media/limits:
 *   get:
 *     summary: Get media upload limits and rate limit status
 *     description: Returns current Cloudinary media limits and rate limit information
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Media limits retrieved successfully
 *       500:
 *         description: Error fetching limits
 */
export async function GET() {
	try {
		const limits = await getMediaLimits();

		// Set cache headers - revalidate every 5 minutes
		const headers = new Headers({
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300", // 5 minutes
		});

		return NextResponse.json(
			{
				ok: true,
				data: {
					imageMaxSizeBytes: limits.imageMaxSizeBytes,
					imageMaxSizeMB: limits.imageMaxSizeBytes / (1024 * 1024),
					videoMaxSizeBytes: limits.videoMaxSizeBytes,
					videoMaxSizeMB: limits.videoMaxSizeBytes / (1024 * 1024),
					rawMaxSizeBytes: limits.rawMaxSizeBytes,
					rawMaxSizeMB: limits.rawMaxSizeBytes / (1024 * 1024),
					imageMaxPx: limits.imageMaxPx,
					assetMaxTotalPx: limits.assetMaxTotalPx,
					rateLimit: {
						allowed: limits.rateLimitAllowed,
						remaining: limits.rateLimitRemaining,
						percentageRemaining: Math.round(
							(limits.rateLimitRemaining / limits.rateLimitAllowed) * 100,
						),
					},
				},
			},
			{ status: 200, headers },
		);
	} catch (error) {
		console.error("[API] Error fetching media limits:", error);
		return NextResponse.json(
			{
				ok: false,
				error: "Failed to fetch media limits",
				code: "LIMITS_FETCH_ERROR",
			},
			{ status: 500 },
		);
	}
}

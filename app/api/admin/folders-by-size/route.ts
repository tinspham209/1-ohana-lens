import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/admin/folders-by-size:
 *   get:
 *     summary: Get folders sorted by size
 *     description: Get all folders sorted by size (largest first) for cleanup planning
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of folders sorted by size
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   sizeGb:
 *                     type: number
 *                   sizeBytes:
 *                     type: number
 *                   mediaCount:
 *                     type: number
 *                   createdAt:
 *                     type: string
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

		// Get all folders with media count, sorted by size
		const folders = await prisma.folder.findMany({
			select: {
				id: true,
				name: true,
				sizeInBytes: true,
				createdAt: true,
				_count: {
					select: { media: true },
				},
			},
			orderBy: {
				sizeInBytes: "desc",
			},
		});

		// Format response
		const formattedFolders = folders.map((folder: (typeof folders)[0]) => ({
			id: folder.id,
			name: folder.name,
			sizeBytes: Number(folder.sizeInBytes),
			sizeGb: parseFloat(
				(Number(folder.sizeInBytes) / (1024 * 1024 * 1024)).toFixed(2),
			),
			mediaCount: folder._count.media,
			createdAt: folder.createdAt,
		}));

		return NextResponse.json({ folders: formattedFolders });
	} catch (error) {
		console.error("[API] Get folders by size error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

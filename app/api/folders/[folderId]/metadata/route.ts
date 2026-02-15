import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * @swagger
 * /api/folders/{folderId}/metadata:
 *   get:
 *     summary: Get folder metadata (public, no auth required)
 *     description: Get folder name and description for SEO/sharing purposes. Does not require authentication.
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *       404:
 *         description: Folder not found
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { folderId: string } },
) {
	try {
		const folder = await prisma.folder.findUnique({
			where: { id: params.folderId },
			select: {
				id: true,
				name: true,
				description: true,
			},
		});

		if (!folder) {
			return NextResponse.json(
				{ error: "Folder not found", code: "NOT_FOUND" },
				{ status: 404 },
			);
		}

		return NextResponse.json(folder);
	} catch (error) {
		console.error("[API] Error fetching folder metadata:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "INTERNAL_ERROR" },
			{ status: 500 },
		);
	}
}

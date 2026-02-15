import { NextRequest, NextResponse } from "next/server";
import { verifyFolderToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Member logout
 *     description: Logout member (folder access) and log the action
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];

		if (!token) {
			return NextResponse.json(
				{ error: "No token provided", code: "NO_TOKEN" },
				{ status: 401 },
			);
		}

		const folderAuth = await verifyFolderToken(token);

		if (!folderAuth) {
			return NextResponse.json(
				{ error: "Invalid token", code: "INVALID_TOKEN" },
				{ status: 401 },
			);
		}

		// Log access
		await prisma.accessLog.create({
			data: {
				folderId: folderAuth.folderId,
				action: "FOLDER_LOGOUT",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({ ok: true, message: "Logged out successfully" });
	} catch (error) {
		console.error("[API] Member logout error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

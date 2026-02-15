import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * @swagger
 * /api/auth/admin-logout:
 *   post:
 *     summary: Admin logout
 *     description: Logout admin user and invalidate session
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

		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Invalid token", code: "INVALID_TOKEN" },
				{ status: 401 },
			);
		}

		// Delete session
		const tokenHash = token.substring(0, 32);
		await prisma.session.deleteMany({
			where: {
				adminId: admin.adminId,
				tokenHash,
			},
		});

		// Log access
		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				action: "ADMIN_LOGOUT",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({ ok: true, message: "Logged out successfully" });
	} catch (error) {
		console.error("[API] Admin logout error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

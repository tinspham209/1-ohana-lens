import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/admin-delete:
 *   delete:
 *     summary: Delete admin
 *     description: Delete an admin account (admin-only)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing adminId
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Self-delete not allowed
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
export async function DELETE(request: NextRequest) {
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

		const body = await request.json();
		const { adminId } = body;

		if (!adminId) {
			return NextResponse.json(
				{ error: "adminId is required", code: "MISSING_FIELDS" },
				{ status: 400 },
			);
		}

		if (admin.adminId === adminId) {
			return NextResponse.json(
				{ error: "Cannot delete your own account", code: "SELF_DELETE" },
				{ status: 403 },
			);
		}

		const existingAdmin = await prisma.adminUser.findUnique({
			where: { id: adminId },
			select: { id: true },
		});

		if (!existingAdmin) {
			return NextResponse.json(
				{ error: "Admin not found", code: "ADMIN_NOT_FOUND" },
				{ status: 404 },
			);
		}

		await prisma.adminUser.delete({
			where: { id: adminId },
		});

		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				action: "ADMIN_DELETE",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({
			ok: true,
			message: "Admin deleted successfully",
		});
	} catch (error) {
		console.error("[API] Admin delete error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

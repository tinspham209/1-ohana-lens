import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyAdminToken } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/admin-signup:
 *   post:
 *     summary: Admin signup
 *     description: Create a new admin account (admin-only)
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
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Admin already exists
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

		const body = await request.json();
		const { username, email, password } = body;

		if (!username || !email || !password) {
			return NextResponse.json(
				{
					error: "Username, email, and password are required",
					code: "MISSING_FIELDS",
				},
				{ status: 400 },
			);
		}

		const existingAdmin = await prisma.adminUser.findFirst({
			where: {
				OR: [{ username }, { email }],
			},
			select: { id: true },
		});

		if (existingAdmin) {
			return NextResponse.json(
				{ error: "Admin already exists", code: "ADMIN_EXISTS" },
				{ status: 409 },
			);
		}

		const passwordHash = await hashPassword(password);

		const newAdmin = await prisma.adminUser.create({
			data: {
				username,
				email,
				passwordHash,
			},
			select: {
				id: true,
				username: true,
				email: true,
				isActive: true,
				createdAt: true,
			},
		});

		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				action: "ADMIN_SIGNUP",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({ admin: newAdmin }, { status: 201 });
	} catch (error) {
		console.error("[API] Admin signup error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

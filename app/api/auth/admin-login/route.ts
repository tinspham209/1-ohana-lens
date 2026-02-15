import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, generateAdminToken } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/admin-login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate admin user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { username, password } = body;

		// Validate input
		if (!username || !password) {
			return NextResponse.json(
				{ error: "Username and password are required", code: "MISSING_FIELDS" },
				{ status: 400 },
			);
		}

		// Find admin user
		const admin = await prisma.adminUser.findUnique({
			where: { username },
			select: {
				id: true,
				username: true,
				email: true,
				passwordHash: true,
				isActive: true,
			},
		});

		// Check if admin exists and is active
		if (!admin || !admin.isActive) {
			return NextResponse.json(
				{ error: "Invalid credentials", code: "INVALID_CREDENTIALS" },
				{ status: 401 },
			);
		}

		// Verify password
		const isPasswordValid = await comparePassword(password, admin.passwordHash);

		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: "Invalid credentials", code: "INVALID_CREDENTIALS" },
				{ status: 401 },
			);
		}

		// Generate JWT token
		const token = generateAdminToken(admin.id);

		// Update last login
		await prisma.adminUser.update({
			where: { id: admin.id },
			data: { lastLogin: new Date() },
		});

		// Create session record
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

		await prisma.session.create({
			data: {
				adminId: admin.id,
				tokenHash: token.substring(0, 32), // Store first 32 chars as hash
				expiresAt,
			},
		});

		// Log access
		await prisma.accessLog.create({
			data: {
				adminId: admin.id,
				action: "ADMIN_LOGIN",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({
			token,
			admin: {
				id: admin.id,
				username: admin.username,
				email: admin.email,
			},
		});
	} catch (error) {
		console.error("[API] Admin login error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

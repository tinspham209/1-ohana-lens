import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, generateFolderToken } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/verify-password:
 *   post:
 *     summary: Verify folder password
 *     description: Verify folder password and return JWT token for member access
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - folderId
 *               - password
 *             properties:
 *               folderId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 folder:
 *                   type: object
 *       401:
 *         description: Invalid password
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { folderId, password } = body;

		// Validate input
		if (!folderId || !password) {
			return NextResponse.json(
				{
					error: "Folder ID and password are required",
					code: "MISSING_FIELDS",
				},
				{ status: 400 },
			);
		}

		// Find folder
		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			select: {
				id: true,
				name: true,
				description: true,
				folderKey: true,
				passwordHash: true,
			},
		});

		if (!folder) {
			return NextResponse.json(
				{ error: "Folder not found", code: "FOLDER_NOT_FOUND" },
				{ status: 404 },
			);
		}

		// Verify password
		const isPasswordValid = await comparePassword(
			password,
			folder.passwordHash,
		);

		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: "Invalid password", code: "INVALID_PASSWORD" },
				{ status: 401 },
			);
		}

		// Generate JWT token
		const token = generateFolderToken(folder.id);

		// Log access
		await prisma.accessLog.create({
			data: {
				folderId: folder.id,
				action: "FOLDER_ACCESS",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({
			token,
			folder: {
				id: folder.id,
				name: folder.name,
				description: folder.description,
				folderKey: folder.folderKey,
			},
		});
	} catch (error) {
		console.error("[API] Verify password error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

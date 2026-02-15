import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
	verifyAdminToken,
	hashPassword,
	generateFolderPassword,
	generateFolderKey,
} from "@/lib/auth";

/**
 * @swagger
 * /api/folders:
 *   get:
 *     summary: List all folders
 *     description: Get all folders (admin only)
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of folders
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		const folders = await prisma.folder.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				description: true,
				folderKey: true,
				sizeInBytes: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: { media: true },
				},
			},
		});

		// Convert BigInt to Number for JSON serialization
		const serializedFolders = folders.map((folder) => ({
			...folder,
			sizeInBytes: Number(folder.sizeInBytes),
		}));

		return NextResponse.json({ folders: serializedFolders });
	} catch (error) {
		console.error("[API] List folders error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Create a new folder
 *     description: Create a new folder with auto-generated password (admin only)
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Folder created
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { name, description } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Folder name is required", code: "MISSING_NAME" },
				{ status: 400 },
			);
		}

		// Generate password and folder key
		const password = generateFolderPassword();
		const passwordHash = await hashPassword(password);
		const folderKey = generateFolderKey();

		// Create folder
		const folder = await prisma.folder.create({
			data: {
				name,
				description: description || null,
				folderKey,
				passwordHash,
			},
		});

		// Log access
		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				folderId: folder.id,
				action: "FOLDER_CREATE",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json(
			{
				folder: {
					id: folder.id,
					name: folder.name,
					description: folder.description,
					folderKey: folder.folderKey,
				},
				password, // Return password only once
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("[API] Create folder error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

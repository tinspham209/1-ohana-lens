import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { deleteFolder as deleteCloudinaryFolder } from "@/lib/cloudinary";

/**
 * @swagger
 * /api/folders/{folderId}:
 *   get:
 *     summary: Get folder details
 *     description: Get details of a specific folder
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder details
 *       404:
 *         description: Folder not found
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { folderId: string } },
) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		const folder = await prisma.folder.findUnique({
			where: { id: params.folderId },
			include: {
				_count: {
					select: { media: true },
				},
			},
		});

		if (!folder) {
			return NextResponse.json(
				{ error: "Folder not found", code: "FOLDER_NOT_FOUND" },
				{ status: 404 },
			);
		}

		// Convert BigInt to Number for JSON serialization
		const serializedFolder = {
			...folder,
			sizeInBytes: Number(folder.sizeInBytes),
		};

		return NextResponse.json(serializedFolder);
	} catch (error) {
		console.error("[API] Get folder error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

/**
 * @swagger
 * /api/folders/{folderId}:
 *   patch:
 *     summary: Update folder
 *     description: Update folder metadata (admin only)
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Folder updated
 *       404:
 *         description: Folder not found
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { folderId: string } },
) {
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

		const folder = await prisma.folder.update({
			where: { id: params.folderId },
			data: {
				...(name && { name }),
				...(description !== undefined && { description }),
			},
		});

		// Log access
		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				folderId: folder.id,
				action: "FOLDER_UPDATE",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({ folder });
	} catch (error) {
		console.error("[API] Update folder error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

/**
 * @swagger
 * /api/folders/{folderId}:
 *   delete:
 *     summary: Delete folder
 *     description: Delete folder and all its media (admin only)
 *     tags: [Folders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder deleted
 *       404:
 *         description: Folder not found
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { folderId: string } },
) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		// Get folder with media
		const folder = await prisma.folder.findUnique({
			where: { id: params.folderId },
			include: { media: true },
		});

		if (!folder) {
			return NextResponse.json(
				{ error: "Folder not found", code: "FOLDER_NOT_FOUND" },
				{ status: 404 },
			);
		}

		const sizeInBytes = folder.sizeInBytes;
		const sizeInGB = Number(sizeInBytes) / (1024 * 1024 * 1024);

		// Delete from Cloudinary
		try {
			const cloudinaryPath = `ohana-lens/folder-${params.folderId}`;
			await deleteCloudinaryFolder(cloudinaryPath);
		} catch (cloudinaryError) {
			console.error("[API] Cloudinary delete error:", cloudinaryError);
			// Continue with database deletion even if Cloudinary fails
		}

		// Delete from database (CASCADE will delete media and access logs)
		await prisma.folder.delete({
			where: { id: params.folderId },
		});

		// Log access
		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				action: "FOLDER_DELETE",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		return NextResponse.json({
			ok: true,
			message: "Folder deleted successfully",
			freedGB: Math.round(sizeInGB * 100) / 100,
		});
	} catch (error) {
		console.error("[API] Delete folder error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

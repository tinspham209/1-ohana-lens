import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @swagger
 * /api/media/upload-signature:
 *   post:
 *     summary: Generate Cloudinary upload signature
 *     description: Generate a signed upload signature for direct client-side uploads to Cloudinary (admin only)
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *                 description: The folder ID to upload to
 *     responses:
 *       200:
 *         description: Upload signature generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signature:
 *                   type: string
 *                 timestamp:
 *                   type: number
 *                 cloudName:
 *                   type: string
 *                 apiKey:
 *                   type: string
 *                 folder:
 *                   type: string
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
		const { folderId } = body;

		if (!folderId) {
			return NextResponse.json(
				{ error: "Folder ID is required", code: "MISSING_FOLDER_ID" },
				{ status: 400 },
			);
		}

		// Generate upload parameters
		const timestamp = Math.round(new Date().getTime() / 1000);
		const folderName = process.env.CLOUDINARY_FOLDER_NAME || "ohana-lens";
		const folder = `${folderName}/folder-${folderId}`;

		// Parameters to sign (must match exactly what client sends to Cloudinary)
		const params = {
			timestamp,
			folder,
		};

		// Generate signature
		const signature = cloudinary.utils.api_sign_request(
			params,
			process.env.CLOUDINARY_API_SECRET!,
		);

		return NextResponse.json({
			signature,
			timestamp,
			cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
			apiKey: process.env.CLOUDINARY_API_KEY,
			folder,
		});
	} catch (error) {
		console.error("[API] Error generating upload signature:", error);
		return NextResponse.json(
			{ error: "Failed to generate signature", code: "SIGNATURE_ERROR" },
			{ status: 500 },
		);
	}
}

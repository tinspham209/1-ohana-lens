import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { validateMediaFile } from "@/lib/validateMediaLimits";
import {
	compressImage,
	getTargetCompressionSize,
} from "@/lib/imageCompression";

// Configure API route to handle large file uploads (up to 100MB)
// NOTE: This route is kept for backward compatibility and edge cases.
// Primary upload method uses direct client-side upload to Cloudinary
// via /api/media/upload-signature + /api/media/save to bypass Vercel's
// 4.5MB serverless function payload limit.
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout for uploads

/**
 * @swagger
 * /api/media/upload/{folderId}:
 *   post:
 *     summary: Upload media files (Legacy - for small files only)
 *     description: Upload images or videos to a folder (admin only). Limited to 4.5MB due to Vercel payload limits. Use direct upload for larger files.
 *     tags: [Media]
 *     deprecated: false
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid files
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Folder not found
 */
export async function POST(
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

		// Check if folder exists
		const folder = await prisma.folder.findUnique({
			where: { id: params.folderId },
		});

		if (!folder) {
			return NextResponse.json(
				{ error: "Folder not found", code: "FOLDER_NOT_FOUND" },
				{ status: 404 },
			);
		}

		// Get form data
		const formData = await request.formData();
		const files = formData.getAll("files") as File[];
		const shouldCompress = process.env.COMPRESS_IMAGES === "true"; // Feature flag for compression

		if (!files || files.length === 0) {
			return NextResponse.json(
				{ error: "No files provided", code: "NO_FILES" },
				{ status: 400 },
			);
		}

		const results = [];
		let totalSize = 0;

		for (const file of files) {
			const mediaType = file.type.startsWith("image/") ? "image" : "video";

			// Validate file against Cloudinary limits
			const validation = await validateMediaFile(file, mediaType);

			if (!validation.valid) {
				// If image is too large and compression is enabled, try to compress
				if (
					shouldCompress &&
					mediaType === "image" &&
					validation.shouldCompress
				) {
					try {
						console.log(
							`[Upload] Compressing image: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
						);

						const buffer = Buffer.from(await file.arrayBuffer());
						const targetSize = getTargetCompressionSize();
						const compressed = await compressImage(buffer, targetSize);

						// If compression successful, continue with compressed buffer
						if (compressed.compressedSize < file.size) {
							console.log(
								`[Upload] Compression successful: ${(compressed.originalSize / (1024 * 1024)).toFixed(2)}MB → ${(compressed.compressedSize / (1024 * 1024)).toFixed(2)}MB`,
							);

							try {
								const uploadResult = await uploadToCloudinary(
									compressed.buffer,
									params.folderId,
									file.name,
									mediaType,
								);

								const media = await prisma.media.create({
									data: {
										folderId: params.folderId,
										fileName: file.name,
										cloudinaryUrl: uploadResult.url,
										cloudinaryPublicId: uploadResult.publicId,
										mediaType,
										fileSize: BigInt(compressed.compressedSize),
										mimeType: file.type,
									},
								});

								totalSize += compressed.compressedSize;

								results.push({
									fileName: file.name,
									success: true,
									media: {
										id: media.id,
										url: media.cloudinaryUrl,
										type: mediaType,
									},
									compressed: true,
									originalSize: compressed.originalSize,
									compressedSize: compressed.compressedSize,
									compressionRatio: compressed.compressionRatio,
								});
								continue;
							} catch (uploadError) {
								console.error(
									`[Upload] Failed to upload compressed image ${file.name}:`,
									uploadError,
								);
								results.push({
									fileName: file.name,
									success: false,
									error: "Upload failed after compression",
									code: "UPLOAD_ERROR",
								});
								continue;
							}
						}
					} catch (compressionError) {
						console.error(
							`[Upload] Compression failed for ${file.name}:`,
							compressionError,
						);
						// Fall through to return validation error
					}
				}

				// Return validation error if no compression or compression failed
				results.push({
					fileName: file.name,
					success: false,
					error: validation.error || "File validation failed",
					code: validation.code || "VALIDATION_ERROR",
					suggestion: validation.suggestion,
				});
				continue;
			}

			// File passed validation, proceed with upload
			try {
				const buffer = Buffer.from(await file.arrayBuffer());
				const uploadResult = await uploadToCloudinary(
					buffer,
					params.folderId,
					file.name,
					mediaType,
				);

				// Save to database
				const media = await prisma.media.create({
					data: {
						folderId: params.folderId,
						fileName: file.name,
						cloudinaryUrl: uploadResult.url,
						cloudinaryPublicId: uploadResult.publicId,
						mediaType,
						fileSize: BigInt(file.size),
						mimeType: file.type,
					},
				});

				totalSize += file.size;

				results.push({
					fileName: file.name,
					success: true,
					media: {
						id: media.id,
						url: media.cloudinaryUrl,
						type: mediaType,
					},
				});
			} catch (error) {
				console.error(`[API] Upload error for ${file.name}:`, error);
				results.push({
					fileName: file.name,
					success: false,
					error: "Upload failed",
					code: "UPLOAD_ERROR",
				});
			}
		}

		// Update folder size
		await prisma.folder.update({
			where: { id: params.folderId },
			data: {
				sizeInBytes: {
					increment: BigInt(totalSize),
				},
			},
		});

		// Log access
		await prisma.accessLog.create({
			data: {
				adminId: admin.adminId,
				folderId: params.folderId,
				action: "MEDIA_UPLOAD",
				ipAddress: request.headers.get("x-forwarded-for") || "unknown",
				userAgent: request.headers.get("user-agent") || "unknown",
			},
		});

		const successCount = results.filter((r) => r.success).length;

		return NextResponse.json(
			{
				message: `Uploaded ${successCount} of ${files.length} files`,
				results,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("[API] Media upload error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

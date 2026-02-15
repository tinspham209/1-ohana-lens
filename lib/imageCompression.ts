import sharp, { Sharp } from "sharp";

interface CompressionResult {
	buffer: Buffer;
	originalSize: number;
	compressedSize: number;
	compressionRatio: number;
	format: string;
	metadata?: {
		width?: number;
		height?: number;
	};
}

/**
 * Compress image to target size or quality
 * Supports JPEG, PNG, WebP, and GIF formats
 */
export async function compressImage(
	buffer: Buffer,
	targetSizeBytes: number = 8 * 1024 * 1024, // Default 8MB (under 10MB limit)
): Promise<CompressionResult> {
	try {
		const originalSize = buffer.byteLength;

		// Detect image format from buffer
		const metadata = await sharp(buffer).metadata();
		const format = metadata.format?.toLowerCase() || "jpeg";

		// If already under target size, return as-is
		if (originalSize <= targetSizeBytes) {
			return {
				buffer,
				originalSize,
				compressedSize: originalSize,
				compressionRatio: 1,
				format,
				metadata: {
					width: metadata.width,
					height: metadata.height,
				},
			};
		}

		// Start with base quality and reduce if needed
		let quality = 85;
		let compressed = buffer;
		let compressedSize = originalSize;
		const maxAttempts = 5;
		let attempts = 0;

		while (compressedSize > targetSizeBytes && attempts < maxAttempts) {
			try {
				let sharpInstance: Sharp = sharp(buffer);

				// Apply format-specific compression
				if (format === "jpeg" || format === "jpg") {
					compressed = await sharpInstance
						.jpeg({ quality, progressive: true })
						.toBuffer();
				} else if (format === "png") {
					// PNG with compression level 9 and quality reduction
					compressed = await sharpInstance
						.png({
							compressionLevel: 9,
							quality: Math.max(70, quality - 10),
						})
						.toBuffer();
				} else if (format === "gif") {
					// Convert GIF to JPEG for better compression
					compressed = await sharpInstance
						.jpeg({ quality, progressive: true })
						.toBuffer();
				} else if (format === "webp") {
					compressed = await sharpInstance.webp({ quality }).toBuffer();
				} else {
					// Default: convert to optimized JPEG
					compressed = await sharpInstance
						.jpeg({ quality, progressive: true })
						.toBuffer();
				}

				compressedSize = compressed.byteLength;

				// If we're at target size, we're done
				if (compressedSize <= targetSizeBytes) {
					break;
				}

				// Reduce quality for next iteration
				quality = Math.max(20, quality - 15);
				attempts++;
			} catch (error) {
				console.error(`[Compression] Error at quality ${quality}:`, error);
				quality = Math.max(20, quality - 15);
				attempts++;
			}
		}

		const finalMetadata = await sharp(compressed).metadata();

		const result: CompressionResult = {
			buffer: compressed,
			originalSize,
			compressedSize,
			compressionRatio: originalSize / compressedSize,
			format: metadata.format || "jpeg",
			metadata: {
				width: finalMetadata.width,
				height: finalMetadata.height,
			},
		};

		console.log(
			`[Compression] Compressed from ${(originalSize / (1024 * 1024)).toFixed(2)}MB to ${(compressedSize / (1024 * 1024)).toFixed(2)}MB (ratio: ${result.compressionRatio.toFixed(2)}x)`,
		);

		return result;
	} catch (error) {
		console.error("[Compression] Fatal compression error:", error);
		// Return original buffer if compression fails
		return {
			buffer,
			originalSize: buffer.byteLength,
			compressedSize: buffer.byteLength,
			compressionRatio: 1,
			format: "unknown",
		};
	}
}

/**
 * Compress multiple images in sequence
 */
export async function compressImages(
	buffers: Buffer[],
	targetSizeBytes?: number,
): Promise<CompressionResult[]> {
	const results: CompressionResult[] = [];
	for (const buffer of buffers) {
		const result = await compressImage(buffer, targetSizeBytes);
		results.push(result);
	}
	return results;
}

/**
 * Estimate if image should be compressed based on file size
 */
export function shouldCompressImage(
	fileSize: number,
	imageMaxSizeBytes: number = 10 * 1024 * 1024,
): boolean {
	// Compress if over 80% of max size
	return fileSize > imageMaxSizeBytes * 0.8;
}

/**
 * Get target compression size (aiming for 80% of max)
 */
export function getTargetCompressionSize(
	imageMaxSizeBytes: number = 10 * 1024 * 1024,
): number {
	return Math.floor(imageMaxSizeBytes * 0.8);
}

import { getStorageUsage } from "./cloudinary";

interface MediaLimits {
	imageMaxSizeBytes: number;
	videoMaxSizeBytes: number;
	rawMaxSizeBytes: number;
	imageMaxPx: number;
	assetMaxTotalPx: number;
	rateLimitAllowed: number;
	rateLimitRemaining: number;
}

interface MediaValidationResult {
	valid: boolean;
	error?: string;
	code?:
		| "FILE_TOO_LARGE"
		| "INVALID_DIMENSIONS"
		| "RATE_LIMIT_EXCEEDED"
		| "UNSUPPORTED_TYPE";
	shouldCompress?: boolean;
	suggestion?: string;
}

// Cache for Cloudinary limits (5 minutes)
let limitsCache: MediaLimits | null = null;
let limitsCacheTime: number = 0;
const LIMITS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and cache Cloudinary media limits
 */
async function fetchAndCacheMediaLimits(): Promise<MediaLimits> {
	const now = Date.now();

	// Return cached limits if still valid
	if (limitsCache && now - limitsCacheTime < LIMITS_CACHE_DURATION) {
		return limitsCache;
	}

	try {
		const usage = await getStorageUsage();
		limitsCache = {
			imageMaxSizeBytes: usage.usage.mediaLimits.imageMaxSizeBytes,
			videoMaxSizeBytes: usage.usage.mediaLimits.videoMaxSizeBytes,
			rawMaxSizeBytes: usage.usage.mediaLimits.rawMaxSizeBytes,
			imageMaxPx: usage.usage.mediaLimits.imageMaxPx,
			assetMaxTotalPx: usage.usage.mediaLimits.assetMaxTotalPx,
			rateLimitAllowed: usage.usage.rateLimitAllowed,
			rateLimitRemaining: usage.usage.rateLimitRemaining,
		};
		limitsCacheTime = now;
		console.log("[Limits] Fetched and cached media limits from Cloudinary");
		return limitsCache;
	} catch (error) {
		console.error("[Limits] Error fetching media limits:", error);
		// Fallback to hardcoded free tier limits
		return {
			imageMaxSizeBytes: 10 * 1024 * 1024, // 10MB
			videoMaxSizeBytes: 100 * 1024 * 1024, // 100MB
			rawMaxSizeBytes: 10 * 1024 * 1024, // 10MB
			imageMaxPx: 25000000, // 25M px
			assetMaxTotalPx: 50000000, // 50M px
			rateLimitAllowed: 500,
			rateLimitRemaining: 500,
		};
	}
}

/**
 * Get available image dimensions from buffer metadata
 * Uses image-size library to detect dimensions without loading full buffer
 */
async function getImageDimensions(
	buffer: Buffer,
): Promise<{ width: number; height: number } | null> {
	try {
		// Using a simple approach: parse JPEG/PNG/GIF headers
		// This is a lightweight check without full image decoding
		const header = buffer.slice(0, 12);

		// JPEG: FF D8 FF
		if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
			// For JPEG, check SOF marker for dimensions
			// This is a simplified check - read actual dimension from buffer
			let i = 2;
			while (i < Math.min(buffer.length, 100000)) {
				if (
					buffer[i] === 0xff &&
					(buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc1) &&
					i + 8 < buffer.length
				) {
					const height = (buffer[i + 5]! << 8) | buffer[i + 6]!;
					const width = (buffer[i + 7]! << 8) | buffer[i + 8]!;
					return { width, height };
				}
				i++;
			}
		}

		// PNG: 89 50 4E 47
		if (
			header[0] === 0x89 &&
			header[1] === 0x50 &&
			header[2] === 0x4e &&
			header[3] === 0x47
		) {
			const width = buffer.readUInt32BE(16);
			const height = buffer.readUInt32BE(20);
			return { width, height };
		}

		// GIF: 47 49 46
		if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
			const width = buffer.readUInt16LE(6);
			const height = buffer.readUInt16LE(8);
			return { width, height };
		}

		return null;
	} catch (error) {
		console.error("[Limits] Error parsing image dimensions:", error);
		return null;
	}
}

/**
 * Validate media file against Cloudinary limits
 */
export async function validateMediaFile(
	file: File | { buffer: Buffer; type: string; name: string },
	mediaType: "image" | "video",
): Promise<MediaValidationResult> {
	try {
		const limits = await fetchAndCacheMediaLimits();

		// Get file size
		const fileSize = file instanceof File ? file.size : file.buffer.byteLength;
		const fileName = file instanceof File ? file.name : file.name;
		const mimeType = file instanceof File ? file.type : file.type;

		// Check file type
		const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
		const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm"];
		const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

		if (!allowedTypes.includes(mimeType)) {
			return {
				valid: false,
				error: "Unsupported file type",
				code: "UNSUPPORTED_TYPE",
				suggestion: `Supported types: JPEG, PNG, GIF (images) or MP4, MOV, WebM (videos)`,
			};
		}

		// Check rate limit
		if (limits.rateLimitRemaining < 10) {
			return {
				valid: false,
				error: "Rate limit nearly exceeded",
				code: "RATE_LIMIT_EXCEEDED",
				suggestion: "Try again in a few minutes",
			};
		}

		// Image-specific validation
		if (mediaType === "image") {
			const maxImageSize = limits.imageMaxSizeBytes;

			// Check file size - if over 10MB, mark for compression
			if (fileSize > maxImageSize) {
				return {
					valid: false,
					error: `Image too large (max ${maxImageSize / (1024 * 1024)}MB, got ${(fileSize / (1024 * 1024)).toFixed(2)}MB)`,
					code: "FILE_TOO_LARGE",
					shouldCompress: true,
					suggestion: `Image will be automatically compressed to under ${maxImageSize / (1024 * 1024)}MB`,
				};
			}

			// Check image dimensions if buffer available
			try {
				const buffer =
					file instanceof File
						? Buffer.from(await file.arrayBuffer())
						: file.buffer;
				const dimensions = await getImageDimensions(buffer);

				if (dimensions) {
					const totalPx = dimensions.width * dimensions.height;

					if (dimensions.width > limits.imageMaxPx) {
						return {
							valid: false,
							error: `Image width exceeds limit (${dimensions.width}px > ${limits.imageMaxPx}px)`,
							code: "INVALID_DIMENSIONS",
						};
					}

					if (dimensions.height > limits.imageMaxPx) {
						return {
							valid: false,
							error: `Image height exceeds limit (${dimensions.height}px > ${limits.imageMaxPx}px)`,
							code: "INVALID_DIMENSIONS",
						};
					}

					if (totalPx > limits.assetMaxTotalPx) {
						return {
							valid: false,
							error: `Image total pixels exceed limit (${totalPx}px > ${limits.assetMaxTotalPx}px)`,
							code: "INVALID_DIMENSIONS",
							suggestion: "Consider uploading at lower resolution",
						};
					}
				}
			} catch (error) {
				// If dimension check fails, just log and continue with size check
				console.warn(
					"[Limits] Could not validate image dimensions, continuing with size check",
				);
			}
		}

		// Video-specific validation
		if (mediaType === "video") {
			const maxVideoSize = limits.videoMaxSizeBytes;

			if (fileSize > maxVideoSize) {
				return {
					valid: false,
					error: `Video too large (max ${maxVideoSize / (1024 * 1024)}MB, got ${(fileSize / (1024 * 1024)).toFixed(2)}MB)`,
					code: "FILE_TOO_LARGE",
					suggestion: "Consider compressing the video or reducing resolution",
				};
			}
		}

		return {
			valid: true,
		};
	} catch (error) {
		console.error("[Limits] Validation error:", error);
		return {
			valid: false,
			error: "Validation failed",
		};
	}
}

/**
 * Get current media limits and rate limit status
 */
export async function getMediaLimits(): Promise<MediaLimits> {
	return fetchAndCacheMediaLimits();
}

/**
 * Clear the limits cache (useful for testing)
 */
export function clearLimitsCache(): void {
	limitsCache = null;
	limitsCacheTime = 0;
}

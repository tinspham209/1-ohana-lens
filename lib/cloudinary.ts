import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
	url: string;
	publicId: string;
	format: string;
	size: number;
}

const FOLDER_NAME = process.env.CLOUDINARY_FOLDER_NAME;

/**
 * Upload a file to Cloudinary with automatic optimization
 * @param file - File buffer or base64 string
 * @param folderId - Folder ID to organize files
 * @returns Upload result with URL and public ID
 */
export async function uploadToCloudinary(
	fileBuffer: Buffer,
	folderId: string,
	fileName: string,
	mediaType: "image" | "video",
): Promise<UploadResult> {
	const isVideo = mediaType === "video";
	const baseOptions = {
		folder: `${FOLDER_NAME}/folder-${folderId}`,
		resource_type: isVideo ? ("video" as const) : ("image" as const),
		public_id: fileName.split(".")[0],
	};

	const imageOptions = {
		eager: [
			// Pre-generate optimized delivery format at upload time
			{ width: 1000, crop: "fit", quality: 80 },
		],
		flags: ["progressive"],
		quality: 80,
	};

	const videoOptions = {
		flags: [],
	};

	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				...baseOptions,
				...(isVideo ? videoOptions : imageOptions),
			} as any,
			(error, result) => {
				if (error) {
					console.error("[Cloudinary] Upload error:", error);
					reject(error);
				} else if (result) {
					resolve({
						url: result.secure_url,
						publicId: result.public_id,
						format: result.format,
						size: result.bytes,
					});
				}
			},
		);

		uploadStream.end(fileBuffer);
	});
}

/**
 * Delete a single file from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
	try {
		await cloudinary.uploader.destroy(publicId, {
			invalidate: true,
		});
		console.log(`[Cloudinary] Deleted file: ${publicId}`);
	} catch (error) {
		console.error("[Cloudinary] Delete error:", error);
		throw error;
	}
}

/**
 * Delete all files in a folder
 * @param folderPath - Path to the folder in Cloudinary
 */
export async function deleteFolder(folderPath: string): Promise<number> {
	try {
		// Delete all resources by prefix
		const result = await cloudinary.api.delete_resources_by_prefix(folderPath, {
			invalidate: true,
		});

		// Delete the folder itself
		await cloudinary.api.delete_folder(folderPath);

		console.log(`[Cloudinary] Deleted folder: ${folderPath}`);
		return Object.keys(result.deleted).length;
	} catch (error) {
		console.error("[Cloudinary] Delete folder error:", error);
		throw error;
	}
}

/**
 * Get storage usage statistics
 * @returns Storage usage information
 */
export async function getStorageUsage(): Promise<{
	usedBytes: number;
	usedGB: number;
	totalGB: number;
	percentageUsed: number;
	usage: {
		plan: string;
		lastUpdated: string;
		dateRequested: string;
		transformationsUsage: number;
		transformationsCreditsUsage: number;
		transformationsBreakdown?: Record<string, number>;
		objectsUsage: number;
		bandwidthUsageBytes: number;
		bandwidthCreditsUsage: number;
		storageUsageBytes: number;
		storageCreditsUsage: number;
		impressionsUsage: number;
		impressionsCreditsUsage: number;
		secondsDeliveredUsage: number;
		secondsDeliveredCreditsUsage: number;
		creditsUsage: number;
		creditsLimit: number;
		creditsUsedPercent: number;
		resources: number;
		derivedResources: number;
		requests: number;
		mediaLimits: {
			imageMaxSizeBytes: number;
			videoMaxSizeBytes: number;
			rawMaxSizeBytes: number;
			imageMaxPx: number;
			assetMaxTotalPx: number;
		};
		rateLimitAllowed: number;
		rateLimitRemaining: number;
		rateLimitResetAt: string;
	};
}> {
	try {
		const usage = await cloudinary.api.usage();
		console.log("usage: ", usage);

		const usedBytes = usage?.storage?.usage ?? 0;
		const usedGB = usedBytes / (1024 * 1024 * 1024);
		const totalGB = 25; // Free tier limit
		const percentageUsed = (usedGB / totalGB) * 100;

		return {
			usedBytes,
			usedGB: Math.round(usedGB * 100) / 100,
			totalGB,
			percentageUsed: Math.round(percentageUsed * 100) / 100,
			usage: {
				plan: usage?.plan ?? "Unknown",
				lastUpdated: usage?.last_updated ?? "",
				dateRequested: usage?.date_requested ?? "",
				transformationsUsage: usage?.transformations?.usage ?? 0,
				transformationsCreditsUsage: usage?.transformations?.credits_usage ?? 0,
				transformationsBreakdown:
					usage?.transformations?.breakdown ?? undefined,
				objectsUsage: usage?.objects?.usage ?? 0,
				bandwidthUsageBytes: usage?.bandwidth?.usage ?? 0,
				bandwidthCreditsUsage: usage?.bandwidth?.credits_usage ?? 0,
				storageUsageBytes: usage?.storage?.usage ?? 0,
				storageCreditsUsage: usage?.storage?.credits_usage ?? 0,
				impressionsUsage: usage?.impressions?.usage ?? 0,
				impressionsCreditsUsage: usage?.impressions?.credits_usage ?? 0,
				secondsDeliveredUsage: usage?.seconds_delivered?.usage ?? 0,
				secondsDeliveredCreditsUsage:
					usage?.seconds_delivered?.credits_usage ?? 0,
				creditsUsage: usage?.credits?.usage ?? 0,
				creditsLimit: usage?.credits?.limit ?? 0,
				creditsUsedPercent: usage?.credits?.used_percent ?? 0,
				resources: usage?.resources ?? 0,
				derivedResources: usage?.derived_resources ?? 0,
				requests: usage?.requests ?? 0,
				mediaLimits: {
					imageMaxSizeBytes: usage?.media_limits?.image_max_size_bytes ?? 0,
					videoMaxSizeBytes: usage?.media_limits?.video_max_size_bytes ?? 0,
					rawMaxSizeBytes: usage?.media_limits?.raw_max_size_bytes ?? 0,
					imageMaxPx: usage?.media_limits?.image_max_px ?? 0,
					assetMaxTotalPx: usage?.media_limits?.asset_max_total_px ?? 0,
				},
				rateLimitAllowed: usage?.rate_limit_allowed ?? 0,
				rateLimitRemaining: usage?.rate_limit_remaining ?? 0,
				rateLimitResetAt: usage?.rate_limit_reset_at ?? "",
			},
		};
	} catch (error) {
		console.error("[Cloudinary] Get usage error:", error);
		throw error;
	}
}

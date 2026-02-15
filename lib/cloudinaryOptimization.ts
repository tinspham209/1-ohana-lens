/**
 * Cloudinary URL optimization utilities to reduce credit usage
 * Optimizations target: image transformations, auto-format, auto-quality, responsive delivery
 */

export interface CloudinaryOptimizationOptions {
	width?: number;
	height?: number;
	quality?: "auto" | "eco" | number; // auto, eco (lowest quality), or 1-100
	format?: "auto" | "webp" | "jpg" | "png"; // auto for best format
	crop?: "fill" | "fit" | "thumb" | "crop";
	gravity?: "auto" | "face" | "center"; // auto detects faces
	removeBackground?: boolean;
	effect?: string;
}

/**
 * Build optimized Cloudinary URL with transformations
 * Uses auto-format (f_auto) and auto-quality (q_auto) to minimize bandwidth
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 * @returns Optimized URL
 */
export function buildOptimizedUrl(
	url: string,
	options: CloudinaryOptimizationOptions = {},
): string {
	if (!url || !url.includes("cloudinary.com")) {
		return url;
	}

	const {
		width,
		height,
		quality = "auto",
		format = "auto",
		crop = "fill",
		gravity = "auto",
	} = options;

	const transformations: string[] = [];

	// Build transformation string
	if (width || height) {
		let transform = "";
		if (width) transform += `w_${width},`;
		if (height) transform += `h_${height},`;
		transform += `c_${crop},`;
		if ((width || height) && crop !== "fit") transform += `g_${gravity},`;
		transformations.push(transform);
	}

	// Auto format and quality (massive credit saver)
	let optimize = "";
	if (format === "auto") optimize += "f_auto,";
	if (quality === "auto") optimize += "q_auto,";
	if (quality === "eco") optimize += "q_auto:eco,"; // Lowest quality (saves most credits)
	if (typeof quality === "number") optimize += `q_${quality},`;
	const optimizedTransform = optimize.replace(/,$/, "");
	if (optimizedTransform) {
		transformations.push(optimizedTransform);
	}

	// Insert transformations into URL
	if (transformations.length === 0) return url;

	const transformation = transformations
		.map((t) => t.replace(/,$/, ""))
		.join("/");
	return url.replace("/upload/", `/upload/${transformation}/`);
}

/**
 * Get thumbnail URL with aggressive optimization
 * Max 400x400, aggressive compression
 * @param url - Original URL
 * @returns Optimized thumbnail URL
 */
export function getThumbnailUrl(url: string): string {
	return buildOptimizedUrl(url, {
		width: 400,
		height: 400,
		crop: "fill",
		quality: "auto",
		format: "auto",
	});
}

/**
 * Get preview URL for lightbox/modal (medium size)
 * Max 1000x1000 with good balance of quality
 * @param url - Original URL
 * @returns Optimized preview URL
 */
export function getPreviewUrl(url: string): string {
	return buildOptimizedUrl(url, {
		width: 1000,
		height: 1000,
		crop: "fit",
		quality: "auto",
		format: "auto",
	});
}

/**
 * Get responsive image srcset for adaptive delivery
 * Returns multiple sizes for different screen widths
 * Browser will request the most appropriate size
 * @param url - Original URL
 * @returns srcset string for img tag
 */
export function getResponsiveSrcSet(url: string): string {
	if (!url || !url.includes("cloudinary.com")) return url;

	const sizes = [
		{ width: 300, descriptor: "300w" },
		{ width: 600, descriptor: "600w" },
		{ width: 900, descriptor: "900w" },
		{ width: 1200, descriptor: "1200w" },
	];

	return sizes
		.map((size) => {
			const optimizedUrl = buildOptimizedUrl(url, {
				width: size.width,
				crop: "fit",
				quality: "auto",
				format: "auto",
			});
			return `${optimizedUrl} ${size.descriptor}`;
		})
		.join(", ");
}

/**
 * Get poster frame from video for thumbnail
 * Extracts first frame at low quality
 * @param url - Cloudinary video URL
 * @returns Optimized poster URL
 */
export function getVideoPosterUrl(url: string): string {
	if (!url || !url.includes("cloudinary.com")) return url;

	// Extract a poster frame from the start of the video and force image output
	const posterTransform = "so_0,w_400,h_400,c_fill,q_auto:eco,f_jpg";
	return url.replace("/upload/", `/upload/${posterTransform}/`);
}

/**
 * Get full-resolution URL for download
 * Minimal transformations, preserve quality but use auto-format
 * @param url - Original URL
 * @returns URL for download (minimal compression)
 */
export function getDownloadUrl(url: string): string {
	return buildOptimizedUrl(url, {
		quality: 95, // High quality for downloads
		format: "auto",
	});
}

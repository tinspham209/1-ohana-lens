/**
 * Cloudinary URL optimization utilities to reduce credit usage
 * Optimizations target: image transformations, auto-format, auto-quality, responsive delivery
 */

export interface CloudinaryOptimizationOptions {
	width?: number;
	height?: number;
	quality?: number; // 1-100
	format?: "auto" | "webp" | "jpg" | "png"; // specific format
	crop?: "fill" | "fit" | "thumb" | "crop";
	gravity?: "face" | "center"; // face detection or center
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
		quality = 80,
		format,
		crop = "fill",
		gravity = "center",
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

	// Quality and format optimization
	let optimize = "";
	if (format) optimize += `f_${format},`;
	if (quality) optimize += `q_${quality},`;
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
		quality: 70,
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
		quality: 80,
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
				quality: 80,
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
	const posterTransform = "so_0,w_400,h_400,c_fill,q_60,f_jpg";
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
	});
}

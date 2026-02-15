/**
 * Utility functions for common operations
 */

/**
 * Get the base URL for the application
 * Works in both client and server environments
 */
export function getBaseUrl(): string {
	if (typeof window !== "undefined") {
		// Client-side
		return window.location.origin;
	}

	// Server-side
	const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
	const host = process.env.VERCEL_URL || "localhost:3000";
	return `${protocol}://${host}`;
}

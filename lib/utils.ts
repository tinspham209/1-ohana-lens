/**
 * Utility functions for common operations
 */

/**
 * Get the base URL for the application
 * Works in both client and server environments
 * Priority: NEXT_PUBLIC_URL > VERCEL_URL > localhost
 */
export function getBaseUrl(): string {
	if (typeof window !== "undefined") {
		// Client-side
		return window.location.origin;
	}

	// Server-side
	// 1. Check for explicit public URL (preferred for production)
	if (process.env.NEXT_PUBLIC_URL) {
		return process.env.NEXT_PUBLIC_URL;
	}

	// 2. Use Vercel URL if available
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}

	// 3. Fallback to localhost for development
	return "http://localhost:3000";
}

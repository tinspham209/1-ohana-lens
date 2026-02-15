/**
 * Format bytes into human-readable size with appropriate units
 * @param bytes - The number of bytes to format
 * @returns Formatted string with appropriate unit (B, KB, MB, GB)
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";

	const KB = 1024;
	const MB = KB * 1024;
	const GB = MB * 1024;

	if (bytes < KB) {
		return `${bytes} B`;
	} else if (bytes < MB) {
		return `${(bytes / KB).toFixed(2)} KB`;
	} else if (bytes < GB) {
		return `${(bytes / MB).toFixed(2)} MB`;
	} else {
		return `${(bytes / GB).toFixed(2)} GB`;
	}
}

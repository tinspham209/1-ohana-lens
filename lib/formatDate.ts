/**
 * Format a date string or Date object into a readable format
 * @param date - ISO string, timestamp, or Date object
 * @param format - Output format (default: "DD/MMM/YYYY HH:mm")
 * @returns Formatted date string or "-" if invalid
 */
export function formatDate(
	date: string | number | Date | null | undefined,
	format: string = "DD/MMM/YYYY HH:mm",
): string {
	if (!date) return "-";

	try {
		const dateObj = new Date(date);

		// Check if date is valid
		if (isNaN(dateObj.getTime())) return "-";

		const day = String(dateObj.getDate()).padStart(2, "0");
		const month = dateObj.toLocaleDateString("en-GB", { month: "short" });
		const year = dateObj.getFullYear();
		const hours = String(dateObj.getHours()).padStart(2, "0");
		const minutes = String(dateObj.getMinutes()).padStart(2, "0");
		const seconds = String(dateObj.getSeconds()).padStart(2, "0");

		// Replace format placeholders
		return format
			.replace("DD", day)
			.replace("MMM", month)
			.replace("YYYY", String(year))
			.replace("HH", hours)
			.replace("mm", minutes)
			.replace("ss", seconds);
	} catch (error) {
		console.error("Error formatting date:", error);
		return "-";
	}
}

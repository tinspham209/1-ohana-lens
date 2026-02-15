import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/swagger";

export async function GET() {
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json(
			{ error: "Not found", code: "NOT_FOUND" },
			{ status: 404 },
		);
	}

	const spec = getApiDocs();

	return NextResponse.json(spec, {
		headers: {
			"Cache-Control": "no-store",
		},
	});
}

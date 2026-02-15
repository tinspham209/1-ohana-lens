import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = new Set([25, 50, 100]);
const ALLOWED_SORT_FIELDS = new Set(["createdAt", "action"]);

export async function GET(request: NextRequest) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED", ok: false },
				{ status: 401 },
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const pageParam = Number(searchParams.get("page"));
		const pageSizeParam = Number(searchParams.get("pageSize"));
		const sortFieldParam = searchParams.get("sortField") || "createdAt";
		const sortOrderParam = searchParams.get("sortOrder") || "desc";

		const page =
			Number.isFinite(pageParam) && pageParam > 0 ? pageParam : DEFAULT_PAGE;
		const pageSize = ALLOWED_PAGE_SIZES.has(pageSizeParam)
			? pageSizeParam
			: DEFAULT_PAGE_SIZE;
		const sortField = ALLOWED_SORT_FIELDS.has(sortFieldParam)
			? sortFieldParam
			: "createdAt";
		const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

		const skip = (page - 1) * pageSize;

		const [total, items] = await Promise.all([
			prisma.accessLog.count(),
			prisma.accessLog.findMany({
				orderBy: { [sortField]: sortOrder },
				skip,
				take: pageSize,
				select: {
					id: true,
					action: true,
					ipAddress: true,
					userAgent: true,
					createdAt: true,
					admin: {
						select: {
							id: true,
							username: true,
						},
					},
					folder: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			}),
		]);

		return NextResponse.json({
			ok: true,
			data: {
				items,
				total,
				page,
				pageSize,
			},
		});
	} catch (error) {
		console.error("[API] List access logs error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR", ok: false },
			{ status: 500 },
		);
	}
}

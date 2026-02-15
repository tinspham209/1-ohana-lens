import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/admin-list:
 *   get:
 *     summary: List admins
 *     description: Get all admin profiles with pagination and sorting (admin only)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *           enum: [25, 50, 100]
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [createdAt, username, email, lastLogin]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of admins with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 admins:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                       lastLogin:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
	try {
		const token = request.headers.get("Authorization")?.split(" ")[1];
		const admin = await verifyAdminToken(token);

		if (!admin) {
			return NextResponse.json(
				{ error: "Unauthorized", code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "25");
		const sortBy = searchParams.get("sortBy") || "createdAt";
		const order = searchParams.get("order") || "desc";

		// Validate parameters
		const validSortFields = ["createdAt", "username", "email", "lastLogin"];
		const validOrders = ["asc", "desc"];
		const validLimits = [25, 50, 100];

		if (!validSortFields.includes(sortBy)) {
			return NextResponse.json(
				{ error: "Invalid sortBy field", code: "INVALID_SORT_FIELD" },
				{ status: 400 },
			);
		}

		if (!validOrders.includes(order)) {
			return NextResponse.json(
				{ error: "Invalid order", code: "INVALID_ORDER" },
				{ status: 400 },
			);
		}

		if (!validLimits.includes(limit)) {
			return NextResponse.json(
				{ error: "Invalid limit", code: "INVALID_LIMIT" },
				{ status: 400 },
			);
		}

		// Calculate pagination
		const skip = (page - 1) * limit;

		// Get total count
		const total = await prisma.adminUser.count();

		// Fetch admins with pagination and sorting
		const admins = await prisma.adminUser.findMany({
			skip,
			take: limit,
			orderBy: { [sortBy]: order },
			select: {
				id: true,
				username: true,
				email: true,
				isActive: true,
				createdAt: true,
				lastLogin: true,
			},
		});

		return NextResponse.json({
			admins,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[API] Admin list error:", error);
		return NextResponse.json(
			{ error: "Internal server error", code: "SERVER_ERROR" },
			{ status: 500 },
		);
	}
}

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_production";
const TOKEN_EXPIRY = "7d"; // 7 days

// Password hashing
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function comparePassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

// JWT token generation for admins
export function generateAdminToken(adminId: string): string {
	return jwt.sign({ adminId, type: "admin" }, JWT_SECRET, {
		expiresIn: TOKEN_EXPIRY,
	});
}

// JWT token generation for folder access (members)
export function generateFolderToken(folderId: string): string {
	return jwt.sign({ folderId, type: "folder" }, JWT_SECRET, {
		expiresIn: TOKEN_EXPIRY,
	});
}

// Verify admin token
export async function verifyAdminToken(
	token: string | null | undefined,
): Promise<{ adminId: string } | null> {
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as {
			adminId: string;
			type: string;
		};

		if (decoded.type !== "admin") return null;

		// Check if admin exists and is active
		const admin = await prisma.adminUser.findUnique({
			where: { id: decoded.adminId },
			select: { id: true, isActive: true },
		});

		if (!admin || !admin.isActive) return null;

		return { adminId: admin.id };
	} catch (error) {
		return null;
	}
}

// Verify folder token
export async function verifyFolderToken(
	token: string | null | undefined,
): Promise<{ folderId: string } | null> {
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as {
			folderId: string;
			type: string;
		};

		if (decoded.type !== "folder") return null;

		// Check if folder exists
		const folder = await prisma.folder.findUnique({
			where: { id: decoded.folderId },
			select: { id: true },
		});

		if (!folder) return null;

		return { folderId: folder.id };
	} catch (error) {
		return null;
	}
}

// Generate random password for folders
export function generateFolderPassword(): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let password = "";
	for (let i = 0; i < 8; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
}

// Generate unique folder key
export function generateFolderKey(): string {
	return Math.random().toString(36).substring(2, 15);
}

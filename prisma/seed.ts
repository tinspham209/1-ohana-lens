import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hashPassword } from "../lib/auth";

// Create adapter for seed script
const adapter = new PrismaLibSql({
	url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("🌱 Seeding database...");

	// Create 1 admin users
	const admins = [
		{
			username: "admin1",
			email: "admin1@ohanalens.com",
			password: "Admin123!",
		},
	];

	for (const admin of admins) {
		const passwordHash = await hashPassword(admin.password);

		const existingAdmin = await prisma.adminUser.findUnique({
			where: { username: admin.username },
		});

		if (existingAdmin) {
			console.log(`⏭️  Admin ${admin.username} already exists, skipping...`);
			continue;
		}

		await prisma.adminUser.create({
			data: {
				username: admin.username,
				email: admin.email,
				passwordHash,
				isActive: true,
			},
		});

		console.log(`✅ Created admin: ${admin.username} (${admin.email})`);
	}

	console.log("🎉 Seeding completed!");
	console.log("\n📝 Admin Credentials (for development only):");
	console.log("Username: admin1 | Password: Admin123!");
	console.log("\n⚠️  Change these passwords in production!");
}

main()
	.catch((e) => {
		console.error("❌ Seeding error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

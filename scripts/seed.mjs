import { execSync } from "child_process";

try {
	console.log("Running seed script with ts-node...");
	execSync(
		'npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
		{
			stdio: "inherit",
		},
	);
} catch (error) {
	console.error("Seed script failed:", error);
	process.exit(1);
}

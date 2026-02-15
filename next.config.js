/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		// Ignore all TypeScript errors during build
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
		],
	},
};

module.exports = nextConfig;

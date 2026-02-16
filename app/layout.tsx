import type { Metadata } from "next";
import Script from "next/script";
import "swagger-ui-react/swagger-ui.css";
import MUIThemeProvider from "@/components/MUIThemeProvider";

export const metadata: Metadata = {
	title: "1 Ohana Lens - Run Club Media Gallery",
	description:
		"Secure media management and sharing for run club events. Upload, organize, and access photos and videos from your favorite runs.",
	icons: {
		icon: "/favicon.ico",
	},
	openGraph: {
		title: "1 Ohana Lens - Run Club Media Gallery",
		description:
			"Secure media management and sharing for run club events. Upload, organize, and access photos and videos from your favorite runs.",
		url: `${process.env.NEXT_PUBLIC_URL}`,
		type: "website",
		images: [
			{
				url: "/opengraph-image.webp",
				width: 1200,
				height: 630,
				alt: "1 Ohana Lens - Run Club Media Gallery",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "1 Ohana Lens - Run Club Media Gallery",
		description:
			"Secure media management and sharing for run club events. Upload, organize, and access photos and videos from your favorite runs.",
		images: ["/opengraph-image.webp"],
	},
	alternates: {
		canonical: `${process.env.NEXT_PUBLIC_URL}`,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/mcp/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
			<body>
				<MUIThemeProvider>{children}</MUIThemeProvider>
			</body>
		</html>
	);
}

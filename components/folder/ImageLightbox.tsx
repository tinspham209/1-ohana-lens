"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { getPreviewUrl, getDownloadUrl } from "@/lib/cloudinaryOptimization";

interface MediaItem {
	id: string;
	fileName: string;
	cloudinaryUrl: string;
	mediaType: string;
	fileSize: number;
	mimeType: string;
	uploadedAt: string;
}

interface ImageLightboxProps {
	images: MediaItem[];
	initialIndex: number;
	onClose: () => void;
}

export default function ImageLightbox({
	images,
	initialIndex,
	onClose,
}: ImageLightboxProps) {
	const [index, setIndex] = useState(initialIndex);

	// Map images to lightbox format with optimized URLs
	const lightboxImages = images.map((img) => ({
		src: getPreviewUrl(img.cloudinaryUrl),
		alt: img.fileName,
		title: img.fileName,
		download: {
			filename: img.fileName,
			url: getDownloadUrl(img.cloudinaryUrl),
		},
	}));

	return (
		<Lightbox
			slides={lightboxImages}
			open={true}
			index={index}
			close={onClose}
			on={{
				view: ({ index: currentIndex }) => setIndex(currentIndex),
			}}
			plugins={[Zoom, Download]}
			carousel={{
				preload: 2,
				finite: images.length <= 1,
			}}
			zoom={{
				maxZoomPixelRatio: 10,
				wheelZoomDistanceFactor: 100,
				doubleTapDelay: 300,
				doubleClickDelay: 300,
				doubleClickMaxStops: 2,
			}}
		/>
	);
}

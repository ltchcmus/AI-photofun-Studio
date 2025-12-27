import React, { useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";

/**
 * ImageLightbox - A reusable component for viewing images in fullscreen with zoom
 * Can be used in ChatBot, PostCard, and other components
 */
const ImageLightbox = ({
    isOpen,
    onClose,
    imageUrl,
    alt = "Image",
    showDownload = true
}) => {
    const [scale, setScale] = React.useState(1);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "+" || e.key === "=") handleZoomIn();
            if (e.key === "-") handleZoomOut();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const handleZoomIn = useCallback(() => {
        setScale((prev) => Math.min(prev + 0.5, 4));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale((prev) => {
            const newScale = Math.max(prev - 0.5, 0.5);
            if (newScale === 1) setPosition({ x: 0, y: 0 });
            return newScale;
        });
    }, []);

    const handleDownload = useCallback(() => {
        if (!imageUrl) return;
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `image-${Date.now()}.jpg`;
        link.click();
    }, [imageUrl]);

    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomOut();
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    title="Zoom out (-)"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomIn();
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    title="Zoom in (+)"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                {showDownload && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors ml-2"
                        title="Download"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors ml-2"
                    title="Close (ESC)"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Image */}
            <div
                className="max-w-[90vw] max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <img
                    src={imageUrl}
                    alt={alt}
                    className="max-w-full max-h-[90vh] object-contain transition-transform duration-200"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                    }}
                    draggable={false}
                />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs text-center">
                Scroll để zoom • Kéo để di chuyển • ESC để đóng
            </div>
        </div>
    );
};

export default ImageLightbox;

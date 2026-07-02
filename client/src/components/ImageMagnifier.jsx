import { useState, useRef } from "react";

function ImageMagnifier({
  src,
  alt,
  zoom = 2.5,
  lensSize = 180,
}) {
  const imgRef = useRef(null);

  const [showZoom, setShowZoom] = useState(false);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleMove = (e) => {
    const img = imgRef.current;

    if (!img) return;

    const rect = img.getBoundingClientRect();

    const x = Math.max(
        lensSize / 2,
        Math.min(e.clientX - rect.left, rect.width - lensSize / 2)
      );
      
      const y = Math.max(
        lensSize / 2,
        Math.min(e.clientY - rect.top, rect.height - lensSize / 2)
      );
      
      setPosition({ x, y });
  };

  return (
    <div className="flex gap-8 items-start">

      {/* IMAGE */}

      <div
        className="relative overflow-hidden rounded-3xl border bg-white"
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMove}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          className="block w-full rounded-3xl select-none"
        />

        {showZoom && (
          <div
            className="absolute border-2 border-pink-500 bg-white/30 pointer-events-none"
            style={{
              width: lensSize,
              height: lensSize,
              left: position.x - lensSize / 2,
              top: position.y - lensSize / 2,
            }}
          />
        )}
      </div>

      {/* ZOOM WINDOW */}

      {showZoom && imgRef.current && (
        <div
          className="hidden lg:block border rounded-3xl overflow-hidden shadow-xl bg-white"
          style={{
            width: 550,
            height: 550,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",

              backgroundImage: `url(${src})`,
              backgroundRepeat: "no-repeat",

              backgroundSize: `${
                imgRef.current.naturalWidth * zoom
              }px ${
                imgRef.current.naturalHeight * zoom
              }px`,

              backgroundPosition: `${
                -(position.x * zoom - 550 / 2)
              }px ${
                -(position.y * zoom - 550 / 2)
              }px`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ImageMagnifier;
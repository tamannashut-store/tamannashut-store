import { useRef } from "react";

export default function ImageMagnifier({
  src,
  alt,
  zoom = 3,
  lensSize = 160,
}) {
  const imageRef = useRef(null);
  const lensRef = useRef(null);
  const zoomRef = useRef(null);

  const handleEnter = () => {
    lensRef.current.style.display = "block";
    zoomRef.current.style.display = "block";
  };

  const handleLeave = () => {
    lensRef.current.style.display = "none";
    zoomRef.current.style.display = "none";
  };

  const handleMove = (e) => {
    const img = imageRef.current;
    const lens = lensRef.current;
    const zoomBox = zoomRef.current;

    if (!img) return;

    const rect = img.getBoundingClientRect();

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const half = lensSize / 2;

    x = Math.max(half, Math.min(x, rect.width - half));
    y = Math.max(half, Math.min(y, rect.height - half));

    lens.style.transform = `translate(${x - half}px, ${y - half}px)`;

    zoomBox.style.backgroundImage = `url(${src})`;
    zoomBox.style.backgroundRepeat = "no-repeat";

    zoomBox.style.backgroundSize = `${rect.width * zoom}px ${
      rect.height * zoom
    }px`;

    const bgX = x * zoom;
    const bgY = y * zoom;

    const zoomWidth = zoomBox.offsetWidth;
    const zoomHeight = zoomBox.offsetHeight;

    zoomBox.style.backgroundPosition = `${
      -(bgX - zoomWidth / 2)
    }px ${-(bgY - zoomHeight / 2)}px`;
  };

  return (
    <div className="flex gap-8 items-start">
      <div
        className="relative"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMove}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          draggable={false}
          className="w-[450px] rounded-xl select-none block"
        />

        <div
          ref={lensRef}
          style={{
            width: lensSize,
            height: lensSize,
            display: "none",
          }}
          className="
            absolute
            top-0
            left-0
            pointer-events-none
            border
            border-gray-400
            bg-black/10
            backdrop-blur-[1px]
            shadow-lg
          "
        />
      </div>

      <div
        ref={zoomRef}
        style={{
          width: 550,
          height: 550,
          display: "none",
        }}
        className="
          hidden
          lg:block
          overflow-hidden
          rounded-xl
          border
          shadow-2xl
          bg-white
        "
      />
    </div>
  );
}
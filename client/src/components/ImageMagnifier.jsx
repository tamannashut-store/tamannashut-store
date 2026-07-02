import { useRef } from "react";

export default function ImageMagnifier({
  src,
  alt,
  zoom = 2.8,
  lensSize = 180,
}) {
  const imageRef = useRef(null);
  const lensRef = useRef(null);
  const zoomRef = useRef(null);
  const zoomImageRef = useRef(null);

  const show = () => {
    lensRef.current.style.opacity = "1";
    zoomRef.current.style.opacity = "1";
    zoomRef.current.style.visibility = "visible";
  };

  const hide = () => {
    lensRef.current.style.opacity = "0";
    zoomRef.current.style.opacity = "0";
    zoomRef.current.style.visibility = "hidden";
  };

  const move = (e) => {
    const img = imageRef.current;
    const lens = lensRef.current;
    const zoomBox = zoomRef.current;
    const zoomImg = zoomImageRef.current;

    if (!img) return;

    const rect = img.getBoundingClientRect();

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const half = lensSize / 2;

    x = Math.max(half, Math.min(rect.width - half, x));
    y = Math.max(half, Math.min(rect.height - half, y));

    lens.style.transform = `translate(${x - half}px, ${y - half}px)`;

    const zoomWidth = zoomBox.clientWidth;
    const zoomHeight = zoomBox.clientHeight;

    const bigWidth = rect.width * zoom;
    const bigHeight = rect.height * zoom;

    zoomImg.style.width = `${bigWidth}px`;
    zoomImg.style.height = `${bigHeight}px`;

    const tx = -(x * zoom - zoomWidth / 2);
    const ty = -(y * zoom - zoomHeight / 2);

    zoomImg.style.transform = `translate(${tx}px, ${ty}px)`;
  };

  return (
    <div className="flex gap-10 items-start">
      <div
        className="relative select-none"
        onMouseEnter={show}
        onMouseLeave={hide}
        onMouseMove={move}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          draggable={false}
          className="w-full max-w-[520px] rounded-xl block"
        />

        <div
          ref={lensRef}
          style={{
            width: lensSize,
            height: lensSize,
            opacity: 0,
          }}
          className="
          absolute
          left-0
          top-0
          pointer-events-none
          border
          border-gray-400
          bg-white/20
          backdrop-blur-[1px]
          shadow-lg
          transition-opacity
          duration-150
        "
        />
      </div>

      <div
        ref={zoomRef}
        style={{
          width: 560,
          height: 560,
          opacity: 0,
          visibility: "hidden",
        }}
        className="
          hidden
          lg:flex
          overflow-hidden
          rounded-xl
          border
          bg-white
          shadow-2xl
          relative
          transition-opacity
          duration-150
        "
      >
        <img
          ref={zoomImageRef}
          src={src}
          alt=""
          draggable={false}
          className="
            absolute
            left-0
            top-0
            max-w-none
            select-none
            will-change-transform
          "
        />
      </div>
    </div>
  );
}
import { useRef } from "react";

function ImageMagnifier({
    src,
    alt,
    zoom = 2.5,
    lensSize = 180,
}) {

    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const lensRef = useRef(null);

    const zoomRef = useRef(null);

    const handleMouseEnter = () => {

        lensRef.current.style.display = "block";
        zoomRef.current.style.display = "block";

    };

    const handleMouseLeave = () => {

        lensRef.current.style.display = "none";
        zoomRef.current.style.display = "none";

    };

    const handleMouseMove = (e) => {

        const img = imageRef.current;

        const lens = lensRef.current;

        const zoomWindow = zoomRef.current;

        if (!img) return;

        const rect = img.getBoundingClientRect();

        let x = e.clientX - rect.left;

        let y = e.clientY - rect.top;

        const half = lensSize / 2;

        x = Math.max(half, Math.min(x, rect.width - half));

        y = Math.max(half, Math.min(y, rect.height - half));

        lens.style.left = `${x - half}px`;

        lens.style.top = `${y - half}px`;

        const bgX =
            (x / rect.width) * img.naturalWidth;

        const bgY =
            (y / rect.height) * img.naturalHeight;

        zoomWindow.style.backgroundPosition =
            `${-(bgX * zoom - 275)}px ${-(bgY * zoom - 275)}px`;

    };
    return (

        <div className="flex gap-8 items-start">

            <div

                ref={containerRef}

                className="relative overflow-hidden rounded-3xl"

                onMouseEnter={handleMouseEnter}

                onMouseLeave={handleMouseLeave}

                onMouseMove={handleMouseMove}

            >

                <img

                    ref={imageRef}

                    src={src}

                    alt={alt}

                    draggable={false}

                    className="block w-full rounded-3xl select-none"

                />

                <div

                    ref={lensRef}

                    style={{

                        display: "none",

                        width: lensSize,

                        height: lensSize,

                    }}

                    className="
                    absolute
                    border-2
                    border-pink-500
                    bg-white/20
                    pointer-events-none
                    shadow-xl
                    rounded-lg
                    backdrop-blur-[1px]
                    transition-none
                    "

                />

            </div>
            <div

ref={zoomRef}

style={{

    display: "none",

    width: 550,

    height: 550,

    backgroundImage: `url(${src})`,

    backgroundRepeat: "no-repeat",

    backgroundSize: `${imageRef.current?.naturalWidth * zoom || 0}px ${imageRef.current?.naturalHeight * zoom || 0}px`,

}}

className="
hidden
lg:block
rounded-3xl
border
shadow-2xl
bg-white
"

/>

</div>

);

}

export default ImageMagnifier;
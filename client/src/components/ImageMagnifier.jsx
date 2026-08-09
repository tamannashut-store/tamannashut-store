import { useState } from "react";

export default function ImageMagnifier({ src, alt, zoom = 2.2, className = "" }) {
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const move = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-100 ${className}`} onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)} onMouseMove={move}>
      <img src={src} alt={alt} draggable={false} style={{ transformOrigin: origin, transform: active ? `scale(${zoom})` : "scale(1)" }} className="block aspect-[4/5] w-full select-none object-cover transition-transform duration-150 ease-out" />
      <span className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white md:block">Hover to zoom</span>
    </div>
  );
}

export default function ImageVariantAssignment({ color, size, colors, variants, onChange }) {
  const sizes = [...new Set(variants.filter((variant) => !color || variant.color === color).map((variant) => variant.size).filter(Boolean))];

  return <div className="mt-2 grid gap-2">
    <select value={color} onChange={(event) => onChange({ color: event.target.value, size: "" })} className="field-control py-2 text-xs">
      <option value="">All colours / shared</option>
      {colors.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
    <select value={size} disabled={!color} onChange={(event) => onChange({ color, size: event.target.value })} className="field-control py-2 text-xs disabled:bg-slate-100 disabled:text-slate-400">
      <option value="">All sizes for this colour</option>
      {sizes.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  </div>;
}

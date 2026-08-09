import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const starterSizes = ["0-3M", "3-6M", "6-9M", "9-12M"];
const slug = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ColorVariantEditor({ variants, setVariants, baseSku, basePrice, onRenameColor }) {
  const [newColor, setNewColor] = useState("");
  const groups = useMemo(() => {
    const map = new Map();
    variants.forEach((variant, index) => {
      const color = String(variant.color || "Unassigned").trim() || "Unassigned";
      if (!map.has(color)) map.set(color, []);
      map.get(color).push({ variant, index });
    });
    return [...map.entries()];
  }, [variants]);

  const update = (index, field, value) => setVariants((current) => current.map((variant, itemIndex) => itemIndex === index ? { ...variant, [field]: field === "stock" ? Number(value) : value } : variant));
  const sizesToCopy = [...new Set((groups[0]?.[1] || []).map(({ variant }) => variant.size).filter(Boolean))];
  const addColor = () => {
    const color = newColor.trim();
    if (!color) return toast.error("Enter a colour name");
    if (groups.some(([name]) => name.toLowerCase() === color.toLowerCase())) return toast.error("This colour already exists");
    const sizes = sizesToCopy.length ? sizesToCopy : starterSizes;
    setVariants((current) => [...current, ...sizes.map((size) => ({ sku: "", size, color, price: basePrice, stock: 0, active: true }))]);
    setNewColor("");
  };
  const generateSkus = () => setVariants((current) => current.map((variant) => ({ ...variant, sku: `${slug(baseSku) || "PRODUCT"}-${slug(variant.color) || "STYLE"}-${slug(variant.size) || "SIZE"}` })));
  const rename = (oldColor, value) => {
    const color = value.trim();
    if (!color || color === oldColor) return;
    setVariants((current) => current.map((variant) => (variant.color || "Unassigned") === oldColor ? { ...variant, color } : variant));
    onRenameColor?.(oldColor, color);
  };

  return <section className="surface-card p-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="text-xl font-semibold">Colour styles and inventory</h2><p className="mt-1 text-sm text-slate-500">One listing can contain many colours. Each colour has its own size, SKU, price, stock and photos.</p></div><button type="button" onClick={generateSkus} className="btn-secondary shrink-0 text-sm">Generate all SKUs</button></div>
    <div className="mt-5 flex gap-2 rounded-xl bg-slate-50 p-3"><input value={newColor} onChange={(event) => setNewColor(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addColor(); } }} placeholder="Add another colour, e.g. Maroon" className="field-control"/><button type="button" onClick={addColor} className="btn-primary shrink-0">+ Add colour</button></div>
    <div className="mt-6 space-y-5">{groups.map(([color, rows]) => <article key={color} className="overflow-hidden rounded-2xl border border-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#eef5f0] px-4 py-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border-4 border-white bg-[#397153] text-xs font-bold text-white">{color.slice(0,1).toUpperCase()}</span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colour style</p><input defaultValue={color === "Unassigned" ? "" : color} onBlur={(event) => rename(color, event.target.value)} className="mt-0.5 border-0 bg-transparent p-0 font-bold text-slate-900 focus:shadow-none" /></div></div><button type="button" onClick={() => { setVariants((current) => current.filter((variant) => (variant.color || "Unassigned") !== color)); }} className="text-xs font-semibold text-red-600">Remove colour</button></header>
      <div className="overflow-x-auto p-4"><table className="w-full min-w-[650px] text-sm"><thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3">Size</th><th>SKU</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>{rows.map(({ variant, index }) => <tr key={`${color}-${index}`} className="border-t"><td className="py-3 pr-2"><input value={variant.size} onChange={(event) => update(index, "size", event.target.value)} className="field-control py-2"/></td><td className="pr-2"><input value={variant.sku} onChange={(event) => update(index, "sku", event.target.value.toUpperCase())} className="field-control py-2 font-mono text-xs uppercase"/></td><td className="pr-2"><input type="number" min="0" value={variant.price ?? basePrice} onChange={(event) => update(index, "price", event.target.value)} className="field-control py-2"/></td><td className="pr-2"><input type="number" min="0" value={variant.stock} onChange={(event) => update(index, "stock", event.target.value)} className="field-control py-2"/></td><td><button type="button" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-red-600">Remove</button></td></tr>)}</tbody></table><button type="button" onClick={() => setVariants((current) => [...current, { sku: "", size: "", color: color === "Unassigned" ? "" : color, price: basePrice, stock: 0, active: true }])} className="mt-3 text-sm font-semibold text-[#397153]">+ Add size to {color}</button></div>
    </article>)}</div>
    {!groups.length && <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Add the first colour style to begin.</div>}
  </section>;
}

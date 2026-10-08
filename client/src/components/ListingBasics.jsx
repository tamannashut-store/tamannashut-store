import { FieldError } from "./ListingValidation";
import { CategoryField } from "./GeneralListingFields";

export default function ListingBasics({ form, onChange, editing = false, errors = {} }) {
  const apparel = /^(girls|boys|clothing|fashion|new-arrivals)$/.test(String(form.category).toLowerCase());
  const input = (name, label, props = {}, hint = "") => <label key={name} className={props.wide ? "md:col-span-2" : ""}><span className="field-label">{label}</span><input id={`listing-${name}`} aria-label={label} aria-invalid={Boolean(errors[name])} aria-describedby={[hint && `listing-${name}-hint`, errors[name] && `listing-${name}-error`].filter(Boolean).join(" ") || undefined} name={name} value={form[name]} onChange={onChange} className="field-control" {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== "wide"))}/>{hint && <span id={`listing-${name}-hint`} className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span>}<FieldError name={name} message={errors[name]}/></label>;
  return <section className="surface-card overflow-hidden" aria-label="Listing basics">
    <header className="border-b bg-slate-50/70 p-5 sm:p-6"><p className="eyebrow">Product essentials</p><h2 className="mt-2 text-xl font-semibold">Tell customers what you’re selling</h2><p className="mt-2 text-sm leading-6 text-slate-500">Start with a clear name and category. Required fields must be complete before publishing; save a private draft to finish later.</p></header>
    <div className="space-y-7 p-5 sm:p-6">
      <div><h3 className="font-semibold">Product identity</h3><div className="mt-4 grid gap-5 md:grid-cols-2">
        {input("name", editing ? "Name" : "Product name", { required: true, wide: true, placeholder: "Brand + product + key feature" }, "Use a specific title customers can recognise. Avoid promotional claims in the name.")}
        <CategoryField value={form.category} onChange={onChange} error={errors.category}/>
        {input("baseSku", "Base SKU", { required: true, placeholder: "TH-PRODUCT-001" }, "Your internal product reference. Individual options receive their own SKUs in the next step.")}
      </div></div>
      <div className="border-t pt-6"><h3 className="font-semibold">Price and classification</h3><p className="mt-1 text-xs leading-5 text-slate-500">Enter tax-inclusive prices. The MRP must be at least the selling price.</p><div className="mt-4 grid gap-5 md:grid-cols-2">
        {input("price", "Selling price (₹)", { required: true, type: "number", min: "0.01", step: "0.01" })}
        {input("mrp", "MRP (₹)", { required: true, type: "number", min: form.price || "0.01", step: "0.01" })}
        {input("hsnCode", "HSN code *", { required: true, inputMode: "numeric", pattern: "[0-9]{4,8}", placeholder: "4–8 digit product classification" }, "Use the exact HSN classification confirmed for this product.")}
      </div></div>
      <div className="border-t pt-6"><h3 className="font-semibold">Describe the product</h3><div className="mt-4 grid gap-5 md:grid-cols-2">
        {(apparel || form.fabric || form.ageGroup) && <>{input("fabric", "Fabric", { placeholder: "e.g. Cotton" })}{input("ageGroup", "Age group", { placeholder: "e.g. 0–12 months" })}</>}
        <label className="md:col-span-2"><span className="field-label">Description</span><textarea required aria-label="Description" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "listing-description-error" : undefined} rows="5" name="description" value={form.description} onChange={onChange} placeholder="Explain what it is, how it is used, and what customers should know before ordering." className="field-control"/><FieldError name="description" message={errors.description}/></label>
        {input("tags", "Tags", { wide: true, placeholder: "Separate search keywords with commas" }, "Use relevant product terms. Brand, specifications and parcel details follow below.")}
      </div></div>
    </div>
  </section>;
}

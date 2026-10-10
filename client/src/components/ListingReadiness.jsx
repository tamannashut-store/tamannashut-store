import { validateListing } from "../utils/listingValidation";

export default function ListingReadiness({ form, variants, imageCount, onEdit }) {
  const result = validateListing({ ...form, status: "active" }, variants, imageCount);
  const groups = [Object.values(result.fields), result.inventory, result.photos];
  const count = groups.reduce((total, messages) => total + messages.length, 0);
  return <section aria-live="polite" className={`mx-auto mb-6 max-w-5xl rounded-xl border p-5 ${count ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
    <h2 className="font-semibold">{count ? `${count} ${count === 1 ? "correction" : "corrections"} needed before publishing` : "Required listing details complete"}</h2>
    <p className="mt-2 text-sm">{count ? "This listing cannot go live until these details are corrected. You can still save a private draft." : "Select Active to publish. Seller submissions still require administrator approval."}</p>
    {groups.map((messages, step) => messages.length > 0 && <div key={step} className="mt-3"><button type="button" className="font-semibold text-sm underline" onClick={() => onEdit(step)}>Correct {["product details", "options and stock", "photos"][step]}</button><ul className="mt-1 list-disc pl-5 text-sm">{messages.map((message) => <li key={message}>{message}</li>)}</ul></div>)}
    <p className="mt-3 text-xs">Optional details do not prevent publication. HSN format checks do not verify tax classification.</p>
  </section>;
}

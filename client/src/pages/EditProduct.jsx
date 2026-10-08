import { validateListing } from "../utils/listingValidation";
import ListingValidation from "../components/ListingValidation";
import { generalListingDefaults } from "../utils/listingDefaults";
import GeneralListingFields from "../components/GeneralListingFields";
import ListingBasics from "../components/ListingBasics";
import ListingReview from "../components/ListingReview";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ColorVariantEditor from "../components/ColorVariantEditor";
import ListingWizardNav, { WizardActions } from "../components/ListingWizardNav";
import ColorImageManager from "../components/ColorImageManager";
import PageLoader from "../components/PageLoader";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sellerAccount = (() => { try { const session = JSON.parse(localStorage.getItem("user")); return session?.user?.accountType === "seller" || session?.user?.sellerRole === "member"; } catch { return false; } })();
  const [approval, setApproval] = useState({ status: "", note: "" });
  const previewUrls = useRef([]);
  const savePending = useRef(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [form, setForm] = useState({ ...generalListingDefaults, name: "", price: "", mrp: "", baseSku: "", hsnCode: "", category: "", color: "", fabric: "", ageGroup: "", tags: "", status: "active", lowStockThreshold: 3, description: "" });
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editStep, setEditStep] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const validation = validateListing(sellerAccount ? { ...form, status: "active" } : form, variants, images.length);
  const checkListing = (step = null) => {
    setShowValidation(true);
    const groups = [Object.values(validation.fields), validation.inventory, validation.photos];
    const invalidStep = step === null ? groups.findIndex((messages) => messages.length) : groups[step].length ? step : -1;
    if (invalidStep < 0) return true;
    setEditStep(invalidStep);
    return false;
  };

  useEffect(() => {
    const urls = previewUrls.current;
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/item/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setApproval({ status: data.approvalStatus || "", note: data.approvalNote || "" });
        setForm({
          ...generalListingDefaults,
          ...Object.fromEntries(Object.keys(generalListingDefaults).map((key) => [key, data[key] ?? generalListingDefaults[key]])),
          name: data.name || "", price: data.price ?? "", mrp: data.mrp ?? data.price ?? "", baseSku: data.baseSku || "", hsnCode: data.hsnCode || "",
          category: String(data.category || "").toLowerCase().replace(/\s+/g, "-"), color: data.color || "", fabric: data.fabric || "",
          ageGroup: data.ageGroup || "", tags: (data.tags || []).join(", "), status: data.status || "active",
          lowStockThreshold: data.lowStockThreshold ?? 3, description: data.description || "",
        });
        setVariants(data.variants?.length ? data.variants : (data.sizeStock || []).map((item) => ({ sku: `${data.baseSku || data._id}-${item.size}`.toUpperCase(), size: item.size, color: data.color || "", stock: item.stock, price: data.price, active: true })));
        setImages((data.images || []).map((image) => ({ id: image.public_id, type: "existing", public_id: image.public_id, url: image.url, color: image.color || "", size: image.size || "" })));
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [id, loadAttempt]);

  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value, ...(event.target.name === "category" ? { gstMode: "", gstRate: "" } : {}) }));
  const variantColors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];
  const addImages = (event, color = "") => {
    const files = Array.from(event.target.files || []);
    if (images.length + files.length > 30) return toast.error("Maximum 30 images allowed");
    const next = files.map((file, index) => { const url = URL.createObjectURL(file); previewUrls.current.push(url); return { id: `new-${Date.now()}-${index}`, type: "new", file, url, color, size: "" }; });
    setImages((current) => [...current, ...next]);
    event.target.value = "";
  };
  const moveImage = (from, to) => setImages((current) => { const next = [...current]; next.splice(to, 0, next.splice(from, 1)[0]); return next; });

  const submit = async (event, saveDraft = false) => {
    event.preventDefault();
    if (savePending.current || loading || loadError) return;
    if (!saveDraft && editStep < 3) return nextEditStep();
    if (!saveDraft && !checkListing()) return;
    if (!saveDraft && (!images.length || !variants.length)) return toast.error("Keep at least one image and inventory option");
    if (variants.some((variant) => !variant.size?.trim() || !variant.sku?.trim())) return toast.error("Every variant needs an option and SKU");
    try {
      savePending.current = true;
      setSaving(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, key === "tags" ? JSON.stringify(String(value).split(",").map((tag) => tag.trim()).filter(Boolean)) : value));
      if (saveDraft) data.set("status", "draft");
      else if (sellerAccount) data.set("status", "active");
      data.append("variants", JSON.stringify(variants));
      data.append("sizeStock", JSON.stringify(variants.map(({ size, stock }) => ({ size, stock }))));
      const existing = images.filter((image) => image.type === "existing");
      const newImages = images.filter((image) => image.type === "new");
      const newIndex = new Map(newImages.map((image, index) => [image.id, index]));
      data.append("existingImages", JSON.stringify(existing.map(({ public_id, url, color, size }) => ({ public_id, url, color, size }))));
      data.append("newImageColors", JSON.stringify(newImages.map((image) => image.color || "")));
      data.append("newImageSizes", JSON.stringify(newImages.map((image) => image.size || "")));
      data.append("imageOrder", JSON.stringify(images.map((image) => image.type === "existing" ? { type: "existing", public_id: image.public_id } : { type: "new", fileIndex: newIndex.get(image.id) })));
      data.append("inventoryReason", "Seller listing updated");
      newImages.forEach((image) => data.append("images", image.file));
      await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${id}`, data);
      toast.success(saveDraft ? "Private draft saved" : sellerAccount ? "Listing submitted for platform approval" : "Product updated");
          navigate(sellerAccount ? "/seller/products" : "/admin");
    } catch (error) { toast.error(error.response?.data?.message || "Update failed"); }
    finally { savePending.current = false; setSaving(false); }
  };

  const nextEditStep = () => {
    if (!checkListing(editStep)) return;
    setEditStep((step) => Math.min(step + 1, 3));
  };

  if (loading) return <PageLoader title="Loading product details" message="We’re preparing the listing and its variants." />;

  if (loadError) return <div className="p-5 md:p-8"><section role="alert" className="surface-card mx-auto max-w-2xl p-6"><h1 className="text-xl font-semibold">Could not load this listing</h1><p className="mt-2 text-sm text-slate-600">Load the saved product details before making changes.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" className="btn-primary" onClick={() => { setLoading(true); setLoadError(false); setLoadAttempt((attempt) => attempt + 1); }}>Retry listing</button><button type="button" className="btn-secondary" onClick={() => navigate(sellerAccount ? "/seller/products" : "/admin")}>Back to products</button></div></section></div>;
  return (
    <div className="p-5 md:p-8 xl:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Catalogue editor</p><h1 className="mt-2 text-3xl font-bold">Edit listing</h1><p className="mt-2 text-sm text-slate-500">Update product information, inventory and photos, then review your changes.</p></div><button onClick={() => navigate(sellerAccount ? "/seller/products" : "/admin")} className="btn-secondary">Back to products</button></header>
      {sellerAccount && approval.status === "rejected" && <section role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold">Changes requested by the administrator</h2><p className="mt-2 whitespace-pre-line break-words text-sm">{approval.note || "Review the listing details before submitting again."}</p><p className="mt-2 text-sm text-slate-600">Correct these details, then submit for approval. Save draft keeps your changes private.</p></section>}
      <form noValidate onSubmit={submit} className="mt-8">
        <ListingWizardNav current={editStep} onChange={setEditStep} />
          <ListingValidation messages={showValidation ? editStep === 0 ? Object.values(validation.fields) : editStep === 1 ? validation.inventory : editStep === 2 ? validation.photos : [] : []} />
        {editStep === 0 && <div className="mx-auto max-w-4xl">
          <ListingBasics errors={showValidation ? validation.fields : {}} form={form} onChange={changeForm} editing />
          <GeneralListingFields errors={showValidation ? validation.fields : {}} form={form} onChange={changeForm} />
        </div>}
        {editStep === 1 && <div className="mx-auto max-w-5xl"><ColorVariantEditor productType={form.productType} optionLabel={form.optionLabel} variants={variants} setVariants={setVariants} baseSku={form.baseSku || form.name} basePrice={form.price} lowStockThreshold={form.lowStockThreshold} onRenameColor={(oldColor, nextColor) => setImages((current) => current.map((image) => image.color === oldColor ? { ...image, color: nextColor } : image))} /></div>}
        {editStep === 2 && <div className="mx-auto max-w-5xl space-y-6">
          <ColorImageManager colors={variantColors} variants={variants} images={images} onUpload={addImages} onAssign={(index, assignment) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...assignment } : item))} onMove={moveImage} onRemove={(index) => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
        </div>}
        {editStep === 3 && <aside className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[1fr_340px]"><ListingReview form={form} variants={variants} images={images} onEdit={setEditStep} /><section className="surface-card p-6"><h2 className="text-xl font-semibold">Publishing</h2>{!sellerAccount && <label className="mt-4 block"><span className="field-label">Status</span><select name="status" value={form.status} onChange={changeForm} className="field-control"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>}{sellerAccount && <p className="mt-4 text-sm text-slate-600">Submitting sends this listing for administrator review. It becomes available to customers after approval. Save draft keeps it private.</p>}<label className="mt-4 block"><span className="field-label">Low-stock alert</span><input type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={changeForm} className="field-control" /></label></section></aside>}
        <WizardActions onSaveDraft={(event) => submit(event, true)} current={editStep} onBack={() => setEditStep((step) => Math.max(0, step - 1))} onNext={nextEditStep} busy={saving} submitLabel={sellerAccount ? "Submit for approval" : "Save listing"} />
      </form>
    </div>
  );
}

export default EditProduct;

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ColorVariantEditor from "../components/ColorVariantEditor";
import ListingWizardNav, { WizardActions } from "../components/ListingWizardNav";
import ColorImageManager from "../components/ColorImageManager";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewUrls = useRef([]);
  const [form, setForm] = useState({ name: "", price: "", mrp: "", baseSku: "", category: "", color: "", fabric: "", ageGroup: "", tags: "", status: "active", lowStockThreshold: 3, description: "" });
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editStep, setEditStep] = useState(0);

  useEffect(() => {
    const urls = previewUrls.current;
    axios.get(`${import.meta.env.VITE_API_URL}/api/products/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name || "", price: data.price ?? "", mrp: data.mrp ?? data.price ?? "", baseSku: data.baseSku || "",
          category: String(data.category || "").toLowerCase().replace(/\s+/g, "-"), color: data.color || "", fabric: data.fabric || "",
          ageGroup: data.ageGroup || "", tags: (data.tags || []).join(", "), status: data.status || "active",
          lowStockThreshold: data.lowStockThreshold ?? 3, description: data.description || "",
        });
        setVariants(data.variants?.length ? data.variants : (data.sizeStock || []).map((item) => ({ sku: `${data.baseSku || data._id}-${item.size}`.toUpperCase(), size: item.size, color: data.color || "", stock: item.stock, price: data.price, active: true })));
        setImages((data.images || []).map((image) => ({ id: image.public_id, type: "existing", public_id: image.public_id, url: image.url, color: image.color || "", size: image.size || "" })));
      })
      .catch(() => toast.error("Could not load this product"))
      .finally(() => setLoading(false));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [id]);

  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const variantColors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];
  const addImages = (event, color = "") => {
    const files = Array.from(event.target.files || []);
    if (images.length + files.length > 30) return toast.error("Maximum 30 images allowed");
    const next = files.map((file, index) => { const url = URL.createObjectURL(file); previewUrls.current.push(url); return { id: `new-${Date.now()}-${index}`, type: "new", file, url, color, size: "" }; });
    setImages((current) => [...current, ...next]);
    event.target.value = "";
  };
  const moveImage = (from, to) => setImages((current) => { const next = [...current]; next.splice(to, 0, next.splice(from, 1)[0]); return next; });

  const submit = async (event) => {
    event.preventDefault();
    if (editStep < 3) return nextEditStep();
    if (!images.length || !variants.length) return toast.error("Keep at least one image and colour style");
    if (variants.some((variant) => !variant.color?.trim() || !variant.size?.trim() || !variant.sku?.trim())) return toast.error("Every variant needs a colour, size and SKU");
    try {
      setSaving(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, key === "tags" ? JSON.stringify(String(value).split(",").map((tag) => tag.trim()).filter(Boolean)) : value));
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
      toast.success("Product updated");
      navigate("/admin");
    } catch (error) { toast.error(error.response?.data?.message || "Update failed"); }
    finally { setSaving(false); }
  };

  const nextEditStep = () => {
    if (editStep === 0 && (!form.name.trim() || !form.price || !form.mrp || !form.baseSku.trim() || !form.category || !form.description.trim())) return toast.error("Complete the required product information");
    if (editStep === 1 && (!variants.length || variants.some((variant) => !variant.color?.trim() || !variant.size?.trim() || !variant.sku?.trim()))) return toast.error("Complete every colour, size and SKU");
    if (editStep === 2 && !images.length) return toast.error("Keep at least one product photo");
    setEditStep((step) => Math.min(step + 1, 3));
  };

  if (loading) return <div className="p-10 text-slate-500">Loading product…</div>;

  return (
    <div className="p-5 md:p-8 xl:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Catalogue editor</p><h1 className="mt-2 text-3xl font-bold">Edit listing</h1></div><button onClick={() => navigate("/admin")} className="btn-secondary">Back to products</button></header>
      <form onSubmit={submit} className="mt-8">
        <ListingWizardNav current={editStep} onChange={setEditStep} />
        {editStep === 0 && <div className="mx-auto max-w-4xl">
          <section className="surface-card p-6"><h2 className="text-xl font-semibold">Product information</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2"><span className="field-label">Name</span><input required name="name" value={form.name} onChange={changeForm} className="field-control" /></label>
            <label><span className="field-label">Selling price (₹)</span><input required type="number" min="0" name="price" value={form.price} onChange={changeForm} className="field-control" /></label>
            <label><span className="field-label">MRP (₹)</span><input required type="number" min={form.price || 0} name="mrp" value={form.mrp} onChange={changeForm} className="field-control" /></label>
            <label><span className="field-label">Base SKU</span><input required name="baseSku" value={form.baseSku} onChange={changeForm} className="field-control uppercase" /></label>
            <label><span className="field-label">Category</span><select required name="category" value={form.category} onChange={changeForm} className="field-control"><option value="girls">Girls</option><option value="boys">Boys</option><option value="new-arrivals">New arrivals</option></select></label>
            <label><span className="field-label">Fabric</span><input name="fabric" value={form.fabric} onChange={changeForm} className="field-control" /></label>
            <label><span className="field-label">Age group</span><input name="ageGroup" value={form.ageGroup} onChange={changeForm} className="field-control" /></label>
            <label><span className="field-label">Tags</span><input name="tags" value={form.tags} onChange={changeForm} className="field-control" /></label>
            <label className="md:col-span-2"><span className="field-label">Description</span><textarea required rows="6" name="description" value={form.description} onChange={changeForm} className="field-control" /></label>
          </div></section>
        </div>}
        {editStep === 1 && <div className="mx-auto max-w-5xl"><ColorVariantEditor variants={variants} setVariants={setVariants} baseSku={form.baseSku || form.name} basePrice={form.price} lowStockThreshold={form.lowStockThreshold} onRenameColor={(oldColor, nextColor) => setImages((current) => current.map((image) => image.color === oldColor ? { ...image, color: nextColor } : image))} /></div>}
        {editStep >= 2 && <div className="mx-auto max-w-5xl space-y-6">
          <ColorImageManager colors={variantColors} variants={variants} images={images} onUpload={addImages} onAssign={(index, assignment) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...assignment } : item))} onMove={moveImage} onRemove={(index) => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
        </div>}
        {editStep === 3 && <aside className="mx-auto max-w-5xl"><section className="surface-card p-6"><h2 className="text-xl font-semibold">Publishing</h2><label className="mt-4 block"><span className="field-label">Status</span><select name="status" value={form.status} onChange={changeForm} className="field-control"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label><label className="mt-4 block"><span className="field-label">Low-stock alert</span><input type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={changeForm} className="field-control" /></label></section></aside>}
        <WizardActions current={editStep} onBack={() => setEditStep((step) => Math.max(0, step - 1))} onNext={nextEditStep} busy={saving} submitLabel="Save listing" />
      </form>
    </div>
  );
}

export default EditProduct;

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ColorVariantEditor from "../components/ColorVariantEditor";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewUrls = useRef([]);
  const [form, setForm] = useState({ name: "", price: "", mrp: "", baseSku: "", category: "", color: "", fabric: "", ageGroup: "", tags: "", status: "active", lowStockThreshold: 3, description: "" });
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setImages((data.images || []).map((image) => ({ id: image.public_id, type: "existing", public_id: image.public_id, url: image.url, color: image.color || "" })));
      })
      .catch(() => toast.error("Could not load this product"))
      .finally(() => setLoading(false));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [id]);

  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const variantColors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];
  const addImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (images.length + files.length > 10) return toast.error("Maximum 10 images allowed");
    const next = files.map((file, index) => { const url = URL.createObjectURL(file); previewUrls.current.push(url); return { id: `new-${Date.now()}-${index}`, type: "new", file, url, color: form.color || "" }; });
    setImages((current) => [...current, ...next]);
    event.target.value = "";
  };
  const moveCover = (index) => setImages((current) => { const next = [...current]; next.unshift(next.splice(index, 1)[0]); return next; });

  const submit = async (event) => {
    event.preventDefault();
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
      data.append("existingImages", JSON.stringify(existing.map(({ public_id, url, color }) => ({ public_id, url, color }))));
      data.append("newImageColors", JSON.stringify(newImages.map((image) => image.color || "")));
      data.append("imageOrder", JSON.stringify(images.map((image) => image.type === "existing" ? { type: "existing", public_id: image.public_id } : { type: "new", fileIndex: newIndex.get(image.id) })));
      data.append("inventoryReason", "Seller listing updated");
      newImages.forEach((image) => data.append("images", image.file));
      await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${id}`, data);
      toast.success("Product updated");
      navigate("/admin");
    } catch (error) { toast.error(error.response?.data?.message || "Update failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-slate-500">Loading product…</div>;

  return (
    <div className="p-5 md:p-8 xl:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Catalogue editor</p><h1 className="mt-2 text-3xl font-bold">Edit listing</h1></div><button onClick={() => navigate("/admin")} className="btn-secondary">Back to products</button></header>
      <form onSubmit={submit} className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
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
          <ColorVariantEditor variants={variants} setVariants={setVariants} baseSku={form.baseSku || form.name} basePrice={form.price} onRenameColor={(oldColor, nextColor) => setImages((current) => current.map((image) => image.color === oldColor ? { ...image, color: nextColor } : image))} />
          <section className="surface-card p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Images by colour</h2><p className="mt-1 text-sm text-slate-500">Choose a colour for each photo. Shared photos appear for all styles.</p></div><label className="btn-secondary cursor-pointer text-sm">Add photos<input type="file" multiple accept="image/*" onChange={addImages} className="hidden" /></label></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image, index) => <div key={image.id} className="rounded-xl border p-2"><button type="button" onClick={() => moveCover(index)} className="relative w-full"><img src={image.url} alt="" className="aspect-square w-full rounded-lg object-cover" />{index === 0 && <span className="absolute left-2 top-2 rounded bg-brand-primary px-2 py-1 text-xs text-white">Cover</span>}</button><select value={image.color || ""} onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item))} className="field-control mt-2 py-2 text-xs"><option value="">Shared / size chart</option>{variantColors.map((color) => <option key={color} value={color}>{color}</option>)}</select><button type="button" onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="mt-2 w-full text-xs text-red-600">Remove</button></div>)}</div></section>
        </div>
        <aside className="space-y-6"><section className="surface-card p-6"><h2 className="text-xl font-semibold">Publishing</h2><label className="mt-4 block"><span className="field-label">Status</span><select name="status" value={form.status} onChange={changeForm} className="field-control"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label><label className="mt-4 block"><span className="field-label">Low-stock alert</span><input type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={changeForm} className="field-control" /></label></section><button disabled={saving} className="btn-primary w-full py-4">{saving ? "Saving…" : "Save listing"}</button></aside>
      </form>
    </div>
  );
}

export default EditProduct;

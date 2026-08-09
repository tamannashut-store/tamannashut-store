import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ColorVariantEditor from "../components/ColorVariantEditor";

const initialVariants = [];

function Admin() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const previewUrls = useRef([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalProducts: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", mrp: "", baseSku: "", category: "", color: "", fabric: "", ageGroup: "", tags: "", status: "active", lowStockThreshold: 3, description: "" });
  const [variants, setVariants] = useState(initialVariants);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageColors, setImageColors] = useState([]);

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/list`, {
        params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined },
      });
      setProducts(data.products || []);
      setMeta({ page: data.currentPage, totalPages: data.totalPages, totalProducts: data.totalProducts });
      setSelected([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load products");
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(1), 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const variantColors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];

  const selectImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) return toast.error("Maximum 10 images allowed");
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    const urls = files.map((file) => URL.createObjectURL(file));
    previewUrls.current = urls;
    setImages(files);
    setPreviews(urls);
    setImageColors(files.map(() => form.color || ""));
  };

  const makeCover = (index) => {
    setImages((current) => { const next = [...current]; next.unshift(next.splice(index, 1)[0]); return next; });
    setPreviews((current) => { const next = [...current]; next.unshift(next.splice(index, 1)[0]); previewUrls.current = next; return next; });
    setImageColors((current) => { const next = [...current]; next.unshift(next.splice(index, 1)[0]); return next; });
  };

  const resetCreate = () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current = [];
    setForm({ name: "", price: "", mrp: "", baseSku: "", category: "", color: "", fabric: "", ageGroup: "", tags: "", status: "active", lowStockThreshold: 3, description: "" });
    setVariants(initialVariants);
    setImages([]);
    setPreviews([]);
    setImageColors([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const createProduct = async (event) => {
    event.preventDefault();
    if (!images.length) return toast.error("Add at least one product image");
    if (!variants.length) return toast.error("Add at least one colour style");
    if (variants.some((variant) => !variant.color?.trim() || !variant.size?.trim())) return toast.error("Every variant needs a colour and size");
    if (variants.some((variant) => !variant.sku)) return toast.error("Generate or enter every variant SKU");
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== "tags") data.append(key, value);
      });
      data.append("tags", JSON.stringify(form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)));
      data.append("variants", JSON.stringify(variants));
      data.append("sizeStock", JSON.stringify(variants.map(({ size, stock }) => ({ size, stock }))));
      data.append("imageColors", JSON.stringify(imageColors));
      images.forEach((image) => data.append("images", image));
      await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, data);
      toast.success("Product listing created");
      resetCreate();
      setShowCreate(false);
      fetchProducts(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Product could not be created");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Permanently delete this product and its images?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
      toast.success("Product deleted");
      fetchProducts(meta.page);
    } catch (error) { toast.error(error.response?.data?.message || "Delete failed"); }
  };

  const bulkStatus = async (status) => {
    if (!selected.length) return toast.error("Select at least one product");
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/products/admin/bulk-status`, { ids: selected, status });
      toast.success(`${selected.length} products updated`);
      fetchProducts(meta.page);
    } catch (error) { toast.error(error.response?.data?.message || "Bulk update failed"); }
  };

  return (
    <div className="p-5 md:p-8 xl:p-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow">Catalogue</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">Product listings</h1><p className="mt-2 text-sm text-slate-500">{meta.totalProducts} products across all listing states</p></div>
        <button onClick={() => setShowCreate((value) => !value)} className="btn-primary">{showCreate ? "Close form" : "+ Add product"}</button>
      </header>

      {showCreate && (
        <form onSubmit={createProduct} className="mt-8 grid gap-6 xl:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <section className="surface-card p-6"><h2 className="text-xl font-semibold">Listing information</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="field-label">Product name</span><input required name="name" value={form.name} onChange={changeForm} className="field-control" /></label>
              <label><span className="field-label">Selling price (₹)</span><input required min="0" type="number" name="price" value={form.price} onChange={changeForm} className="field-control" /></label>
              <label><span className="field-label">MRP (₹)</span><input required min="0" type="number" name="mrp" value={form.mrp} onChange={changeForm} className="field-control" /></label>
              <label><span className="field-label">Base SKU</span><input required name="baseSku" value={form.baseSku} onChange={changeForm} placeholder="TH-DRESS-001" className="field-control uppercase" /></label>
              <label><span className="field-label">Category</span><select required name="category" value={form.category} onChange={changeForm} className="field-control"><option value="">Select</option><option value="girls">Girls</option><option value="boys">Boys</option><option value="new-arrivals">New arrivals</option></select></label>
              <label><span className="field-label">Fabric</span><input name="fabric" value={form.fabric} onChange={changeForm} className="field-control" /></label>
              <label><span className="field-label">Age group</span><input name="ageGroup" value={form.ageGroup} onChange={changeForm} placeholder="0–12 months" className="field-control" /></label>
              <label><span className="field-label">Tags</span><input name="tags" value={form.tags} onChange={changeForm} placeholder="party, cotton, summer" className="field-control" /></label>
              <label className="md:col-span-2"><span className="field-label">Description</span><textarea required rows="5" name="description" value={form.description} onChange={changeForm} className="field-control" /></label>
            </div></section>

            <ColorVariantEditor variants={variants} setVariants={setVariants} baseSku={form.baseSku || form.name} basePrice={form.price} onRenameColor={(oldColor, nextColor) => setImageColors((current) => current.map((color) => color === oldColor ? nextColor : color))} />
          </div>

          <aside className="space-y-6">
            <section className="surface-card p-6"><h2 className="text-xl font-semibold">Images by colour</h2><p className="mt-1 text-sm text-slate-500">Choose which colour each photo belongs to. Shared photos appear for every colour.</p><input ref={fileRef} type="file" multiple accept="image/*" onChange={selectImages} className="mt-4 w-full text-sm" /><div className="mt-4 grid grid-cols-2 gap-3">{previews.map((url, index) => <div key={url} className={`rounded-xl border-2 p-1 ${index === 0 ? "border-brand-primary" : "border-slate-200"}`}><button type="button" onClick={() => makeCover(index)} className="relative w-full overflow-hidden rounded-lg"><img src={url} alt="" className="aspect-square w-full object-cover" />{index === 0 && <span className="absolute left-1 top-1 rounded bg-brand-primary px-1.5 py-0.5 text-[10px] text-white">Cover</span>}</button><select value={imageColors[index] || ""} onChange={(event) => setImageColors((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} className="field-control mt-1 py-2 text-xs"><option value="">Shared / size chart</option>{variantColors.map((color) => <option key={color} value={color}>{color}</option>)}</select></div>)}</div></section>
            <section className="surface-card p-6"><h2 className="text-xl font-semibold">Publishing</h2><label className="mt-4 block"><span className="field-label">Listing status</span><select name="status" value={form.status} onChange={changeForm} className="field-control"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label><label className="mt-4 block"><span className="field-label">Low-stock alert at</span><input type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={changeForm} className="field-control" /></label><button disabled={loading} className="btn-primary mt-6 w-full">{loading ? "Creating…" : "Create listing"}</button></section>
          </aside>
        </form>
      )}

      <section className="surface-card mt-8 overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" className="field-control max-w-sm" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-control max-w-44"><option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>{selected.length > 0 && <><button onClick={() => bulkStatus("active")} className="btn-secondary text-sm">Activate</button><button onClick={() => bulkStatus("archived")} className="btn-secondary text-sm">Archive</button></>}</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4"><input type="checkbox" checked={products.length > 0 && selected.length === products.length} onChange={(event) => setSelected(event.target.checked ? products.map((product) => product._id) : [])} /></th><th>Product</th><th>Status</th><th>Price</th><th>Inventory</th><th>Updated</th><th className="pr-5 text-right">Actions</th></tr></thead><tbody>{products.map((product) => {
          const stock = (product.variants?.length ? product.variants : product.sizeStock || []).reduce((sum, item) => sum + Number(item.stock || 0), 0);
          const low = stock <= Number(product.lowStockThreshold ?? 3);
          return <tr key={product._id} className="border-t hover:bg-slate-50/60"><td className="p-4"><input type="checkbox" checked={selected.includes(product._id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, product._id] : current.filter((id) => id !== product._id))} /></td><td className="py-4"><div className="flex items-center gap-3"><img src={product.images?.[0]?.url || "/placeholder.png"} alt="" className="h-14 w-12 rounded-lg object-cover" /><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.baseSku || "No base SKU"} · {product.variants?.length || product.sizeStock?.length || 0} variants</p></div></div></td><td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.status === "draft" ? "bg-amber-50 text-amber-700" : product.status === "archived" ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"}`}>{product.status || "active"}</span></td><td><p className="font-semibold">₹{Number(product.price).toLocaleString("en-IN")}</p>{product.mrp > product.price && <p className="text-xs text-slate-400 line-through">₹{product.mrp}</p>}</td><td><p className={low ? "font-semibold text-red-600" : "font-semibold text-slate-700"}>{stock} units</p><p className="text-xs text-slate-500">{low ? "Low stock" : "Available"}</p></td><td className="text-slate-500">{new Date(product.updatedAt).toLocaleDateString("en-IN")}</td><td className="pr-5 text-right"><button onClick={() => navigate(`/admin/edit/${product._id}`)} className="font-semibold text-brand-primary">Edit</button><button onClick={() => deleteProduct(product._id)} className="ml-4 text-red-600">Delete</button></td></tr>;
        })}</tbody></table></div>
        {!products.length && <div className="p-12 text-center text-slate-500">No products match these filters.</div>}
        <div className="flex items-center justify-between border-t p-4 text-sm"><span>Page {meta.page} of {meta.totalPages}</span><div className="flex gap-2"><button disabled={meta.page <= 1} onClick={() => fetchProducts(meta.page - 1)} className="btn-secondary py-2 text-sm disabled:opacity-40">Previous</button><button disabled={meta.page >= meta.totalPages} onClick={() => fetchProducts(meta.page + 1)} className="btn-secondary py-2 text-sm disabled:opacity-40">Next</button></div></div>
      </section>
    </div>
  );
}

export default Admin;

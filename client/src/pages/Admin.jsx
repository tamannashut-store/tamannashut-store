import { validateListing } from "../utils/listingValidation";
import ListingValidation from "../components/ListingValidation";
import { generalListingDefaults } from "../utils/listingDefaults";
import GeneralListingFields from "../components/GeneralListingFields";
import ListingBasics from "../components/ListingBasics";
import ListingReview from "../components/ListingReview";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ColorVariantEditor from "../components/ColorVariantEditor";
import ListingWizardNav, { WizardActions } from "../components/ListingWizardNav";
import ColorImageManager from "../components/ColorImageManager";
import VariantStockList from "../components/VariantStockList";
import { lowStockVariants, totalInventory } from "../utils/inventory";

const initialVariants = [];

function Admin() {
  const navigate = useNavigate();
  const sellerAccount = (() => { try { const session = JSON.parse(localStorage.getItem("user")); return session?.user?.accountType === "seller" || session?.user?.sellerRole === "member"; } catch { return false; } })();
  const productsBasePath = sellerAccount ? "/seller/products" : "/admin";
  const previewUrls = useRef([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalProducts: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...generalListingDefaults, name: "", price: "", mrp: "", baseSku: "", hsnCode: "", category: "", color: "", fabric: "", ageGroup: "", tags: "", status: "active", lowStockThreshold: 3, description: "" });
  const [variants, setVariants] = useState(initialVariants);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageColors, setImageColors] = useState([]);
  const [imageSizes, setImageSizes] = useState([]);
  const [createStep, setCreateStep] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const validation = validateListing(form, variants, images.length);
  const checkListing = (step = null) => {
    setShowValidation(true);
    const groups = [Object.values(validation.fields), validation.inventory, validation.photos];
    const invalidStep = step === null ? groups.findIndex((messages) => messages.length) : groups[step].length ? step : -1;
    if (invalidStep < 0) return true;
    setCreateStep(invalidStep);
    return false;
  };

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/admin/list`, {
        params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined, inventory: inventoryFilter || undefined, approval: approvalFilter || undefined },
      });
      setProducts(data.products || []);
      setMeta({ page: data.currentPage, totalPages: data.totalPages, totalProducts: data.totalProducts });
      setSelected([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load products");
    }
  }, [search, statusFilter, inventoryFilter, approvalFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(1), 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value, ...(event.target.name === "category" ? { gstMode: "", gstRate: "" } : {}) }));
  const variantColors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];

  const selectImages = (event, color = "") => {
    const files = Array.from(event.target.files || []);
    if (images.length + files.length > 30) { event.target.value = ""; return toast.error("Maximum 30 images allowed"); }
    const urls = files.map((file) => URL.createObjectURL(file));
    previewUrls.current = [...previewUrls.current, ...urls];
    setImages((current) => [...current, ...files]);
    setPreviews((current) => [...current, ...urls]);
    setImageColors((current) => [...current, ...files.map(() => color)]);
    setImageSizes((current) => [...current, ...files.map(() => "")]);
    event.target.value = "";
  };

  const moveImage = (from, to) => {
    const move = (current) => { const next = [...current]; next.splice(to, 0, next.splice(from, 1)[0]); return next; };
    setImages(move);
    setPreviews((current) => { const next = move(current); previewUrls.current = next; return next; });
    setImageColors(move);
    setImageSizes(move);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    previewUrls.current = previewUrls.current.filter((_, itemIndex) => itemIndex !== index);
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setImageColors((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setImageSizes((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetCreate = () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current = [];
    setForm({ ...generalListingDefaults, name: "", price: "", mrp: "", baseSku: "", hsnCode: "", category: "", color: "", fabric: "", ageGroup: "", tags: "", status: "active", lowStockThreshold: 3, description: "" });
    setVariants(initialVariants);
    setImages([]);
    setPreviews([]);
    setImageColors([]);
    setImageSizes([]);
    setCreateStep(0);
    setShowValidation(false);
  };

  const createProduct = async (event, saveDraft = false) => {
    event.preventDefault();
    if (!saveDraft && createStep < 3) return nextCreateStep();
    if (!saveDraft && !checkListing()) return;
    if (!saveDraft && !images.length) return toast.error("Add at least one product image");
    if (!saveDraft && !variants.length) return toast.error("Add at least one colour style");
    if (variants.some((variant) => !variant.size?.trim())) return toast.error("Every SKU needs an option");
    if (variants.some((variant) => !variant.sku)) return toast.error("Generate or enter every variant SKU");
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== "tags") data.append(key, value);
      });
      data.append("tags", JSON.stringify(form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)));
      if (saveDraft) data.set("status", "draft");
      data.append("variants", JSON.stringify(variants));
      data.append("sizeStock", JSON.stringify(variants.map(({ size, stock }) => ({ size, stock }))));
      data.append("imageColors", JSON.stringify(imageColors));
      data.append("imageSizes", JSON.stringify(imageSizes));
      images.forEach((image) => data.append("images", image));
      await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, data);
      toast.success(saveDraft ? "Private draft saved" : sellerAccount ? "Listing submitted for platform approval" : "Product listing created");
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
  const nextCreateStep = () => {
    if (!checkListing(createStep)) return;
    setCreateStep((step) => Math.min(step + 1, 3));
  };

  return (
    <div className="p-5 md:p-8 xl:p-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow">Catalogue</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">Product listings</h1><p className="mt-2 text-sm text-slate-500">{meta.totalProducts} products across all listing states</p></div>
        <button onClick={() => setShowCreate((value) => !value)} className="btn-primary">{showCreate ? "Close form" : "+ Add product"}</button>
      </header>

      {showCreate && (
        <form noValidate onSubmit={createProduct} className="mt-8">
          <ListingWizardNav current={createStep} onChange={setCreateStep} />
          <ListingValidation messages={showValidation ? createStep === 0 ? Object.values(validation.fields) : createStep === 1 ? validation.inventory : createStep === 2 ? validation.photos : [] : []} />
          {createStep === 0 && <div className="mx-auto max-w-4xl">
          <ListingBasics errors={showValidation ? validation.fields : {}} form={form} onChange={changeForm} />
          <GeneralListingFields errors={showValidation ? validation.fields : {}} form={form} onChange={changeForm} />
          </div>}

          {createStep === 1 && <div className="mx-auto max-w-5xl"><ColorVariantEditor productType={form.productType} optionLabel={form.optionLabel} variants={variants} setVariants={setVariants} baseSku={form.baseSku || form.name} basePrice={form.price} lowStockThreshold={form.lowStockThreshold} onRenameColor={(oldColor, nextColor) => setImageColors((current) => current.map((color) => color === oldColor ? nextColor : color))} /></div>}

          {createStep === 2 && <div className="mx-auto max-w-5xl">
            <ColorImageManager colors={variantColors} variants={variants} images={previews.map((url, index) => ({ id: url, url, color: imageColors[index] || "", size: imageSizes[index] || "" }))} onUpload={selectImages} onAssign={(index, assignment) => { setImageColors((current) => current.map((value, itemIndex) => itemIndex === index ? assignment.color : value)); setImageSizes((current) => current.map((value, itemIndex) => itemIndex === index ? assignment.size : value)); }} onMove={moveImage} onRemove={removeImage} />
          </div>}
          {createStep === 3 && <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
            <ListingReview form={form} variants={variants} images={previews.map((url, index) => ({ url, color: imageColors[index] || "", size: imageSizes[index] || "" }))} onEdit={setCreateStep} />
            <section className="surface-card p-6"><h2 className="text-xl font-semibold">Publishing</h2><label className="mt-4 block"><span className="field-label">Listing status</span><select name="status" value={form.status} onChange={changeForm} className="field-control"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label><label className="mt-4 block"><span className="field-label">Low-stock alert at</span><input type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={changeForm} className="field-control" /></label><p className="mt-4 text-xs leading-5 text-slate-500">Drafts remain private. Seller listings require platform approval; platform listings become visible when active.</p></section>
          </div>}
          <WizardActions onSaveDraft={(event) => createProduct(event, true)} current={createStep} onBack={() => setCreateStep((step) => Math.max(0, step - 1))} onNext={nextCreateStep} busy={loading} submitLabel={sellerAccount ? "Submit for approval" : form.status === "draft" ? "Save private draft" : "Create listing"} />
        </form>
      )}

      <section className="admin-product-list surface-card mt-8 overflow-hidden">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:flex"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" className="field-control xl:max-w-sm" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-control xl:max-w-44"><option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>{!sellerAccount && <select value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value)} className="field-control xl:max-w-52"><option value="">All review states</option><option value="pending">Pending approval</option><option value="approved">Approved seller listings</option><option value="rejected">Changes required</option><option value="not_required">Platform listings</option></select>}<select value={inventoryFilter} onChange={(event) => setInventoryFilter(event.target.value)} className="field-control xl:max-w-56"><option value="">All inventory</option><option value="low">Low/out-of-stock variants</option></select>{selected.length > 0 && <>{sellerAccount ? <button onClick={() => bulkStatus("draft")} className="btn-secondary text-sm">Submit for approval</button> : <button onClick={() => bulkStatus("active")} className="btn-secondary text-sm">Activate</button>}<button onClick={() => bulkStatus("archived")} className="btn-secondary text-sm">Archive</button></>}</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4"><input type="checkbox" checked={products.length > 0 && selected.length === products.length} onChange={(event) => setSelected(event.target.checked ? products.map((product) => product._id) : [])} /></th><th>Product</th><th>Status</th><th>Price</th><th>Inventory</th><th>Updated</th><th className="pr-5 text-right">Actions</th></tr></thead><tbody>{products.map((product) => {
          const stock = totalInventory(product);
          const lowVariants = lowStockVariants(product);
          return <tr key={product._id} className="border-t align-top hover:bg-slate-50/60"><td className="p-4"><input type="checkbox" checked={selected.includes(product._id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, product._id] : current.filter((id) => id !== product._id))} /></td><td className="py-4"><div className="flex items-center gap-3"><img src={product.images?.[0]?.url || "/placeholder.png"} alt="" className="h-14 w-12 rounded-lg object-cover" /><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.baseSku || "No base SKU"} · {product.variants?.length || product.sizeStock?.length || 0} variants</p>{!sellerAccount && product.sellerId?.email && <p className="mt-1 text-xs text-slate-400">Seller: {product.sellerId.name || product.sellerId.email}</p>}</div></div></td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.status === "draft" ? "bg-amber-50 text-amber-700" : product.status === "archived" ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"}`}>{product.approvalStatus === "pending" ? "pending approval" : product.approvalStatus === "rejected" ? "changes required" : product.status || "active"}</span></td><td className="py-4"><p className="font-semibold">₹{Number(product.price).toLocaleString("en-IN")}</p>{product.mrp > product.price && <p className="text-xs text-slate-400 line-through">₹{product.mrp}</p>}</td><td className="max-w-md py-4 pr-4"><p className={lowVariants.length ? "font-semibold text-red-600" : "font-semibold text-slate-700"}>{stock} total units</p><p className="mb-2 text-xs text-slate-500">{lowVariants.length ? `${lowVariants.length} variant${lowVariants.length === 1 ? "" : "s"} need attention` : "All variants available"}</p>{lowVariants.length > 0 && <VariantStockList product={product}/>}</td><td className="py-4 text-slate-500">{new Date(product.updatedAt).toLocaleDateString("en-IN")}</td><td className="py-4 pr-5 text-right"><button onClick={() => navigate(`${productsBasePath}/edit/${product._id}`)} className="font-semibold text-brand-primary">Edit</button><button onClick={() => deleteProduct(product._id)} className="ml-4 text-red-600">Delete</button></td></tr>;
        })}</tbody></table></div>
        <div className="admin-product-cards divide-y md:hidden">{products.map((product) => { const stock = totalInventory(product); const lowVariants = lowStockVariants(product); return <article key={product._id} className="p-4"><div className="flex gap-3"><input type="checkbox" aria-label={`Select ${product.name}`} checked={selected.includes(product._id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, product._id] : current.filter((id) => id !== product._id))}/><img src={product.images?.[0]?.url || "/placeholder.png"} alt="" className="h-20 w-16 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="font-semibold leading-5">{product.name}</p><p className="mt-1 truncate font-mono text-xs text-slate-500">{product.baseSku || "No base SKU"}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{product.approvalStatus === "pending" ? "pending approval" : product.approvalStatus === "rejected" ? "changes required" : product.status || "active"}</span><strong className={lowVariants.length ? "text-sm text-red-600" : "text-sm text-slate-700"}>{stock} total units</strong></div></div></div>{lowVariants.length > 0 && <div className="mt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">{lowVariants.length} variants need attention</p><VariantStockList product={product}/></div>}<div className="mt-4 flex gap-2"><button onClick={() => navigate(`${productsBasePath}/edit/${product._id}`)} className="btn-secondary flex-1 py-2 text-sm">Edit listing</button><button onClick={() => deleteProduct(product._id)} className="rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600">Delete</button></div></article>; })}</div>
        {!products.length && <div className="p-12 text-center text-slate-500">No products match these filters.</div>}
        <div className="flex items-center justify-between border-t p-4 text-sm"><span>Page {meta.page} of {meta.totalPages}</span><div className="flex gap-2"><button disabled={meta.page <= 1} onClick={() => fetchProducts(meta.page - 1)} className="btn-secondary py-2 text-sm disabled:opacity-40">Previous</button><button disabled={meta.page >= meta.totalPages} onClick={() => fetchProducts(meta.page + 1)} className="btn-secondary py-2 text-sm disabled:opacity-40">Next</button></div></div>
      </section>
    </div>
  );
}

export default Admin;

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const createdPreviewUrls = useRef([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [sizeStock, setSizeStock] = useState([]);
  const [imageItems, setImageItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const previewUrls = createdPreviewUrls.current;
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/products/${id}`
        );
        setName(data.name || "");
        setPrice(data.price ?? "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setSizeStock(data.sizeStock || []);
        setImageItems(
          (data.images || []).map((image) => ({
            id: image.public_id,
            type: "existing",
            public_id: image.public_id,
            url: image.url,
          }))
        );
      } catch (error) {
        console.error(error);
        toast.error("Could not load this product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [id]);

  const addImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (imageItems.length + files.length > 10) {
      toast.error("A product can have a maximum of 10 images");
      event.target.value = "";
      return;
    }

    const additions = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      createdPreviewUrls.current.push(url);
      return {
        id: `new-${Date.now()}-${index}-${file.name}`,
        type: "new",
        file,
        url,
      };
    });
    setImageItems((current) => [...current, ...additions]);
    event.target.value = "";
  };

  const makeCover = (index) => {
    setImageItems((current) => {
      const updated = [...current];
      const [selected] = updated.splice(index, 1);
      updated.unshift(selected);
      return updated;
    });
  };

  const moveImage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= imageItems.length) return;
    setImageItems((current) => {
      const updated = [...current];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  const removeImage = (index) => {
    setImageItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (imageItems.length === 0) {
      toast.error("Keep at least one product image");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("sizeStock", JSON.stringify(sizeStock));

      const existingImages = imageItems
        .filter((item) => item.type === "existing")
        .map(({ public_id, url }) => ({ public_id, url }));
      const newItems = imageItems.filter((item) => item.type === "new");
      const newIndexById = new Map(newItems.map((item, index) => [item.id, index]));

      formData.append("existingImages", JSON.stringify(existingImages));
      formData.append(
        "imageOrder",
        JSON.stringify(
          imageItems.map((item) =>
            item.type === "existing"
              ? { type: "existing", public_id: item.public_id }
              : { type: "new", fileIndex: newIndexById.get(item.id) }
          )
        )
      );
      newItems.forEach((item) => formData.append("images", item.file));

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`,
        formData
      );
      toast.success("Product updated");
      navigate("/admin");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-6xl px-6 py-20">Loading product…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-brand-primary">Seller listing</p>
          <h1 className="mt-1 text-4xl font-bold">Edit product</h1>
        </div>
        <button type="button" onClick={() => navigate("/admin")} className="rounded-xl border px-5 py-3">
          Back to products
        </button>
      </div>

      <form onSubmit={handleUpdate} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Product information</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block font-medium">Product name</span>
                <input required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border p-3" />
              </label>
              <label>
                <span className="mb-2 block font-medium">Price (₹)</span>
                <input required min="0" type="number" value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded-xl border p-3" />
              </label>
              <label>
                <span className="mb-2 block font-medium">Category</span>
                <select required value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border p-3">
                  <option value="">Select category</option>
                  <option value="girls">Girls</option>
                  <option value="boys">Boys</option>
                  <option value="new-arrivals">New Arrivals</option>
                  <option value="Girls">Girls (legacy)</option>
                  <option value="Boys">Boys (legacy)</option>
                  <option value="New Arrivals">New Arrivals (legacy)</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-2 block font-medium">Description</span>
                <textarea rows="6" value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border p-3" />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Product photos</h2>
                <p className="mt-1 text-sm text-gray-500">The first photo is the storefront cover. Add up to 10 photos.</p>
              </div>
              <label className="cursor-pointer rounded-xl bg-brand-primary px-4 py-2 text-white">
                Add photos
                <input type="file" multiple accept="image/*" onChange={addImages} className="hidden" />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {imageItems.map((item, index) => (
                <div key={item.id} className="rounded-2xl border bg-gray-50 p-2">
                  <div className="relative">
                    <img src={item.url} alt={`Product photo ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                    {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-brand-primary px-2 py-1 text-xs text-white">Cover</span>}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="rounded-lg border bg-white py-1 disabled:opacity-30">←</button>
                    <button type="button" disabled={index === imageItems.length - 1} onClick={() => moveImage(index, 1)} className="rounded-lg border bg-white py-1 disabled:opacity-30">→</button>
                    {index > 0 && <button type="button" onClick={() => makeCover(index)} className="col-span-2 rounded-lg border bg-white py-1">Make cover</button>}
                    <button type="button" onClick={() => removeImage(index)} className="col-span-2 rounded-lg py-1 text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Inventory by size</h2>
            <div className="mt-5 space-y-3">
              {sizeStock.map((item, index) => (
                <label key={item.size} className="flex items-center justify-between gap-4">
                  <span>{item.size}</span>
                  <input type="number" min="0" value={item.stock} onChange={(event) => setSizeStock((current) => current.map((stockItem, stockIndex) => stockIndex === index ? { ...stockItem, stock: Number(event.target.value) } : stockItem))} className="w-28 rounded-xl border p-2" />
                </label>
              ))}
            </div>
          </section>
          <button disabled={saving} type="submit" className="w-full rounded-xl bg-brand-primary py-4 font-semibold text-white disabled:bg-gray-400">
            {saving ? "Saving product…" : "Save product"}
          </button>
        </aside>
      </form>
    </div>
  );
}

export default EditProduct;

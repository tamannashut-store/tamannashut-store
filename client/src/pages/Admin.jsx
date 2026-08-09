import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Admin() {

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [images, setImages] = useState([]);
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [products, setProducts] = useState([]);
    const [sizeStock, setSizeStock] = useState([
        { size: "0-3M", stock: 0 },
        { size: "3-6M", stock: 0 },
        { size: "6-9M", stock: 0 },
        { size: "9-12M", stock: 0 },
    ]);
    const navigate = useNavigate();
    const [previewImages, setPreviewImages] = useState([]);
    const previewImagesRef = useRef([]);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef(null);

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/products`
            );
            setProducts(data.products || []);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);
    useEffect(() => () => {
        previewImagesRef.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const makeCover = (selectedIndex) => {
        setImages((current) => {
            const updated = [...current];
            const [selected] = updated.splice(selectedIndex, 1);
            updated.unshift(selected);
            return updated;
        });
        setPreviewImages((current) => {
            const updated = [...current];
            const [selected] = updated.splice(selectedIndex, 1);
            updated.unshift(selected);
            previewImagesRef.current = updated;
            return updated;
        });
    };

    const removeImage = (selectedIndex) => {
        const removedUrl = previewImages[selectedIndex];
        if (removedUrl) URL.revokeObjectURL(removedUrl);
        setImages((current) => current.filter((_, index) => index !== selectedIndex));
        setPreviewImages((current) => current.filter((_, index) => index !== selectedIndex));
        previewImagesRef.current = previewImagesRef.current.filter((_, index) => index !== selectedIndex);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (images.length === 0) {
            toast.error("Please select images");
            return;
        }
        try {
            setLoading(true);
            const formData = new FormData();

            formData.append("name", name);
            formData.append("price", price);
            formData.append("description", description);
            images.forEach((image) => {

                formData.append(
                    "images",
                    image
                );

            });
            formData.append("category", category);
            formData.append(
                "sizeStock",
                JSON.stringify(sizeStock)
            );

            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/products`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast.success("Product Added");

            setName("");
            setPrice("");
            setDescription("");
            setImages([]);
            previewImagesRef.current.forEach((url) => URL.revokeObjectURL(url));
            previewImagesRef.current = [];
            setPreviewImages([]);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
            setCategory("");
            setSizeStock([
                { size: "0-3M", stock: 0 },
                { size: "3-6M", stock: 0 },
                { size: "6-9M", stock: 0 },
                { size: "9-12M", stock: 0 },
            ]);

            fetchProducts();
        } catch (error) {
            console.log(error);
            toast.error(
                error.response?.data?.message || "Upload failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        const confirmDelete = window.confirm("Delete this product?");
        if (!confirmDelete) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/products/${productId}`
            );

            toast.success("Product Deleted");
            setProducts((prevProducts) =>
                prevProducts.filter(
                    (product) => product._id !== productId
                )
            );
        } catch (error) {
            console.log(error);
            toast.error("Delete Failed");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-20">
            <button
                onClick={() => {
                    localStorage.removeItem("user");
                    delete axios.defaults.headers.common["Authorization"];
                    window.location.href = "/admin-login";
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
            >
                Logout
            </button>
            <h1 className="text-5xl font-bold mb-10">
                Admin Dashboard
            </h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-2xl rounded-[40px] p-10 space-y-6"
            >
                <div>
                    <label className="block mb-2 font-semibold">
                        Product Name
                    </label>

                    <input required
                        type="text"
                        placeholder="Enter product name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border p-4 rounded-2xl outline-none focus:border-pink-500"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-semibold">
                        Product Price
                    </label>

                    <input required
                        type="number"
                        placeholder="Enter product price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full border p-4 rounded-2xl outline-none focus:border-pink-500"
                    />
                </div>
                <div>

                    <h3 className="font-semibold mb-4">
                        Size Wise Stock
                    </h3>

                    <div className="grid gap-4">

                        {sizeStock.map((item, index) => (

                            <div
                                key={item.size}
                                className="flex items-center gap-4"
                            >

                                <span className="w-24 font-medium">
                                    {item.size}
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    value={item.stock}
                                    onChange={(e) => {

                                        const updated = [...sizeStock];

                                        updated[index].stock =
                                            Number(e.target.value);

                                        setSizeStock(updated);

                                    }}
                                    className="border p-3 rounded-xl w-40"
                                />

                            </div>

                        ))}

                    </div>

                </div>
                <div>
                    <label className="block mb-2 font-semibold">
                        Upload Product Images (Max 10)
                    </label>

                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {

                            const files = Array.from(e.target.files);

                            if (files.length > 10) {
                                toast.error("Maximum 10 images allowed");
                                return;
                            }

                            previewImagesRef.current.forEach((url) => URL.revokeObjectURL(url));
                            setImages(files);

                            const previews = files.map(file =>
                                URL.createObjectURL(file)
                            );

                            previewImagesRef.current = previews;
                            setPreviewImages(previews);

                        }}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        The first image is the cover shown across the store. Choose clear front, back and detail photos.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-3 md:grid-cols-5">

                        {
                            previewImages.map((img, index) => (

                                <div key={img} className="rounded-2xl border bg-gray-50 p-2">
                                    <div className="relative">
                                        <img
                                            src={img}
                                            alt={`Product preview ${index + 1}`}
                                            className="aspect-square w-full rounded-xl object-cover"
                                        />
                                        {index === 0 && (
                                            <span className="absolute left-2 top-2 rounded-full bg-brand-primary px-2 py-1 text-xs text-white">
                                                Cover
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex flex-col gap-1 text-xs">
                                        {index > 0 && (
                                            <button type="button" onClick={() => makeCover(index)} className="rounded-lg border bg-white px-2 py-1">
                                                Make cover
                                            </button>
                                        )}
                                        <button type="button" onClick={() => removeImage(index)} className="rounded-lg px-2 py-1 text-red-600">
                                            Remove
                                        </button>
                                    </div>
                                </div>

                            ))
                        }

                    </div>
                </div>

                <div>
                    <label className="block mb-2 font-semibold">
                        Category
                    </label>

                    <select required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border p-4 rounded-2xl"
                    >
                        <option value="">Select Category</option>

                        <option value="girls">
                            Girls
                        </option>

                        <option value="boys">
                            Boys
                        </option>

                        <option value="new-arrivals">
                            New Arrivals
                        </option>
                    </select>
                </div>

                <div>
                    <label className="block mb-2 font-semibold">
                        Product Description
                    </label>

                    <textarea
                        rows="5"
                        placeholder="Enter product description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border p-4 rounded-2xl outline-none focus:border-pink-500"
                    ></textarea>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white py-4 rounded-full text-lg font-semibold"
                >
                    {
                        loading ? "Uploading Images..." : "Add Product"
                    }
                </button>
            </form>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
                {products.map((product) => (
                    <div
                        key={product._id}
                        className="bg-white shadow-xl rounded-3xl p-5"
                    >
                        <img
                            src={product.images?.[0]?.url}
                            alt={`${product.name} - Tamanna's Hut Kids Fashion`}
                            className="w-full h-64 object-cover rounded-2xl"
                        />

                        <h2 className="text-xl font-bold mt-4">
                            {product.name}
                        </h2>

                        <p className="text-pink-500 font-bold mt-2">
                            ₹{product.price}
                        </p>
                        <div className="mt-2 text-gray-600">

                            {product.sizeStock?.map((item) => (

                                <p key={item.size}>
                                    {item.size}: {item.stock}
                                </p>

                            ))}

                        </div>
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() =>
                                    navigate(`/admin/edit/${product._id}`)
                                }
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
                            >
                                Edit
                            </button>

                            <button
                                onClick={() => handleDelete(product._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Admin;

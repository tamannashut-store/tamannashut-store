import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Container from "../components/Container";
function Admin() {

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState(null);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();

            formData.append("name", name);
            formData.append("price", price);
            formData.append("description", description);
            formData.append("image", image);
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

            alert("Product Added");

            setName("");
            setPrice("");
            setDescription("");
            setImage(null);
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
        }
    };

    const handleDelete = async (productId) => {
        const confirmDelete = window.confirm("Delete this product?");
        if (!confirmDelete) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/products/${productId}`
            );

            alert("Product Deleted");
            fetchProducts();
        } catch (error) {
            console.log(error);
            toast.error("Delete Failed");
        }
    };

    return (
        <Container className="py-20">
            <button
                onClick={() => {
                    localStorage.removeItem("admin");
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
                        Upload Product Image
                    </label>

                    <input required
                        type="file"
                        onChange={(e) => setImage(e.target.files[0])}
                        className="w-full border p-4 rounded-2xl"
                    />
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
                        <option value="Girls">Girls</option>
                        <option value="Boys">Boys</option>
                        <option value="New Arrivals">New Arrivals</option>
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
                    type="submit"
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-full text-lg font-semibold transition"
                >
                    Add Product
                </button>
            </form>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
                {products.map((product) => (
                    <div
                        key={product._id}
                        className="bg-white shadow-xl rounded-3xl p-5"
                    >
                        <img
                            src={
                                product.image?.startsWith("http")
                                    ? product.image
                                    : `${import.meta.env.VITE_API_URL}${product.image}`
                            }
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
        </Container>
    );
}

export default Admin;
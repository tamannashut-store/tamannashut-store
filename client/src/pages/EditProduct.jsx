import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function EditProduct() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [image, setImage] = useState(null);
    const [sizeStock, setSizeStock] =
        useState([]);

    useEffect(() => {

        fetchProduct();

    }, []);

    const fetchProduct = async () => {

        try {

            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/products/${id}`
            );

            setName(data.name);
            setPrice(data.price);
            setDescription(data.description);
            setCategory(data.category);
            setSizeStock(data.sizeStock || []);

        } catch (error) {

            console.log(error);
        }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();

        try {

            const formData = new FormData();

            formData.append("name", name);
            formData.append("price", price);
            formData.append("description", description);
            formData.append("category", category);
            formData.append(
                "sizeStock",
                JSON.stringify(sizeStock)
            );

            if (image) {
                formData.append("image", image);
            }

            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/products/${id}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            alert("Product Updated");

            navigate("/admin");

        } catch (error) {

            console.log(error);

            alert("Update Failed");
        }
    };

    return (

        <div className="max-w-3xl mx-auto px-6 py-20">

            <h1 className="text-5xl font-bold mb-10">
                Edit Product
            </h1>

            <form
                onSubmit={handleUpdate}
                className="bg-white shadow-2xl rounded-[40px] p-10 space-y-6"
            >

                <div>

                    <label className="block mb-2 font-semibold">
                        Product Name
                    </label>

                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border p-4 rounded-2xl"
                    />

                </div>

                <div>

                    <label className="block mb-2 font-semibold">
                        Product Price
                    </label>

                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full border p-4 rounded-2xl"
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
                        Category
                    </label>

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border p-4 rounded-2xl"
                    >

                        <option value="Girls">
                            Girls
                        </option>

                        <option value="Boys">
                            Boys
                        </option>

                        <option value="New Arrivals">
                            New Arrivals
                        </option>

                    </select>

                </div>

                <div>

                    <label className="block mb-2 font-semibold">
                        Description
                    </label>

                    <textarea
                        rows="5"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border p-4 rounded-2xl"
                    ></textarea>

                </div>

                <div>

                    <label className="block mb-2 font-semibold">
                        Change Image
                    </label>

                    <input
                        type="file"
                        onChange={(e) => setImage(e.target.files[0])}
                        className="w-full border p-4 rounded-2xl"
                    />

                </div>

                <button
                    type="submit"
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-full text-lg font-semibold"
                >

                    Update Product

                </button>

            </form>

        </div>
    );
}

export default EditProduct;
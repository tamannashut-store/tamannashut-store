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
    const [stock, setStock] = useState("");
    const [sizes, setSizes] = useState([]);

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
            setStock(data.stock);
            setSizes(data.sizes || []);

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
            formData.append("stock", stock);
            formData.append(
                "sizes",
                JSON.stringify(sizes)
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

<label className="block mb-2 font-semibold">
    Stock
</label>

<input
    type="number"
    value={stock}
    onChange={(e) => setStock(e.target.value)}
    className="w-full border p-4 rounded-2xl"
/>

</div>
<div>

    <label className="block mb-3 font-semibold">
        Sizes
    </label>

    <div className="flex gap-4 flex-wrap">

        {[
            "0-3M",
            "3-6M",
            "6-9M",
            "9-12M",
        ].map((size) => (

            <label
                key={size}
                className="flex items-center gap-2"
            >

                <input
                    type="checkbox"
                    checked={sizes.includes(size)}
                    onChange={(e) => {

                        let updatedSizes;
                    
                        if (e.target.checked) {
                    
                            updatedSizes = [...sizes, size];
                    
                        } else {
                    
                            updatedSizes = sizes.filter(
                                (s) => s !== size
                            );
                    
                        }
                    
                        const sizeOrder = [
                            "0-3M",
                            "3-6M",
                            "6-9M",
                            "9-12M",
                        ];
                    
                        updatedSizes.sort(
                            (a, b) =>
                                sizeOrder.indexOf(a) -
                                sizeOrder.indexOf(b)
                        );
                    
                        setSizes(updatedSizes);
                    
                    }}
                />

                {size}

            </label>

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
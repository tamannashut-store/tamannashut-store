import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                formData
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data)
            );
            const guestCart = JSON.parse(
                localStorage.getItem("guest_cart")
            ) || [];

            const userCartKey =
                `cart_${data.user._id}`;

            const userCart = JSON.parse(
                localStorage.getItem(userCartKey)
            ) || [];

            const mergedCart = [...userCart];

            guestCart.forEach((guestItem) => {
                const existing = mergedCart.find(item => item._id === guestItem._id && item.selectedSize === guestItem.selectedSize);
                if (existing) {
                    existing.qty = existing.qty + guestItem.qty;
                    const maxStock =
                        existing.sizeStock?.find(
                            s => s.size === existing.selectedSize
                        )?.stock || 999;

                    if (existing.qty > maxStock) {
                        existing.qty = maxStock;
                    }
                } else {
                    mergedCart.push(guestItem);
                }

            });

            localStorage.setItem(
                userCartKey,
                JSON.stringify(mergedCart)
            );

            localStorage.removeItem(
                "guest_cart"
            );

            window.dispatchEvent(
                new Event("cartUpdated")
            );
            toast.success("Login Successful");
            console.log(data);

            navigate("/");

        } catch (error) {
            console.log("Error Data:", error.response?.data);
            console.log("Error Status:", error.response?.status);
            toast.error(
                error.response?.data?.message ||
                "Login Failed"
            );
        }
    };

    return (

        <div className="max-w-md mx-auto px-6 py-20">

            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-2xl rounded-3xl p-10 space-y-6"
            >

                <h1 className="text-4xl font-bold text-center">
                    Login
                </h1>

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    className="w-full border p-4 rounded-2xl"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    className="w-full border p-4 rounded-2xl"
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-full text-lg font-semibold"
                >
                    Login
                </button>

            </form>

        </div>
    );
}

export default Login;
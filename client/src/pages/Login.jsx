import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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
            axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
            const guestCart =
                JSON.parse(
                    sessionStorage.getItem(
                        "pending_guest_cart"
                    )
                ) ||
                JSON.parse(
                    localStorage.getItem("guest_cart")
                ) ||
                [];

            if (guestCart.length) {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/cart/merge`, {
                    items: guestCart.map((item) => ({ productId: item._id, selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty })),
                });
            }

            localStorage.removeItem(
                "guest_cart"
            );
            sessionStorage.removeItem(
                "pending_guest_cart"
              );
            window.dispatchEvent(
                new Event("cartUpdated")
            );
            toast.success("Login Successful");
            navigate("/");

        } catch (error) {
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

                <div className="text-right">
                    <Link to="/forgot-password" className="text-sm font-semibold text-brand-primary hover:underline">
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-full text-lg font-semibold"
                >
                    Login
                </button>

                <p className="text-center text-sm text-slate-600">
                    New to Tamanna&apos;s Hut?{" "}
                    <Link to="/register" className="font-semibold text-brand-primary hover:underline">
                        Create an account
                    </Link>
                </p>

            </form>

        </div>
    );
}

export default Login;

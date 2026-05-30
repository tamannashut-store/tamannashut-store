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

            toast.success("Login Successful");

            navigate("/");

        } catch (error) {
            console.log(err.response?.data);
            console.log(err.response?.status);
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
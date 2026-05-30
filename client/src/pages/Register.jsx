import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
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

            await axios.post(
                "import.meta.env.VITE_API_URL/api/auth/register",
                formData
            );

            toast.success("Registration Successful");

            navigate("/login");

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Registration Failed"
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
                    Register
                </h1>

                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    onChange={handleChange}
                    className="w-full border p-4 rounded-2xl"
                    required
                />

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
                    Register
                </button>

            </form>

        </div>
    );
}

export default Register;
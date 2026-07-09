import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminLogin() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                {
                    email,
                    password,
                }
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data)
            );

            if (data.user.isAdmin) {

                navigate("/admin/dashboard");

            } else {

                toast.error("You are not admin");

                localStorage.removeItem("user");
                delete axios.defaults.headers.common["Authorization"];
            }

        } catch (error) {

            console.log(error);

            toast.error("Login Failed");
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-pink-50">

            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md"
            >

                <h1 className="text-4xl font-bold mb-8 text-center">
                    Admin Login
                </h1>

                <div className="space-y-5">

                    <input
                        type="email"
                        placeholder="Admin Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border p-4 rounded-2xl outline-none"
                    />

                    <input
                        type="password"
                        placeholder="Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border p-4 rounded-2xl outline-none"
                    />

                </div>

                <button
                    type="submit"
                    className="w-full mt-8 bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-full font-semibold"
                >
                    Login
                </button>

            </form>

        </div>
    );
}

export default AdminLogin;
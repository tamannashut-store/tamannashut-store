import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

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

                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

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

        <div className="flex min-h-screen items-center justify-center bg-brand-background p-4">

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-10"
            >

                <h1 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
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
                    className="w-full mt-8 bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-full font-semibold"
                >
                    Login
                </button>

            </form>

        </div>
    );
}

export default AdminLogin;


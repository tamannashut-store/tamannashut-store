import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function AdminDashboard() {

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {

        fetchData();

    }, []);

    const fetchData = async () => {

        try {

            const productsRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/products`
            );

            const ordersRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/orders`
            );

            setProducts(productsRes.data);

            setOrders(ordersRes.data);

        } catch (error) {

            console.log(error);
        }
    };

    const totalRevenue = orders.reduce(
        (acc, order) => acc + order.totalAmount,
        0
    );

    return (

        <div className="max-w-7xl mx-auto px-6 py-20">

            <button
                onClick={() => {
                    localStorage.removeItem("admin");
                    window.location.href = "/admin-login";
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
            >
                Logout
            </button>
            <Link
                to="/admin-coupons"
                className="bg-pink-500 text-white px-4 py-2 rounded-xl"
            >
                Manage Coupons
            </Link>

            <h1 className="text-5xl font-bold mb-12">
                Admin Dashboard
            </h1>

            <div className="grid md:grid-cols-3 gap-8">

                <div className="bg-white shadow-xl rounded-3xl p-8">

                    <h2 className="text-gray-500 text-lg">
                        Total Products
                    </h2>

                    <h3 className="text-5xl font-bold mt-4">
                        {products.length}
                    </h3>

                </div>

                <div className="bg-white shadow-xl rounded-3xl p-8">

                    <h2 className="text-gray-500 text-lg">
                        Total Orders
                    </h2>

                    <h3 className="text-5xl font-bold mt-4">
                        {orders.length}
                    </h3>

                </div>

                <div className="bg-white shadow-xl rounded-3xl p-8">

                    <h2 className="text-gray-500 text-lg">
                        Total Revenue
                    </h2>

                    <h3 className="text-5xl font-bold mt-4 text-pink-500">
                        ₹{Number(totalRevenue).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </h3>

                </div>

            </div>

            <div className="mt-16">

                <h2 className="text-3xl font-bold mb-8">
                    Latest Orders
                </h2>

                <div className="grid gap-6">

                    {orders.slice(0, 5).map((order) => (

                        <div
                            key={order._id}
                            className="bg-white shadow-lg rounded-2xl p-6 flex justify-between items-center"
                        >

                            <div>

                                <h3 className="font-bold text-xl">
                                    {order.customerName}
                                </h3>

                                <p className="text-gray-500">
                                    {order.city}
                                </p>

                            </div>

                            <div>

                                <p className="font-bold text-pink-500 text-xl">
                                    ₹{order.totalAmount}
                                </p>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}

export default AdminDashboard;
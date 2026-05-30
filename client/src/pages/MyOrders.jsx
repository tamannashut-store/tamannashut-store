import { useEffect, useState } from "react";
import axios from "axios";

function MyOrders() {

    const [orders, setOrders] = useState([]);

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    useEffect(() => {

        fetchOrders();

    }, []);

    const fetchOrders = async () => {

        try {

            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/orders/my-orders/${user.user.id}`
            );
            console.log("ORDERS:", data);
            setOrders(data);

        } catch (error) {

            console.log(error);
        }
    };
    const getImageUrl = (image) => {
        if (!image) return "";

        if (image.startsWith("http")) {
            return image;
        }

        return `${import.meta.env.VITE_API_URL}${image}`;
    };
    
    return (

        <div className="max-w-6xl mx-auto px-6 py-20">

            <h1 className="text-4xl font-bold mb-10">
                My Orders
            </h1>

            <div className="grid gap-8">

                {orders.map((order) => (

                    <div
                        key={order._id}
                        className="bg-white shadow-xl rounded-3xl p-8"
                    >

                        <div className="flex justify-between flex-wrap gap-5">

                            <div>

                                <h2 className="text-2xl font-bold">
                                    ₹{order.totalAmount}
                                </h2>

                                <p className="text-gray-500 mt-2">
                                    Payment ID:
                                </p>

                                <p className="text-sm break-all">
                                    {order.paymentId}
                                </p>

                            </div>

                            <div>

                                <span
                                    className={`px-5 py-2 rounded-full text-sm font-semibold
                                    ${order.status === "Pending"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : order.status === "Packed"
                                                ? "bg-blue-100 text-blue-700"
                                                : order.status === "Shipped"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-green-100 text-green-700"
                                        }`}
                                >
                                    {order.status}
                                </span>

                            </div>

                        </div>

                        <div className="mt-8 grid gap-5">

                            {order.products.map((item, index) => (

                                <div
                                    key={index}
                                    className="flex items-center gap-4 bg-pink-50 rounded-2xl p-4"
                                >

                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />

                                    <div className="flex-1">

                                        <h3 className="font-semibold">
                                            {item.name}
                                        </h3>

                                        <p className="text-gray-500">
                                            Qty: {item.qty}
                                        </p>

                                    </div>

                                    <p className="font-bold">
                                        ₹{item.price * item.qty}
                                    </p>

                                </div>

                            ))}

                        </div>

                    </div>

                ))}

            </div>

        </div>
        
    );
    
}
export default MyOrders;
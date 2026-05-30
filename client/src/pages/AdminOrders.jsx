import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function AdminOrders() {

    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {

        try {

            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/orders`
            );

            setOrders(data);

        } catch (error) {

            console.log(error);

            toast.error("Failed To Load Orders");
        }
    };

    useEffect(() => {

        fetchOrders();

    }, []);

    const updateStatus = async (
        orderId,
        status
    ) => {

        try {

            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/orders/${orderId}`,
                { status }
            );

            toast.success("Order Updated");

            fetchOrders();

        } catch (error) {

            console.log(error);

            toast.error("Update Failed");
        }
    };

    return (

        <div className="max-w-7xl mx-auto px-6 py-20">

            <h1 className="text-5xl font-bold mb-10">

                Orders Management

            </h1>

            <div className="grid gap-8">

                {orders.map((order) => (

                    <div
                        key={order._id}
                        className="bg-white shadow-xl rounded-3xl p-8"
                    >

                        <div className="flex justify-between items-start">

                            <div>

                                <h2 className="text-2xl font-bold">

                                    {order.customerName}

                                </h2>

                                <p className="text-gray-500 mt-2">

                                    {order.phone}

                                </p>

                                <p className="text-gray-500">

                                    {order.address}

                                </p>

                                <p className="text-gray-500">

                                    {order.city} - {order.pincode}

                                </p>

                            </div>

                            <div>

                                <p className="font-semibold">

                                    Payment:
                                    <span className="text-pink-500 ml-2">

                                        {order.paymentMethod}

                                    </span>

                                </p>

                                <p className="font-semibold mt-2">

                                    Status:
                                    <span className="text-blue-500 ml-2">

                                        {order.status}
                                    </span>

                                </p>

                            </div>

                        </div>

                        <div className="mt-8 grid gap-4">

                            {order.products.map((item) => (

                                <div
                                    key={`${item._id}-${item.selectedSize}`}
                                    className="flex items-center gap-4 border rounded-2xl p-4"
                                >

                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />

                                    <div className="flex-1">

                                        <h3 className="font-semibold">

                                            {item.name}

                                        </h3>

                                        <p className="text-gray-500">

                                            Size:
                                            {item.selectedSize}
                                        </p>

                                        <p className="text-gray-500">

                                            Qty:
                                            {item.qty}
                                        </p>

                                    </div>

                                    <p className="font-bold">

                                        ₹
                                        {item.price * item.qty}

                                    </p>

                                </div>

                            ))}

                        </div>

                        <div className="flex justify-between items-center mt-8">

                            <h2 className="text-3xl font-bold">

                                ₹{order.totalAmount}

                            </h2>

                            <select
                                value={order.status}
                                onChange={(e) =>
                                    updateStatus(
                                        order._id,
                                        e.target.value
                                    )
                                }
                                className="border p-3 rounded-xl"
                            >

                                <option value="Pending">
                                    Pending
                                </option>

                                <option value="Processing">
                                    Processing
                                </option>

                                <option value="Shipped">
                                    Shipped
                                </option>

                                <option value="Delivered">
                                    Delivered
                                </option>

                                <option value="Cancelled">
                                    Cancelled
                                </option>

                            </select>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default AdminOrders;
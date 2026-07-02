import { useEffect, useState } from "react";
import axios from "axios";

function MyOrders() {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const userData = JSON.parse(
        localStorage.getItem("user")
    );

    const token = userData?.token;
    const downloadInvoice = async (orderId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/orders/invoice/${orderId}`,
                {
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const url = window.URL.createObjectURL(response.data);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `invoice-${orderId}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.log(error);
            toast.error("Invoice download failed");
        }
    };

    useEffect(() => {

        const loadOrders = async () => {

            try {


                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/orders/my-orders`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setOrders(data);

            } catch (error) {

                console.log(error);

            } finally {

                setLoading(false);

            }

        };

        loadOrders();

    }, [token]);

    // const fetchOrders = async () => {

    //     try {

    //         const { data } = await axios.get(
    //             `${import.meta.env.VITE_API_URL}/api/orders/my-orders/${user.user.id}`
    //         );
    //         console.log("ORDERS:", data);
    //         setOrders(data);

    //     } catch (error) {

    //         console.log(error);
    //     }
    // };
    const getImageUrl = (image) => {

        if (!image) return "";

        if (image.startsWith("http")) {
            return image;
        }

        return `${import.meta.env.VITE_API_URL}${image}`;
    };
    const cancelOrder = async (orderId) => {

        try {

            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/orders/cancel/${orderId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.error("Order Cancelled");

            setOrders(prev =>
                prev.map(o =>
                    o._id === orderId ? { ...o, status: "Cancelled" } : o
                )
            );

        } catch (error) {

            console.log(error);

            toast.error(
                error.response?.data?.message ||
                "Cancellation Failed"
            );

        }

    };
    if (loading) {

        return (

            <div className="h-screen flex items-center justify-center">

                <h1 className="text-2xl font-bold">
                    Loading Orders...
                </h1>

            </div>

        );

    }
    return (

        <div className="max-w-6xl mx-auto px-6 py-20">

            <h1 className="text-4xl font-bold mb-10">
                My Orders
            </h1>

            <div className="grid gap-8">
                {orders.length === 0 ? (

                    <div className="text-center py-20">

                        <h2 className="text-2xl font-semibold text-gray-500">

                            No Orders Found

                        </h2>

                    </div>

                ) : (

                    orders.map((order) => (

                        <div
                            key={order._id}
                            className="bg-white shadow-xl rounded-3xl p-8"
                        >

                            <div className="flex justify-between flex-wrap items-center gap-5">

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
                                                : order.status === "Processing"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : order.status === "Shipped"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : order.status === "Delivered"
                                                            ? "bg-green-100 text-green-700"
                                                            : order.status === "Cancelled"
                                                                ? "bg-red-100 text-red-700"
                                                                : ""
                                            }`}
                                    >
                                        {order.status}
                                    </span>
                                    {order.status === "Pending" && (

                                        <button
                                            onClick={() =>
                                                cancelOrder(order._id)
                                            }
                                            className="block mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
                                        >

                                            Cancel Order

                                        </button>

                                    )}
                                </div>
                                {order.tracking?.trackingId ? (
                                    <div className="mt-6 bg-gray-50 p-4 rounded-xl">
                                        <p className="font-semibold">Tracking Number</p>

                                        <p className="text-pink-500">
                                            {order.tracking.trackingId}
                                        </p>
                                        {order.tracking?.courier && (
                                            <p className="text-sm text-gray-500">
                                                Courier: {order.tracking.courier}
                                            </p>
                                        )}
                                        <a
                                            href={`https://www.shiprocket.in/shipment-tracking/?tracking_id=${order.tracking.trackingId}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block mt-3 bg-pink-500 text-white px-4 py-2 rounded-xl"
                                        >
                                            Track Package
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 mt-4">
                                        Tracking not available yet
                                    </p>
                                )}
                                <button
                                    onClick={() => downloadInvoice(order._id)}
                                    className="bg-green-500 text-white px-4 py-2 rounded-xl"
                                >
                                    Download Invoice
                                </button>
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
                                            onError={(e) => {

                                                e.target.src =
                                                    "https://dummyimage.com/80x80/e5e7eb/6b7280&text=No+Image";

                                            }}
                                        />

                                        <div className="flex-1">

                                            <h3 className="font-semibold">
                                                {item.name}
                                            </h3>
                                            <p className="text-gray-500">
                                                Qty: {item.qty}
                                            </p>
                                            <p className="text-gray-500">
                                                Selected Size: {item.selectedSize}
                                            </p>
                                        </div>

                                        <p className="font-bold">
                                            ₹{item.price * item.qty}
                                        </p>

                                    </div>

                                ))}

                            </div>
                            <div className="mt-6">

                                <div className="flex justify-between text-sm font-semibold">

                                    <span>
                                        Order Placed
                                    </span>

                                    <span>
                                        Processing
                                    </span>

                                    <span>
                                        Shipped
                                    </span>

                                    <span>
                                        Delivered
                                    </span>
                                    <span>
                                        Cancelled
                                    </span>

                                </div>

                                <div className="flex mt-2">

                                    <div
                                        className={`flex-1 h-2 ${["Pending", "Processing", "Shipped", "Delivered"].includes(order.status)
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                            }`}
                                    />

                                    <div
                                        className={`flex-1 h-2 ${["Processing", "Shipped", "Delivered"].includes(order.status)
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                            }`}
                                    />

                                    <div
                                        className={`flex-1 h-2 ${["Shipped", "Delivered"].includes(order.status)
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                            }`}
                                    />

                                    <div
                                        className={`flex-1 h-2 ${order.status === "Delivered"
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                            }`}
                                    />
                                    <div
                                        className={`flex-1 h-2 ${order.status === "Cancelled"
                                            ? "bg-red-500"
                                            : "bg-gray-300"
                                            }`}
                                    />

                                </div>

                            </div>

                        </div>

                    ))

                )}


            </div>

        </div>

    );

}
export default MyOrders;
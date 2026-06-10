import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function AdminOrders() {

    const [orders, setOrders] = useState([]);
    const [trackingInputs, setTrackingInputs] = useState({});
    const token = JSON.parse(
        localStorage.getItem("user")
    )?.token;
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const filteredOrders = orders.filter((order) => {

        const matchesSearch =
            order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
            order.phone?.includes(search) ||
            order._id?.includes(search);
    
        const matchesStatus =
            statusFilter === "All" ||
            order.status === statusFilter;
    
        return matchesSearch && matchesStatus;
    
    });
    const resendInvoice = async (orderId) => {

        try {

            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/orders/resend-invoice/${orderId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success("Invoice Sent");

        } catch (error) {

            toast.error("Failed");

        }

    };
    const viewInvoice = async (orderId) => {

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

            const url = window.URL.createObjectURL(
                new Blob([response.data], {
                    type: "application/pdf",
                })
            );

            window.open(url, "_blank");

        } catch (error) {

            console.log(error);

            toast.error("Invoice Failed");

        }

    };
    const fetchOrders = async () => {

        try {

            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/orders`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
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

    const updateStatus = async (orderId, status) => {

        try {

            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/orders/${orderId}`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success("Order Updated");

            fetchOrders();

        } catch (error) {

            console.log(error);

            toast.error("Update Failed");

        }

    };
    const getImageUrl = (image) => {
        if (!image) return "";

        if (image.startsWith("http")) {
            return image;
        }

        return `${import.meta.env.VITE_API_URL}${image}`;
    };
    const updateTracking = async (orderId, trackingNumber) => {
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/orders/${orderId}`,
                {
                    trackingNumber,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.log(error);
        }
    };
    return (

        <div className="max-w-7xl mx-auto px-6 py-20">

            <h1 className="text-5xl font-bold mb-10">

                Orders Management

            </h1>
            <input
                type="text"
                placeholder="Search Order ID, Name, Phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-3 rounded-xl w-full mb-6"
            />
            <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border p-3 rounded-xl"
>
    <option>All</option>
    <option>Pending</option>
    <option>Processing</option>
    <option>Shipped</option>
    <option>Delivered</option>
    <option>Cancelled</option>
</select>

            <div className="grid gap-8">

                {filteredOrders.map((order) => (

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
                                        src={getImageUrl(item.image)}
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
                                        <p className="text-gray-500">
                                            Email: {order.email}
                                        </p>

                                        <p className="text-gray-500">
                                            Payment Status: {order.paymentStatus}
                                        </p>
                                        <p className="text-gray-500">
                                            Ordered:
                                            {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Tracking Number"
                                            value={trackingInputs[order._id] || order.tracking?.trackingId || ""}
                                            onChange={(e) => {
                                                setTrackingInputs((prev) => ({
                                                    ...prev,
                                                    [order._id]: e.target.value,
                                                }));
                                            }}
                                            onBlur={() =>
                                                updateTracking(order._id, {
                                                    trackingId: trackingInputs[order._id],
                                                })
                                            }
                                            className="border p-2 rounded-xl"
                                        />
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
                            <div className="flex gap-2">

                                <button
                                    onClick={() => viewInvoice(order._id)}
                                    className="bg-green-500 text-white px-4 py-2 rounded-xl"
                                >
                                    Invoice
                                </button>

                                <button
                                    onClick={() =>
                                        resendInvoice(order._id)
                                    }
                                    className="bg-pink-500 text-white px-4 py-2 rounded-xl"
                                >
                                    Send Invoice
                                </button>

                            </div>
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
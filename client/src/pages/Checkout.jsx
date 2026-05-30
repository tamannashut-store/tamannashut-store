import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Checkout() {

    const {
        cartItems,
        setCartItems,
      } = useContext(CartContext);

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState("");

    const [discount, setDiscount] = useState(0);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        pincode: "",
    });
    const [paymentMethod, setPaymentMethod] =
    useState("online");
    // EMPTY CART

    if (cartItems.length === 0) {

        return (

            <div className="h-screen flex items-center justify-center">

                <h1 className="text-3xl font-bold text-gray-400">

                    Cart is Empty

                </h1>

            </div>

        );
    }

    // TOTAL PRICE

    const subtotal = cartItems.reduce(
        (acc, item) =>
            acc + item.price * item.qty,
        0
    );

    const totalAmount = subtotal - discount;

    // INPUT CHANGE

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };
    const applyCoupon = () => {

        if (coupon === "SAVE10") {

            const discountAmount =
            totalAmount * 0.1;

            setDiscount(discountAmount);

            toast.success("Coupon Applied");

        } else {

            setDiscount(0);

            toast.error("Invalid Coupon");

        }

    };
    // SUBMIT

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        for (const item of cartItems) {

            const { data: latestProduct } =
                await axios.get(
                    `import.meta.env.VITE_API_URL/api/products/${item._id}`
                );
        
                const sizeData = latestProduct.sizeStock?.find(
                    s => s.size === item.selectedSize
                  );
                  
                  if (!sizeData) {
                  
                    toast.error(
                      `${item.selectedSize} size unavailable for ${item.name}`
                    );
                  
                    setLoading(false);
                  
                    return;
                  }
                  
                  if (item.qty > sizeData.stock) {
                  
                    toast.error(
                      `${item.name} (${item.selectedSize}) stock changed`
                    );
                  
                    setLoading(false);
                  
                    return;
                  }
        }
        if (paymentMethod === "cod") {

            try {
          
              await axios.post(
                "import.meta.env.VITE_API_URL/api/orders",
                {
                  userId: JSON.parse(
                    localStorage.getItem("user")
                  )?.user?.id,
          
                  customerName: formData.name,
          
                  email: formData.email,
          
                  phone: formData.phone,
          
                  address: formData.address,
          
                  city: formData.city,
          
                  pincode: formData.pincode,
          
                  products: cartItems,
          
                  totalAmount: totalAmount,
          
                  paymentMethod: "COD",
          
                  paymentStatus: "Pending",
          
                  status: "Pending",
                }
              );
          
              localStorage.removeItem("cart");

setCartItems([]);

toast.success("Payment Successful");

navigate("/success");
          
              return;
          
            } catch (error) {
          
              console.log(error);
          
              toast.error("COD Order Failed");
          
              setLoading(false);
          
              return;
            }
          }
        try {

            // CREATE RAZORPAY ORDER

            const { data } = await axios.post(
                "import.meta.env.VITE_API_URL/api/payment/create-order",
                {
                    amount: totalAmount,
                }
            );

            // RAZORPAY OPTIONS

            const options = {

                key: import.meta.env.VITE_RAZORPAY_KEY,

                amount: data.amount,

                currency: data.currency,

                name: "Tamanna's Hut",

                description: "Kids Fashion Order",

                image: "/logo.png",

                order_id: data.id,

                prefill: {

                    name: formData.name,

                    email: formData.email,

                    contact: formData.phone,

                },

                theme: {
                    color: "#ec4899",
                },

                modal: {

                    ondismiss: function () {

                        toast.error("Payment Cancelled");

                        setLoading(false);

                    },

                },

                handler: async function (response) {

                    try {

                        // VERIFY PAYMENT

                        const verifyRes = await axios.post(
                            "import.meta.env.VITE_API_URL/api/payment/verify-payment",
                            {
                                razorpay_order_id:
                                    response.razorpay_order_id,

                                razorpay_payment_id:
                                    response.razorpay_payment_id,

                                razorpay_signature:
                                    response.razorpay_signature,
                            }
                        );

                        // IF VERIFIED

                        if (verifyRes.data.success) {

                            // SAVE ORDER

                            await axios.post(
                                "import.meta.env.VITE_API_URL/api/orders",
                                {
                                    userId: JSON.parse(
                                        localStorage.getItem("user")
                                    )?.user?.id,

                                    customerName: formData.name,

                                    email: formData.email,

                                    phone: formData.phone,

                                    address: formData.address,

                                    city: formData.city,

                                    pincode: formData.pincode,

                                    products: cartItems,

                                    totalAmount: totalAmount,

                                    paymentId:
                                        response.razorpay_payment_id,

                                    orderId:
                                        response.razorpay_order_id,
                                }
                            );

                            // CLEAR CART

                            localStorage.removeItem("cart");

setCartItems([]);

toast.success("Payment Successful");

navigate("/success");

                        } else {

                            toast.error("Payment Verification Failed");

                            setLoading(false);
                        }

                    } catch (error) {

                        console.log(error);

                        toast.error("Order Failed");

                        setLoading(false);
                    }
                },

            };

            const razor = new window.Razorpay(options);

            razor.open();

        } catch (error) {

            console.log(error);

            alert("Payment Failed");

            setLoading(false);

        }

    };

    return (

        <div className="max-w-7xl mx-auto px-6 py-20">

            <h1 className="text-4xl font-bold mb-10">

                Checkout

            </h1>

            <div className="grid md:grid-cols-2 gap-14">

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="bg-white shadow-xl rounded-3xl p-8"
                >

                    <h2 className="text-2xl font-semibold mb-6">

                        Shipping Details

                    </h2>

                    <div className="grid gap-5">

                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            onChange={handleChange}
                            className="border p-4 rounded-xl outline-none"
                            required
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            onChange={handleChange}
                            className="border p-4 rounded-xl outline-none"
                            required
                        />

                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone Number"
                            onChange={handleChange}
                            className="border p-4 rounded-xl outline-none"
                            required
                        />

                        <textarea
                            name="address"
                            placeholder="Full Address"
                            onChange={handleChange}
                            className="border p-4 rounded-xl outline-none h-32"
                            required
                        ></textarea>

                        <input
                            type="text"
                            name="city"
                            placeholder="City"
                            onChange={handleChange}
                            className="border p-4 rounded-xl outline-none"
                            required
                        />

                        <input
                            type="text"
                            name="pincode"
                            placeholder="Pincode"
                            onChange={handleChange}
                            className="border p-4 rounded-xl outline-none"
                            required
                        />

                    </div>
                    <div className="mt-8">

<h3 className="font-semibold mb-4">
  Select Payment Method
</h3>

<div className="grid gap-4">

  <label className="border p-4 rounded-2xl flex items-center gap-3 cursor-pointer">

    <input
      type="radio"
      name="payment"
      value="online"
      checked={paymentMethod === "online"}
      onChange={(e) =>
        setPaymentMethod(e.target.value)
      }
    />

    <span className="font-semibold">
      Pay Online
    </span>

  </label>

  <label className="border p-4 rounded-2xl flex items-center gap-3 cursor-pointer">

    <input
      type="radio"
      name="payment"
      value="cod"
      checked={paymentMethod === "cod"}
      onChange={(e) =>
        setPaymentMethod(e.target.value)
      }
    />

    <span className="font-semibold">
      Cash On Delivery
    </span>

  </label>

</div>

</div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-8 w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white py-4 rounded-full text-lg font-semibold transition"
                    >

                        {loading
                            ? "Processing..."
                            : `Pay ₹${totalAmount}`}

                    </button>

                </form>

                {/* ORDER SUMMARY */}

                <div className="bg-pink-50 rounded-3xl p-8 shadow-xl">

                    <h2 className="text-2xl font-semibold mb-6">

                        Order Summary

                    </h2>

                    <div className="grid gap-5">

                        {cartItems.map((item) => (

                            <div
                            key={`${item._id}-${item.selectedSize}`}
                                className="flex items-center gap-4 bg-white rounded-2xl p-4"
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

                                        Qty: {item.qty}

                                    </p>
                                    <p className="text-gray-500">

                                        Size: {item.selectedSize}

                                    </p>

                                </div>

                                <p className="font-bold">

                                    ₹{item.price * item.qty}

                                </p>

                            </div>

                        ))}

                    </div>
                    <div className="mt-8">

                        <h3 className="font-semibold mb-3">

                            Apply Coupon

                        </h3>

                        <div className="flex gap-3">

                            <input
                                type="text"
                                placeholder="Enter Coupon"
                                value={coupon}
                                onChange={(e) =>
                                    setCoupon(e.target.value)
                                }
                                className="flex-1 border p-3 rounded-xl outline-none"
                            />

                            <button
                                onClick={applyCoupon}
                                className="bg-pink-500 hover:bg-pink-600 text-white px-5 rounded-xl"
                            >

                                Apply

                            </button>

                        </div>

                    </div>
                    <div className="border-t mt-8 pt-6 space-y-4">

                        <div className="flex justify-between">

                            <span className="font-semibold">
                                Subtotal
                            </span>

                            <span>
                                ₹{subtotal}
                            </span>

                        </div>

                        <div className="flex justify-between text-green-600">

                            <span className="font-semibold">
                                Discount
                            </span>

                            <span>
                                - ₹{discount}
                            </span>

                        </div>

                        <div className="flex justify-between text-2xl font-bold">

                            <span>Total</span>

                            <span>
                                ₹{totalAmount}
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default Checkout;
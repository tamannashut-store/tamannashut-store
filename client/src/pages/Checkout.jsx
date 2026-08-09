import { useContext, useEffect, useMemo, useState } from "react";
import { CartContext } from "../context/CartContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const getCheckoutKey = () => {
  let key = sessionStorage.getItem("checkout_request_id");
  if (!key) {
    key = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem("checkout_request_id", key);
  }
  return key;
};

const productImage = (item) => item.images?.[0]?.url || item.image || "/placeholder.png";

function Checkout() {
  const { cartItems, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);
  const [formData, setFormData] = useState({
    name: user?.user?.name || "",
    email: user?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [coupon, setCoupon] = useState("");
  const [couponPercent, setCouponPercent] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
      return;
    }
    const controller = new AbortController();
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/profile/${user.user.id}`, { signal: controller.signal })
      .then(({ data }) => {
        setFormData({
          name: data.name || "",
          email: data.email || user.user.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          pincode: data.pincode || "",
        });
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") console.error(error);
      });
    return () => controller.abort();
  }, [navigate, user]);

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const discount = subtotal * (couponPercent / 100);
  const displayedTotal = Math.max(subtotal - discount, 0);
  const checkoutProducts = cartItems.map((item) => ({
    _id: item._id,
    selectedSize: item.selectedSize,
    qty: item.qty,
  }));

  const updateField = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return toast.error("Enter a coupon code");
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/coupons/validate`, { code: coupon });
      setCouponPercent(Number(data.discount || 0));
      setCoupon(coupon.trim().toUpperCase());
      toast.success("Coupon applied");
    } catch (error) {
      setCouponPercent(0);
      toast.error(error.response?.data?.message || "Coupon is invalid or expired");
    }
  };

  const finishOrder = () => {
    sessionStorage.removeItem("checkout_request_id");
    clearCart();
    toast.success("Order placed successfully");
    navigate("/success");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user || cartItems.length === 0) return;
    if (!/^\d{6}$/.test(formData.pincode.trim())) return toast.error("Enter a valid 6-digit pincode");
    if (!/^\+?[0-9]{10,13}$/.test(formData.phone.replace(/\s/g, ""))) return toast.error("Enter a valid phone number");

    setLoading(true);
    const idempotencyKey = getCheckoutKey();
    const customer = { ...formData, phone: formData.phone.replace(/\s/g, "") };
    const couponCode = couponPercent > 0 ? coupon : "";

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile/${user.user.id}`, {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode,
      });

      if (paymentMethod === "cod") {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, {
          customer,
          products: checkoutProducts,
          couponCode,
          paymentMethod: "COD",
          idempotencyKey,
        });
        finishOrder();
        return;
      }

      if (!window.Razorpay) throw new Error("Payment service is still loading. Please try again.");
      const { data: razorpayOrder } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/create-order`,
        { products: checkoutProducts, couponCode, customer }
      );

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Tamanna's Hut",
        description: "Kids fashion order",
        order_id: razorpayOrder.id,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: "#355E3B" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment cancelled");
          },
        },
        handler: async (response) => {
          try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/verify-payment`, {
              ...response,
              customer,
              products: checkoutProducts,
              couponCode,
              idempotencyKey,
            });
            finishOrder();
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment was received but order verification failed. Contact support.");
            setLoading(false);
          }
        },
      });
      razorpay.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment failed");
        setLoading(false);
      });
      razorpay.open();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || "Checkout failed");
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="rounded-3xl border bg-white p-12 shadow-sm">
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-3 text-gray-500">Add something special before checking out.</p>
          <Link to="/shop" className="mt-7 inline-block rounded-xl bg-brand-primary px-6 py-3 text-white">Continue shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-background py-12 md:py-16">
      <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[1fr_420px] lg:px-6">
        <div>
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[3px] text-brand-primary">Secure checkout</p>
            <h1 className="mt-2 text-4xl font-bold">Delivery and payment</h1>
          </div>

          <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Delivery address</h2>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Secure</span>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["name", "Full name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone number", "tel"],
                ["pincode", "Pincode", "text"],
                ["city", "City", "text"],
              ].map(([name, label, type]) => (
                <label key={name}>
                  <span className="mb-2 block text-sm font-medium">{label}</span>
                  <input required name={name} type={type} value={formData[name]} onChange={updateField} readOnly={name === "email"} className="w-full rounded-xl border bg-white p-3.5 outline-none focus:border-brand-primary read-only:bg-gray-50" />
                </label>
              ))}
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">Complete address</span>
                <textarea required name="address" rows="4" value={formData.address} onChange={updateField} placeholder="House number, street, landmark" className="w-full rounded-xl border p-3.5 outline-none focus:border-brand-primary" />
              </label>
            </div>
          </section>

          <section className="mt-7 rounded-3xl border bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-semibold">Payment method</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-2xl border-2 p-5 transition ${paymentMethod === "online" ? "border-brand-primary bg-green-50/50" : "border-gray-200"}`}>
                <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} className="mr-3" />
                <span className="font-semibold">Pay securely online</span>
                <p className="mt-2 text-sm text-gray-500">UPI, cards, netbanking and wallets through Razorpay.</p>
              </label>
              <label className={`cursor-pointer rounded-2xl border-2 p-5 transition ${paymentMethod === "cod" ? "border-brand-primary bg-green-50/50" : "border-gray-200"}`}>
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mr-3" />
                <span className="font-semibold">Cash on delivery</span>
                <p className="mt-2 text-sm text-gray-500">Pay when your order reaches you.</p>
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-2xl font-semibold">Order summary</h2>
          <div className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={`${item._id}-${item.selectedSize}`} className="flex gap-3">
                <img src={productImage(item)} alt={item.name} className="h-20 w-16 rounded-xl bg-gray-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-500">Size {item.selectedSize} · Qty {item.qty}</p>
                  <p className="mt-1 font-semibold">₹{(Number(item.price) * item.qty).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-5">
            <label className="text-sm font-medium">Coupon code</label>
            <div className="mt-2 flex gap-2">
              <input value={coupon} onChange={(event) => { setCoupon(event.target.value.toUpperCase()); setCouponPercent(0); }} placeholder="Enter code" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 uppercase" />
              <button type="button" onClick={applyCoupon} className="rounded-xl border border-brand-primary px-4 font-medium text-brand-primary">Apply</button>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t pt-5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-green-700">Free</span></div>
            {discount > 0 && <div className="flex justify-between text-green-700"><span>Coupon discount</span><span>−₹{discount.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between border-t pt-4 text-xl font-bold"><span>Total</span><span>₹{displayedTotal.toLocaleString("en-IN")}</span></div>
          </div>

          <button disabled={loading} type="submit" className="mt-6 w-full rounded-xl bg-brand-primary py-4 font-semibold text-white transition hover:bg-[#2d4d33] disabled:bg-gray-400">
            {loading ? "Processing securely…" : paymentMethod === "cod" ? "Place COD order" : `Pay ₹${displayedTotal.toLocaleString("en-IN")}`}
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-gray-500">Prices and stock are verified securely before your order is placed.</p>
        </aside>
      </form>
    </main>
  );
}

export default Checkout;

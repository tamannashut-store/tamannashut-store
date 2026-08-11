import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CartContext } from "../context/CartContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { trackEvent } from "../utils/analytics";

const getCheckoutKey = () => {
  let key = sessionStorage.getItem("checkout_request_id");
  if (!key) {
    key = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem("checkout_request_id", key);
  }
  return key;
};

const productImage = (item) => item.image || item.images?.[0]?.url || "/placeholder.png";

const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-payment-provider="razorpay"]');
    if (existing) { existing.addEventListener("load", resolve, { once: true }); existing.addEventListener("error", reject, { once: true }); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.paymentProvider = "razorpay";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Payment service could not be loaded"));
    document.head.appendChild(script);
  });
};

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
    state: "",
    country: "India",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [coupon, setCoupon] = useState("");
  const [couponPercent, setCouponPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addressChecking, setAddressChecking] = useState(false);
  const [addressStatus, setAddressStatus] = useState("idle");

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
          state: data.state || data.State || "",
          country: "India",
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
    selectedSku: item.selectedSku || "",
    qty: item.qty,
  }));

  const updateField = (event) => {
    const { name, value } = event.target;
    if (name === "pincode") setAddressStatus("idle");
    setFormData((current) => ({ ...current, [name]: value, ...(name === "pincode" ? { city: "", state: "" } : {}) }));
  };

  const resolvePincode = useCallback(async (showSuccess = false) => {
    const pincode = formData.pincode.trim();
    if (!/^\d{6}$/.test(pincode)) { toast.error("Enter a valid 6-digit pincode"); return null; }
    setAddressChecking(true);
    setAddressStatus("checking");
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/logistics/postcode/${pincode}`, { params: { cod: paymentMethod === "cod" ? 1 : 0 } });
      setFormData((current) => ({ ...current, pincode: data.pincode, city: data.city, state: data.state }));
      setAddressStatus("verified");
      if (showSuccess) toast.success("Delivery location verified");
      return data;
    } catch (error) { setAddressStatus("error"); toast.error(error.response?.data?.message || "This pincode could not be verified for delivery"); return null; }
    finally { setAddressChecking(false); }
  }, [formData.pincode, paymentMethod]);

  useEffect(() => {
    if (!/^\d{6}$/.test(formData.pincode.trim())) return undefined;
    const timer = setTimeout(() => { resolvePincode(false); }, 350);
    return () => clearTimeout(timer);
  }, [formData.pincode, paymentMethod, resolvePincode]);

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
    trackEvent("purchase", { currency: "INR", value: displayedTotal, transaction_id: getCheckoutKey(), items: cartItems.map((item) => ({ item_id: item._id, item_name: item.name, item_variant: item.selectedColor, price: Number(item.price), quantity: Number(item.qty) })) });
    sessionStorage.removeItem("checkout_request_id");
    clearCart();
    toast.success("Order placed successfully");
    navigate("/success");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user || cartItems.length === 0) return;
    if (formData.name.trim().length < 2) return toast.error("Enter the recipient's full name");
    if (!/^\+?[0-9]{10,13}$/.test(formData.phone.replace(/\s/g, ""))) return toast.error("Enter a valid phone number");
    if (formData.address.trim().length < 10) return toast.error("Enter a complete house, street and landmark address");
    const locality = await resolvePincode();
    if (!locality) return;

    setLoading(true);
    const idempotencyKey = getCheckoutKey();
    const customer = { ...formData, city: locality.city, state: locality.state, pincode: locality.pincode, phone: formData.phone.replace(/\s/g, "") };
    const couponCode = couponPercent > 0 ? coupon : "";

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile/${user.user.id}`, {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
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

      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Payment service is still loading. Please try again.");
      const { data: razorpayOrder } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/create-order`,
        { products: checkoutProducts, couponCode, customer, idempotencyKey }
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
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="rounded-3xl border bg-white p-6 shadow-sm sm:p-12">
          <h1 className="text-2xl font-semibold sm:text-3xl">Your cart is empty</h1>
          <p className="mt-3 text-gray-500">Add something special before checking out.</p>
          <Link to="/shop" className="mt-7 inline-block rounded-xl bg-brand-primary px-6 py-3 text-white">Continue shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full overflow-x-clip bg-brand-background py-8 sm:py-12 md:py-16">
      <form onSubmit={handleSubmit} className="mx-auto grid w-full min-w-0 max-w-7xl gap-6 px-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8 lg:px-6">
        <div className="min-w-0">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[3px] text-brand-primary">Secure checkout</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Delivery and payment</h1>
          </div>

          <section className="min-w-0 rounded-3xl border bg-white p-4 shadow-sm sm:p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold sm:text-2xl">Delivery address</h2>
              <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Secure</span>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["name", "Recipient full name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone number", "tel"],
                ["pincode", "Pincode", "text"],
                ["city", "City", "text"],
                ["state", "State", "text"],
                ["country", "Country", "text"],
              ].map(([name, label, type]) => (
                <label key={name} className="min-w-0">
                  <span className="mb-2 block text-sm font-medium">{label}</span>
                  <input required name={name} type={type} value={formData[name]} onChange={updateField} minLength={name === "name" ? 2 : undefined} maxLength={name === "pincode" ? 6 : name === "phone" ? 13 : undefined} pattern={name === "pincode" ? "[0-9]{6}" : name === "phone" ? "[+]?[0-9]{10,13}" : undefined} inputMode={name === "pincode" ? "numeric" : name === "phone" ? "tel" : undefined} autoComplete={name === "name" ? "name" : name === "email" ? "email" : name === "phone" ? "tel" : name === "pincode" ? "postal-code" : name === "city" ? "address-level2" : name === "state" ? "address-level1" : name === "country" ? "country-name" : undefined} readOnly={["email", "city", "state", "country"].includes(name)} className="w-full min-w-0 max-w-full rounded-xl border bg-white p-3.5 outline-none focus:border-brand-primary read-only:bg-gray-50" />
                </label>
              ))}
              {addressChecking && <p className="text-sm text-brand-primary sm:col-span-2">Checking delivery location…</p>}
              {!addressChecking && addressStatus === "verified" && <p className="text-sm font-medium text-emerald-700 sm:col-span-2">✓ Pincode verified for {paymentMethod === "cod" ? "cash on delivery" : "prepaid delivery"}</p>}
              {!addressChecking && addressStatus === "error" && <p className="text-sm font-medium text-red-600 sm:col-span-2">Delivery is unavailable or the pincode could not be verified.</p>}
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">House, street and landmark</span>
                <textarea required minLength="10" maxLength="500" name="address" rows="4" value={formData.address} onChange={updateField} autoComplete="street-address" placeholder="House/flat number, building, street, area and nearby landmark" className="w-full rounded-xl border p-3.5 outline-none focus:border-brand-primary" />
                <span className="mt-2 block text-xs text-gray-500">Include enough detail for the courier to locate the address without calling repeatedly.</span>
              </label>
            </div>
          </section>

          <section className="mt-6 min-w-0 rounded-3xl border bg-white p-4 shadow-sm sm:mt-7 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold sm:text-2xl">Payment method</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={`min-w-0 cursor-pointer rounded-2xl border-2 p-4 transition sm:p-5 ${paymentMethod === "online" ? "border-brand-primary bg-green-50/50" : "border-gray-200"}`}>
                <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} className="mr-3" />
                <span className="font-semibold">Pay securely online</span>
                <p className="mt-2 text-sm text-gray-500">UPI, cards, netbanking and wallets through Razorpay.</p>
              </label>
              <label className={`min-w-0 cursor-pointer rounded-2xl border-2 p-4 transition sm:p-5 ${paymentMethod === "cod" ? "border-brand-primary bg-green-50/50" : "border-gray-200"}`}>
                <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mr-3" />
                <span className="font-semibold">Cash on delivery</span>
                <p className="mt-2 text-sm text-gray-500">Pay when your order reaches you.</p>
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit min-w-0 max-w-full rounded-3xl border bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-xl font-semibold sm:text-2xl">Order summary</h2>
          <div className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={`${item._id}-${item.selectedSize}`} className="flex gap-3">
                <img src={productImage(item)} alt={item.name} className="h-20 w-16 rounded-xl bg-gray-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.selectedColor ? `${item.selectedColor} · ` : ""}Size {item.selectedSize} · Qty {item.qty}</p>
                  <p className="mt-1 font-semibold">₹{(Number(item.price) * item.qty).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-5">
            <label className="text-sm font-medium">Coupon code</label>
            <div className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
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

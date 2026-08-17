import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { productPath } from "../utils/productUrl";

const itemKey = (item) => `${item._id}-${item.selectedSku || item.selectedSize}`;
const itemImage = (item) => item.image || item.images?.[0]?.url || "/placeholder.png";

function Cart() {
  const { cartItems, removeFromCart, increaseQty, decreaseQty } = useContext(CartContext);
  const [invalidItems, setInvalidItems] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const validate = async () => {
      if (cartItems.length === 0) return setInvalidItems([]);
      setChecking(true);
      const results = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${item._id}`, { signal: controller.signal });
            const size = data.variants?.find((entry) => entry.sku === item.selectedSku) || data.sizeStock?.find((entry) => entry.size === item.selectedSize);
            return !size || Number(size.stock) < Number(item.qty) ? itemKey(item) : null;
          } catch (error) {
            return error.code === "ERR_CANCELED" ? null : itemKey(item);
          }
        })
      );
      if (!controller.signal.aborted) {
        setInvalidItems(results.filter(Boolean));
        setChecking(false);
      }
    };
    validate();
    return () => controller.abort();
  }, [cartItems]);

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const hasInvalidItems = invalidItems.length > 0;

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="rounded-3xl border bg-white p-12 shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-background text-3xl">🛍️</div>
          <h1 className="mt-6 text-3xl font-semibold">Your bag is waiting</h1>
          <p className="mt-3 text-gray-500">Explore comfortable styles made for little moments.</p>
          <Link to="/shop" className="mt-7 inline-block rounded-xl bg-brand-primary px-7 py-3.5 font-medium text-white">Start shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-6">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[3px] text-brand-primary">Your selection</p>
            <h1 className="mt-2 text-4xl font-bold">Shopping bag</h1>
          </div>
          <p className="text-gray-500">{cartItems.reduce((sum, item) => sum + item.qty, 0)} items</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-4">
            {cartItems.map((item) => {
              const invalid = invalidItems.includes(itemKey(item));
              return (
                <article key={itemKey(item)} className={`rounded-3xl border bg-white p-4 shadow-sm transition sm:p-5 ${invalid ? "border-red-300" : "border-gray-100"}`}>
                  <div className="flex gap-4 sm:gap-6">
                    <Link to={productPath(item)} className="shrink-0">
                      <img src={itemImage(item)} alt={item.name} className="h-32 w-24 rounded-2xl bg-gray-100 object-cover sm:h-40 sm:w-32" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={productPath(item)} className="line-clamp-2 text-lg font-semibold hover:text-brand-primary sm:text-xl">{item.name}</Link>
                          <p className="mt-2 text-sm text-gray-500">Size: <span className="font-medium text-gray-700">{item.selectedSize}</span>{item.selectedColor && <> · Colour: <span className="font-medium text-gray-700">{item.selectedColor}</span></>}</p>
                        </div>
                        <button onClick={() => removeFromCart(item._id, item.selectedSize, item.selectedSku)} className="text-sm text-gray-500 underline hover:text-red-600">Remove</button>
                      </div>

                      {invalid && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">This size is unavailable or the requested quantity exceeds stock.</p>}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center rounded-xl border">
                          <button aria-label="Decrease quantity" onClick={() => decreaseQty(item._id, item.selectedSize, item.selectedSku)} className="h-10 w-10 text-xl hover:bg-gray-50">−</button>
                          <span className="w-10 text-center font-semibold">{item.qty}</span>
                          <button aria-label="Increase quantity" onClick={() => increaseQty(item._id, item.selectedSize, item.selectedSku)} className="h-10 w-10 text-xl hover:bg-gray-50">+</button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-brand-primary">₹{(Number(item.price) * item.qty).toLocaleString("en-IN")}</p>
                          {item.qty > 1 && <p className="text-xs text-gray-500">₹{Number(item.price).toLocaleString("en-IN")} each</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-3xl border bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-2xl font-semibold">Price details</h2>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-medium text-green-700">Free</span></div>
              <div className="flex justify-between border-t pt-4 text-xl font-bold"><span>Total</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
            </div>
            {hasInvalidItems ? (
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">Remove or reduce unavailable items before checkout.</div>
            ) : (
              <Link to="/checkout" className={`mt-6 block rounded-xl py-4 text-center font-semibold text-white ${checking ? "pointer-events-none bg-gray-400" : "bg-brand-primary hover:bg-[#2d4d33]"}`}>
                {checking ? "Checking availability…" : "Proceed to checkout"}
              </Link>
            )}
            <Link to="/shop" className="mt-4 block text-center text-sm font-medium text-brand-primary">Continue shopping</Link>
            <div className="mt-6 border-t pt-5 text-sm text-gray-500">
              <p>✓ Secure checkout</p>
              <p className="mt-2">✓ Easy returns according to our policy</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Cart;

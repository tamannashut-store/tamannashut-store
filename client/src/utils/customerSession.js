import axios from "axios";
import toast from "react-hot-toast";

export async function startCustomerSession(data) {
  localStorage.setItem("user", JSON.stringify(data));
  axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
  const read = (storage, key) => { try { const cart = JSON.parse(storage.getItem(key)); return Array.isArray(cart) ? cart : []; } catch { return []; } };
  const pending = read(sessionStorage, "pending_guest_cart");
  const cart = pending.length ? pending : read(localStorage, "guest_cart");
  let synced = true;
  if (cart.length) {
    try { await axios.post(`${import.meta.env.VITE_API_URL}/api/cart/merge`, { items: cart.map((item) => ({ productId: item._id, selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty })) }); }
    catch { synced = false; toast.error("Signed in, but your bag could not sync. Your saved guest bag has been kept for another attempt."); }
  }
  if (synced) { localStorage.removeItem("guest_cart"); sessionStorage.removeItem("pending_guest_cart"); }
  window.dispatchEvent(new Event("cartUpdated"));
  const destination = sessionStorage.getItem("redirectAfterLogin") || "/";
  sessionStorage.removeItem("redirectAfterLogin");
  return destination.startsWith("/") && !destination.startsWith("//") ? destination : "/";
}

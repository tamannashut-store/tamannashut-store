/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useEffect,
  useRef,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const CartContext = createContext();

function CartProvider({ children }) {
  const [cartKey, setCartKey] = useState(() => {
    const user = JSON.parse(
      localStorage.getItem("user")
    );
  
    return user?.user?.id
      ? `cart_${user.user.id}`
      : "guest_cart";
  });
  
  const [cartItems, setCartItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const syncQueue = useRef(Promise.resolve());

  const persistAccountCart = (items) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.token) return;
    const payload = items.map((item) => ({ productId: item._id, selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty }));
    syncQueue.current = syncQueue.current
      .catch(() => undefined)
      .then(() => axios.put(`${import.meta.env.VITE_API_URL}/api/cart`, { items: payload }, {
        headers: { Authorization: `Bearer ${user.token}` },
      }))
      .catch((error) => {
        console.error("Cart could not be saved", error);
        toast.error("Your cart could not sync. Please check your connection.");
      });
  };

  // LOAD CART
  useEffect(() => {

    const loadCart = async () => {
      setHydrated(false);
  
      const user = JSON.parse(
        localStorage.getItem("user")
      );
  
      const newCartKey =
        user?.user?.id
          ? `cart_${user.user.id}`
          : "guest_cart";
  
      setCartKey(newCartKey);
  
      if (user?.token) {
        try {
          const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/cart`);
          let serverItems = data.items || [];
          const migrationKey = `cart_migrated_${user.user?.id}`;
          const cached = JSON.parse(localStorage.getItem(newCartKey) || "[]");
          if (!localStorage.getItem(migrationKey) && cached.length) {
            const merged = await axios.post(`${import.meta.env.VITE_API_URL}/api/cart/merge`, {
              items: cached.map((item) => ({ productId: item._id, selectedSize: item.selectedSize, selectedSku: item.selectedSku || "", qty: item.qty })),
            });
            serverItems = merged.data.items || serverItems;
          }
          localStorage.setItem(migrationKey, "1");
          setCartItems(serverItems);
          setHydrated(true);
        } catch (error) {
          if (error.response?.status !== 401) console.error("Cart sync failed", error);
          const cachedCart = localStorage.getItem(newCartKey);
          setCartItems(cachedCart ? JSON.parse(cachedCart) : []);
          setHydrated(true);
        }
      } else {
        const savedCart = localStorage.getItem("guest_cart");
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
        setHydrated(true);
      }
    };
  
    loadCart();
  
    window.addEventListener(
      "cartUpdated",
      loadCart
    );
  
    return () => {
      window.removeEventListener(
        "cartUpdated",
        loadCart
      );
    };
  
  }, []);

  // SAVE CART
  useEffect(() => {

    if (!hydrated) return undefined;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.token) {
      localStorage.setItem("guest_cart", JSON.stringify(cartItems));
      return undefined;
    }
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    return undefined;
  }, [cartItems, cartKey, hydrated]);

  // ADD TO CART
  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert("Product Out Of Stock");
      return;
    }

    const existingItem =
      cartItems.find(
        (item) =>
          item._id === product._id &&
          item.selectedSize === product.selectedSize &&
          (item.selectedSku || "") === (product.selectedSku || "")
      );

    let updatedCart;

    if (existingItem) {
      const sizeData = product.variants?.find((variant) => variant.sku === product.selectedSku) || product.sizeStock?.find((s) => s.size === product.selectedSize);

      if (
        existingItem.qty >=
        (sizeData?.stock || 0)
      ) {
        alert("Maximum stock reached");
        return;
      }

      updatedCart = cartItems.map(
        (item) =>
          item._id === product._id &&
            item.selectedSize === product.selectedSize &&
            (item.selectedSku || "") === (product.selectedSku || "")
            ? {
              ...item,
              qty: item.qty + 1,
            }
            : item
      );
    } else {
      updatedCart = [
        ...cartItems,
        {
          ...product,
          image: product.image || product.images?.[0]?.url || "",
          qty: 1,
        },
      ];
    }

    setCartItems(updatedCart);
    persistAccountCart(updatedCart);
  };

  // INCREASE QTY
  const increaseQty = (
    id,
    selectedSize,
    selectedSku = ""
  ) => {
    const updatedCart =
      cartItems.map((item) => {
        if (
          item._id === id &&
          item.selectedSize === selectedSize &&
          (item.selectedSku || "") === selectedSku
        ) {
          const sizeData = item.variants?.find((variant) => variant.sku === item.selectedSku) || item.sizeStock?.find((s) => s.size === item.selectedSize);

          if (
            item.qty >=
            (sizeData?.stock || 0)
          ) {
            alert(
              "Maximum stock reached"
            );
            return item;
          }

          return {
            ...item,
            qty: item.qty + 1,
          };
        }

        return item;
      });

    setCartItems(updatedCart);
    persistAccountCart(updatedCart);
  };

  // DECREASE QTY
  const decreaseQty = (
    id,
    selectedSize,
    selectedSku = ""
  ) => {
    const updatedCart = cartItems
      .map((item) => {
        if (
          item._id === id &&
          item.selectedSize === selectedSize &&
          (item.selectedSku || "") === selectedSku
        ) {
          return {
            ...item,
            qty: item.qty - 1,
          };
        }

        return item;
      })
      .filter(
        (item) => item.qty > 0
      );

    setCartItems(updatedCart);
    persistAccountCart(updatedCart);
  };

  // REMOVE ITEM
  const removeFromCart = (
    id,
    selectedSize,
    selectedSku = ""
  ) => {
    const updatedCart =
      cartItems.filter(
        (item) =>
          !(
            item._id === id &&
            item.selectedSize === selectedSize &&
            (item.selectedSku || "") === selectedSku
          )
      );

    setCartItems(updatedCart);
    persistAccountCart(updatedCart);
  };

  // CLEAR CART
  const clearCart = () => {

    setCartItems([]);
    persistAccountCart([]);
  
    localStorage.removeItem(
      cartKey
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;

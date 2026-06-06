import {
  createContext,
  useState,
  useEffect,
} from "react";

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

  // LOAD CART
  useEffect(() => {

    const loadCart = () => {
  
      const user = JSON.parse(
        localStorage.getItem("user")
      );
  
      const newCartKey =
        user?.user?.id
          ? `cart_${user.user.id}`
          : "guest_cart";
  
      setCartKey(newCartKey);
  
      const savedCart =
        localStorage.getItem(newCartKey);
  
      setCartItems(
        savedCart
          ? JSON.parse(savedCart)
          : []
      );
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

  localStorage.setItem(
    cartKey,
    JSON.stringify(cartItems)
  );

}, [cartItems, cartKey]);

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
          item.selectedSize ===
          product.selectedSize
      );

    let updatedCart;

    if (existingItem) {
      const sizeData =
        product.sizeStock?.find(
          (s) =>
            s.size ===
            product.selectedSize
        );

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
            item.selectedSize ===
            product.selectedSize
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
          qty: 1,
        },
      ];
    }

    setCartItems(updatedCart);
  };

  // INCREASE QTY
  const increaseQty = (
    id,
    selectedSize
  ) => {
    const updatedCart =
      cartItems.map((item) => {
        if (
          item._id === id &&
          item.selectedSize ===
          selectedSize
        ) {
          const sizeData =
            item.sizeStock?.find(
              (s) =>
                s.size ===
                item.selectedSize
            );

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
  };

  // DECREASE QTY
  const decreaseQty = (
    id,
    selectedSize
  ) => {
    const updatedCart = cartItems
      .map((item) => {
        if (
          item._id === id &&
          item.selectedSize ===
          selectedSize
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
  };

  // REMOVE ITEM
  const removeFromCart = (
    id,
    selectedSize
  ) => {
    const updatedCart =
      cartItems.filter(
        (item) =>
          !(
            item._id === id &&
            item.selectedSize ===
            selectedSize
          )
      );

    setCartItems(updatedCart);
  };

  // CLEAR CART
  const clearCart = () => {

    setCartItems([]);
  
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
import {
  createContext,
  useState,
  useEffect,
} from "react";

export const CartContext =
  createContext();

function CartProvider({
  children,
}) {

  const [cartItems, setCartItems] = useState(() => {

    const savedCart =
      localStorage.getItem("cart");
  
    return savedCart
      ? JSON.parse(savedCart)
      : [];
  
  });

  // LOAD CART

  useEffect(() => {

    const savedCart =
      localStorage.getItem("cart");

    if (savedCart) {

      setCartItems(
        JSON.parse(savedCart)
      );
    }

  }, []);

  // SAVE CART

  useEffect(() => {

    localStorage.setItem(
      "cart",
      JSON.stringify(cartItems)
    );

  }, [cartItems]);

  const addToCart = (product) => {

    // OUT OF STOCK

    if (product.stock <= 0) {

      alert("Product Out Of Stock");

      return;
    }

    // SAME PRODUCT + SAME SIZE

    const existingItem =
      cartItems.find(
        (item) =>
          item._id ===
            product._id &&
          item.selectedSize ===
            product.selectedSize
      );

    let updatedCart;

    if (existingItem) {

      const sizeData = product.sizeStock?.find(
        s => s.size === product.selectedSize
      );
    
      if (
        existingItem.qty >=
        (sizeData?.stock || 0)
      ) {
        alert("Maximum stock reached");
        return;
      }
    
      updatedCart = cartItems.map(
        item =>
          item._id === product._id &&
          item.selectedSize === product.selectedSize
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
  
          // STOCK LIMIT
  
          const sizeData = item.sizeStock?.find(
            s => s.size === item.selectedSize
          );
          
          if (item.qty >= (sizeData?.stock || 0)) {
            alert("Maximum stock reached");
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
  
  const decreaseQty = (
    id,
    selectedSize
  ) => {
  
    const updatedCart =
      cartItems
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
  const removeFromCart = (id, selectedSize) => {

    const updatedCart = cartItems.filter(
      item =>
        !(
          item._id === id &&
          item.selectedSize === selectedSize
        )
    );
  
    setCartItems(updatedCart);
  
    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  };
  useEffect(() => {

    localStorage.setItem(
      "cart",
      JSON.stringify(cartItems)
    );
  
  }, [cartItems]);
  return (

    <CartContext.Provider
  value={{
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    increaseQty,
    decreaseQty,
  }}
>

      {children}

    </CartContext.Provider>
  );
}

export default CartProvider;
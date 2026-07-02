import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Container from "../components/Container";
export const WishlistContext = createContext();

function WishlistProvider({ children }) {

  const [wishlistItems, setWishlistItems] = useState(() => {

    const storedWishlist =
      localStorage.getItem("wishlist");

    return storedWishlist
      ? JSON.parse(storedWishlist)
      : [];

  });

  useEffect(() => {

    localStorage.setItem(
      "wishlist",
      JSON.stringify(wishlistItems)
    );

  }, [wishlistItems]);

  const addToWishlist = (product) => {

    const exists = wishlistItems.find(
      (item) => item._id === product._id
    );

    if (exists) {

      toast.error("Already In Wishlist");

      return;
    }

    setWishlistItems([...wishlistItems, product]);

    toast.success("Added To Wishlist");

  };

  const removeFromWishlist = (id) => {

    setWishlistItems(
      wishlistItems.filter(
        (item) => item._id !== id
      )
    );

    toast.success("Removed From Wishlist");

  };

  return (
    <Container className="py-20">
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
      }}
    >

      {children}

    </WishlistContext.Provider>
    </Container>
  );
}

export default WishlistProvider;
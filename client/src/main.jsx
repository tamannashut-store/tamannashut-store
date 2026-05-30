import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import CartProvider from "./context/CartContext";
import WishlistProvider from "./context/WishlistContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

<WishlistProvider>

<CartProvider>

  <App />
{/* 
  <Toaster
    position="top-right"
    reverseOrder={false}
  /> */}

</CartProvider>

</WishlistProvider>

  </React.StrictMode>
);
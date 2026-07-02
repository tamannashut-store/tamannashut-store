import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import "./index.css";
import CartProvider from "./context/CartContext";
import WishlistProvider from "./context/WishlistContext";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/roboto";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <WishlistProvider>
          <CartProvider>
            <App />
            <Toaster position="top-right" />
          </CartProvider>
        </WishlistProvider>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
);
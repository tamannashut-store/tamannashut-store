import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import "./index.css";
import CartProvider from "./context/CartContext";
import WishlistProvider from "./context/WishlistContext";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import * as Sentry from "@sentry/react";
import "./monitoring/sentry";
import AppErrorFallback from "./components/AppErrorFallback";
import { readSession } from "./utils/storage";

const storedUser = readSession();
if (storedUser?.token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${storedUser.token}`;
}

let handlingExpiredSession = false;
const customerProtectedPaths = ["/checkout", "/profile", "/my-orders", "/account", "/change-password", "/dashboard"];

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      delete axios.defaults.headers.common.Authorization;
      if (!handlingExpiredSession) {
        handlingExpiredSession = true;
        window.dispatchEvent(new CustomEvent("sessionExpired"));
        const path = window.location.pathname;
        if (path.startsWith("/admin") || path.startsWith("/seller")) {
          sessionStorage.setItem("redirectAfterSellerLogin", `${path}${window.location.search}`);
          window.location.replace("/admin-login?reason=session-expired");
        } else if (customerProtectedPaths.some((protectedPath) => path === protectedPath || path.startsWith(`${protectedPath}/`))) {
          sessionStorage.setItem("redirectAfterLogin", `${path}${window.location.search}`);
          window.location.replace("/login?reason=session-expired");
        } else {
          window.setTimeout(() => { handlingExpiredSession = false; }, 0);
        }
      }
    }
    if (error.response?.status >= 500) Sentry.captureException(error, { tags: { source: "api" } });

    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <HelmetProvider>
        <WishlistProvider>
          <CartProvider>
            <Sentry.ErrorBoundary fallback={<AppErrorFallback/>}>
              <App />
            </Sentry.ErrorBoundary>
            <Toaster position="top-right" />
          </CartProvider>
        </WishlistProvider>
      </HelmetProvider>
  </React.StrictMode>
);

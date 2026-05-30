import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProductDetails from "./pages/ProductDetails";
import Footer from "./components/Footer"
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import Shop from "./pages/Shop";
import WhatsAppButton from "./components/WhatsAppButton";
import Success from "./pages/Success";
import AdminOrders from "./pages/AdminOrders";
import EditProduct from "./pages/EditProduct";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile"

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      {/* <div className="h-[110px]"></div> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/success" element={<Success />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/edit/:id"
          element={<EditProduct />}
        />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route
          path="/wishlist"
          element={<Wishlist />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />
      </Routes>
      <WhatsAppButton />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
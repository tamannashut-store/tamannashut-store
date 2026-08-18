import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import StoreLayout from "./components/StoreLayout";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";
import SellerRoute from "./components/SellerRoute";

const Home = lazy(() => import("./pages/Home")); const Login = lazy(() => import("./pages/Login")); const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword")); const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard")); const ProductDetails = lazy(() => import("./pages/ProductDetails")); const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout")); const Shop = lazy(() => import("./pages/Shop")); const Success = lazy(() => import("./pages/Success"));
const MyOrders = lazy(() => import("./pages/MyOrders")); const Wishlist = lazy(() => import("./pages/Wishlist")); const Profile = lazy(() => import("./pages/Profile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword")); const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy")); const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy")); const TermsConditions = lazy(() => import("./pages/TermsConditions")); const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About")); const Admin = lazy(() => import("./pages/Admin")); const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const EditProduct = lazy(() => import("./pages/EditProduct")); const AdminDashboard = lazy(() => import("./pages/AdminDashboard")); const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminContacts = lazy(() => import("./pages/AdminContacts")); const AdminLogin = lazy(() => import("./pages/AdminLogin")); const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminOperations = lazy(() => import("./pages/AdminOperations"));
const AdminTeam = lazy(() => import("./pages/AdminTeam"));
const AdminSellerListings = lazy(() => import("./pages/AdminSellerListings"));
const SellerRegister = lazy(() => import("./pages/SellerRegister"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const SellerAccount = lazy(() => import("./pages/SellerAccount"));
const SellerSettlements = lazy(() => import("./pages/SellerSettlements"));
const AdminSettlements = lazy(() => import("./pages/AdminSettlements"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => <div className="grid min-h-[55vh] place-items-center bg-brand-background text-sm font-medium text-slate-500">Loading…</div>;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader/>}><Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/success" element={<Success />} />
          <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller/register/:token" element={<SellerRegister />} />
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/operations" element={<AdminOperations />} />
          <Route path="/admin/team" element={<AdminTeam />} />
          <Route path="/admin/settlements" element={<AdminSettlements />} />
          <Route path="/admin/listing-approvals" element={<AdminSellerListings />} />
          <Route path="/admin/edit/:id" element={<EditProduct />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
        </Route>
        <Route element={<SellerRoute><AdminLayout /></SellerRoute>}>
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/products" element={<Admin />} />
          <Route path="/seller/products/edit/:id" element={<EditProduct />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/profile" element={<SellerAccount />} />
          <Route path="/seller/settlements" element={<SellerSettlements />} />
        </Route>
        <Route path="/admin-coupons" element={<Navigate to="/admin/coupons" replace />} />
      </Routes></Suspense>
    </BrowserRouter>
  );
}

export default App;

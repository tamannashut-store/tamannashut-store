import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const pages = {
  "/about": ["About Us | Tamanna's Hut", "Learn about Tamanna's Hut and our comfort-first kidswear collection.", true],
  "/cart": ["Shopping Bag | Tamanna's Hut", "Review the products selected for your Tamanna's Hut order.", false],
  "/login": ["Customer Login | Tamanna's Hut", "Sign in to manage your Tamanna's Hut orders and delivery details.", false],
  "/register": ["Create Account | Tamanna's Hut", "Create your Tamanna's Hut customer account for faster checkout and order tracking.", false],
  "/wishlist": ["My Wishlist | Tamanna's Hut", "View the Tamanna's Hut products saved to your wishlist.", false],
  "/checkout": ["Secure Checkout | Tamanna's Hut", "Complete your Tamanna's Hut order securely.", false],
  "/profile": ["My Profile | Tamanna's Hut", "Manage your Tamanna's Hut delivery profile.", false],
  "/my-orders": ["My Orders | Tamanna's Hut", "Track your Tamanna's Hut orders, returns and refunds.", false],
};

export default function PageMeta() {
  const { pathname } = useLocation(); const page = pages[pathname];
  if (!page) return null;
  const [title, description, indexable] = page;
  return <Helmet><title>{title}</title><meta name="description" content={description}/><meta name="robots" content={indexable ? "index,follow" : "noindex,nofollow"}/><link rel="canonical" href={`https://www.tamannashut.com${pathname}`}/></Helmet>;
}

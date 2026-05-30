import { Link } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

function Navbar() {

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const handleSearch = (e) => {

    e.preventDefault();

    navigate(`/shop?search=${search}`);

  };
  const userData = JSON.parse(
    localStorage.getItem("user")
  );
  return (

    <nav className="sticky top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <form
          onSubmit={handleSearch}
          className="hidden lg:flex items-center border rounded-full overflow-hidden"
        >

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 outline-none w-56"
          />

          <button
            type="submit"
            className="bg-pink-500 text-white px-5 py-2"
          >

            Search

          </button>

        </form>
        {/* LOGO */}

        <Link to="/" className="flex items-center gap-3">

          <img
            src={logo}
            alt="logo"
            className="w-12 h-12 rounded-full object-cover border"
          />

          <div>

            <h1 className="text-2xl font-bold tracking-wide text-gray-900">
              Tamanna's Hut
            </h1>

            <p className="text-xs text-gray-500">
              Premium Kids Fashion
            </p>

          </div>

        </Link>

        {/* DESKTOP MENU */}

        <div className="hidden md:flex items-center gap-8 font-medium text-gray-700">

          <Link
            to="/"
            className="hover:text-pink-500 transition"
          >
            Home
          </Link>

          <Link
            to="/girls"
            className="hover:text-pink-500 transition"
          >
            Girls
          </Link>

          <Link
            to="/boys"
            className="hover:text-pink-500 transition"
          >
            Boys
          </Link>

          <Link
            to="/new"
            className="hover:text-pink-500 transition"
          >
            New Arrivals
          </Link>
          <Link to="/wishlist">

            ❤️ Wishlist

          </Link>
          <Link to="/my-orders">
            My Orders
          </Link>
          <Link to="/profile">
            My Profile
          </Link>
          <Link
            to="/contact"
            className="hover:text-pink-500 transition"
          >
            Contact
          </Link>
          {
            userData?.user?.isAdmin && (
              <Link to="/admin/dashboard">
                Admin
              </Link>
            )
          }

        </div>

        {/* RIGHT SIDE */}

        <div className="hidden md:flex items-center gap-4">

          <Link to="/cart">

            <button className="bg-black text-white px-5 py-2 rounded-full hover:bg-pink-500 transition">

              Cart

            </button>

          </Link>

          <Link to="/login">

            <button className="border border-black px-5 py-2 rounded-full hover:bg-black hover:text-white transition">

              Login

            </button>

          </Link>

          <Link to="/register">

            <button className="bg-pink-500 text-white px-5 py-2 rounded-full hover:bg-pink-600 transition">

              Register

            </button>

          </Link>

        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >

          {menuOpen ? <FaTimes /> : <FaBars />}

        </button>

      </div>

      {/* MOBILE MENU */}

      {menuOpen && (

        <div className="md:hidden bg-white border-t shadow-lg">

          <div className="flex flex-col gap-5 p-6 font-medium text-gray-700">

            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="hover:text-pink-500"
            >
              Home
            </Link>

            <Link
              to="/girls"
              onClick={() => setMenuOpen(false)}
              className="hover:text-pink-500"
            >
              Girls
            </Link>

            <Link
              to="/boys"
              onClick={() => setMenuOpen(false)}
              className="hover:text-pink-500"
            >
              Boys
            </Link>

            <Link
              to="/new"
              onClick={() => setMenuOpen(false)}
              className="hover:text-pink-500"
            >
              New Arrivals
            </Link>

            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-pink-500"
            >
              Contact
            </Link>

            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
            >
              <button className="bg-black text-white px-5 py-3 rounded-full w-full">

                Cart

              </button>
            </Link>

            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
            >
              <button className="border border-black px-5 py-3 rounded-full w-full">

                Login

              </button>
            </Link>

            <Link
              to="/register"
              onClick={() => setMenuOpen(false)}
            >
              <button className="bg-pink-500 text-white px-5 py-3 rounded-full w-full">

                Register

              </button>
            </Link>

          </div>

        </div>

      )}

    </nav>
  );
}

export default Navbar;
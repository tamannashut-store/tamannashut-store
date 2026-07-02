import { Link } from "react-router-dom";
import { useState, useContext } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { FiShoppingBag, FiHeart, FiUser, FiSearch } from "react-icons/fi";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import Container from "../components/Container";
function Navbar() {

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { cartItems } = useContext(CartContext);

  const navigate = useNavigate();
  const cartCount =
  cartItems.reduce(
    (total, item) =>
      total + item.qty,
    0
  );
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(
      new Event("cartUpdated")
    );
    navigate("/");
  };
  const handleSearch = (e) => {

    e.preventDefault();

    navigate(`/shop?search=${search}`);

  };
  const userData = JSON.parse(
    localStorage.getItem("user")
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <Container className="py-20">
      <div className="bg-[#355E3B] border-b border-pink-100">
        <div className="max-w-[1400px] mx-auto px-6 h-10 flex items-center justify-center gap-8 text-sm text-white">

          <span>🚚 Free Shipping Above ₹999</span>

          <span>💳 COD Available</span>

          <span>↩ Easy Returns</span>

        </div>
      </div>
      <nav className="sticky top-0 left-0 w-full z-50 bg-[#FAF8F4] backdrop-blur-lg border-b border-[#f3f0eb] shadow-[0_2px_20px_rgba(0,0,0,0.04)]">

        <div className="relative max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">

          {/* LOGO */}

          <Link to="/" className="flex items-center gap-3">

            <img src={logo} alt="Tamanna's Hut" className="h-20 w-auto object-contain" />
          </Link>
          {/* DESKTOP MENU */}

          <div className="hidden lg:flex items-center gap-10 text-[15px] tracking-wide uppercase font-medium text-[#355E3B]">

            <Link
              to="/girls"
              className="hover:text-[#F0B7BE] transition"
            >
              Girls
            </Link>

            <Link
              to="/boys"
              className="hover:text-[#F0B7BE] transition"
            >
              Boys
            </Link>

            <Link
              to="/new"
              className="hover:text-[#F0B7BE] transition"
            >
              New Arrivals
            </Link>
            <Link to={"/about"}>
              About
            </Link>
            <Link
              to="/contact"
              className="hover:text-[#F0B7BE] transition"
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

          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-[#355E3B] hover:text-[#A7BFA1] transition"
            >
              <FiSearch size={22} />
            </button>
            <Link
              to="/wishlist"
              className="text-[#355E3B] hover:text-[#A7BFA1]"
            >
              <FiHeart size={22} />
            </Link>

            <Link to="/cart" className="text-[#355E3B] hover:text-[#A7BFA1]">
              <div className="relative">
                <FiShoppingBag size={22} />
                {cartItems.length > 0 && (
                  <span className=" absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>

            {!userData ? (
              <>
                <Link to="/login">
                  <button
                    className="
          px-5
          py-2
          rounded-full
          border
          border-[#355E3B]
          text-[#355E3B]
          hover:bg-[#355E3B]
          hover:text-white
          transition
          "
                  >
                    Login
                  </button>
                </Link>

                <Link to="/register">
                  <button
                    className="
          px-5
          py-2
          rounded-full
          bg-[#355E3B]
          text-white
          hover:bg-[#2f5034]
          transition
          "
                  >
                    Register
                  </button>
                </Link>
              </>
            ) : (
              <div className="relative">

                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="text-[#355E3B] hover:text-[#A7BFA1] transition"
                >
                  <FiUser size={22} />
                </button>

                {profileOpen && (
                  <div className=" absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-[#E8DCC6] overflow-hidden z-50">

                    <Link to="/profile" onClick={() => setProfileOpen(false)} className=" block px-5 py-3 text-[#355E3B] hover:bg-[#FAF8F4]">
                      My Profile
                    </Link>
                    <Link to="/my-orders" onClick={() => setProfileOpen(false)} className=" block px-5 py-3 text-[#355E3B] hover:bg-[#FAF8F4]">
                      My Orders
                    </Link>
                    <Link to="/wishlist" onClick={() => setProfileOpen(false)} className=" block px-5 py-3 text-[#355E3B] hover:bg-[#FAF8F4]">
                      Wishlist
                    </Link>

                    <div className="border-t border-[#E8DCC6]" />
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-red-500 hover:bg-red-50">Logout</button>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* MOBILE MENU BUTTON */}

          <button
            className="md:hidden text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >

            {menuOpen ? <FaTimes /> : <FaBars />}

          </button>

        </div>
        {searchOpen && (
          <div
            className="
    absolute
    top-full
    right-10
    mt-3
    w-[420px]
    bg-white
    rounded-2xl
    border
    border-[#E8DCC6]
    shadow-2xl
    p-4
    z-50
    "
          >
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setSearchOpen(false);
              }}
              className="space-y-3"
            >
              <div className="relative">

                <FiSearch
                  size={18}
                  className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-gray-400
          "
                />

                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="
          w-full
          pl-11
          pr-4
          py-3
          rounded-xl
          border
          border-[#E8DCC6]
          outline-none
          focus:border-[#355E3B]
          "
                />

              </div>

              <button
                type="submit"
                className="
        w-full
        py-3
        rounded-xl
        bg-[#355E3B]
        text-white
        hover:bg-[#2f5034]
        transition
        "
              >
                Search
              </button>
            </form>
          </div>
        )}
        {/* MOBILE MENU */}

        {menuOpen && (

          <div className="md:hidden bg-white border-t shadow-lg">

            <div className="flex flex-col gap-5 p-6 font-medium text-gray-700">

              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="hover:text-[#F0B7BE]"
              >
                Home
              </Link>

              <Link
                to="/girls"
                onClick={() => setMenuOpen(false)}
                className="hover:text-[#F0B7BE]"
              >
                Girls
              </Link>

              <Link
                to="/boys"
                onClick={() => setMenuOpen(false)}
                className="hover:text-[#F0B7BE]"
              >
                Boys
              </Link>

              <Link
                to="/new"
                onClick={() => setMenuOpen(false)}
                className="hover:text-[#F0B7BE]"
              >
                New Arrivals
              </Link>

              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="hover:text-[#F0B7BE]"
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
                <button className="bg-[#F0B7BE] hover:bg-[#e9a8b0] text-white px-5 py-3 rounded-full w-full">

                  Register

                </button>
              </Link>

            </div>

          </div>

        )}

      </nav>
    </Container>
  );
}

export default Navbar;
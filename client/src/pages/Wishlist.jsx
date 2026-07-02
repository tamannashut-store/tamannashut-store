import { useContext } from "react";
import { WishlistContext } from "../context/WishlistContext";
import { Link } from "react-router-dom";
import Container from "../components/Container";

function Wishlist() {

  const {
    wishlistItems,
    removeFromWishlist,
  } = useContext(WishlistContext);

  if (wishlistItems.length === 0) {

    return (

      <Container className="py-20">

        <h1 className="text-4xl font-bold text-gray-400">

          Wishlist Is Empty

        </h1>

      </Container>

    );
  }

  return (

    <Container className="py-20">

      <h1 className="text-5xl font-bold mb-12">

        My Wishlist ❤️

      </h1>

      <div className="grid md:grid-cols-3 gap-8">

        {wishlistItems.map((product) => (

          <div
            key={product._id}
            className="bg-white shadow-xl rounded-3xl p-5"
          >

            <img
               src={
                product.image?.startsWith("http")
                  ? product.image
                  : `${import.meta.env.VITE_API_URL}${product.image}`
              }
              alt={`${product.name} - Tamanna's Hut Kids Fashion`}
              className="w-full h-72 object-cover rounded-2xl"
            />

            <h2 className="text-2xl font-bold mt-5">
              {product.name}
            </h2>

            <p className="text-pink-500 font-bold mt-3 text-xl">
              ₹{product.price}
            </p>

            <div className="flex gap-3 mt-6">

              <Link
                to={`/product/${product._id}`}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-2xl text-center font-semibold"
              >
                View
              </Link>

              <button
                onClick={() =>
                  removeFromWishlist(product._id)
                }
                className="bg-red-500 hover:bg-red-600 text-white px-5 rounded-2xl"
              >
                Remove
              </button>

            </div>

          </div>

        ))}

      </div>

    </Container>
  );
}

export default Wishlist;
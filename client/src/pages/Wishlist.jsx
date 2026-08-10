import { useContext } from "react";
import WishlistContext from "../context/wishlistState";
import { Link } from "react-router-dom";

function Wishlist() {

  const {
    wishlistItems,
    removeFromWishlist,
  } = useContext(WishlistContext);

  if (wishlistItems.length === 0) {

    return (

      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-5 py-16 text-center">

        <h1 className="text-3xl font-bold text-gray-400 sm:text-4xl">

          Wishlist Is Empty

        </h1>

      </div>

    );
  }

  return (

    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:py-20">

      <h1 className="mb-8 text-3xl font-bold sm:mb-12 sm:text-5xl">

        My wishlist

      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">

        {wishlistItems.map((product) => (

          <div
            key={product._id}
            className="bg-white shadow-xl rounded-3xl p-5"
          >

              <img
              src={product.images?.[0]?.url || "/placeholder.png"}
              alt={`${product.name} - Tamanna's Hut Kids Fashion`}
              className="w-full h-72 object-cover rounded-2xl"
            />

            <h2 className="text-2xl font-bold mt-5">
              {product.name}
            </h2>

            <p className="text-brand-primary font-bold mt-3 text-xl">
              ₹{product.price}
            </p>

            <div className="mt-6 flex flex-col gap-3 min-[380px]:flex-row">

              <Link
                to={`/product/${product._id}`}
                className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-2xl text-center font-semibold"
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

    </div>
  );
}

export default Wishlist;


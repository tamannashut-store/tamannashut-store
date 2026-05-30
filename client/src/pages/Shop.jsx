import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";

function Shop() {

  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);

  const searchQuery =
    queryParams.get("search")?.toLowerCase() || "";

  useEffect(() => {

    fetchProducts();

  }, []);

  const fetchProducts = async () => {

    try {

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/products`
      );

      setProducts(data);

    } catch (error) {

      console.log(error);

    }
  };

  const filteredProducts = products.filter((p) => {

    const matchesCategory =
      selectedCategory === "All"
        ? true
        : p.category === selectedCategory;

        const matchesSearch =
        (p.name || "")
          .toLowerCase()
          .includes(searchQuery);
    return matchesCategory && matchesSearch;

  });
  return (

    <div className="max-w-7xl mx-auto px-6 py-20">

      <h1 className="text-5xl font-bold mb-10">
        Shop Collection
      </h1>

      {/* FILTERS */}

      <div className="flex flex-wrap gap-4 mb-12">

        {["All", "Girls", "Boys", "New Arrivals"].map((cat) => (

          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-3 rounded-full border transition ${
              selectedCategory === cat
                ? "bg-pink-500 text-white"
                : "bg-white"
            }`}
          >

            {cat}

          </button>

        ))}

      </div>

      {/* PRODUCTS */}

      <div className="grid md:grid-cols-3 gap-10">

        {filteredProducts.map((product) => (

          <div
            key={product._id}
            className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition group"
          >

            <img
               src={
                product.image?.startsWith("http")
                  ? product.image
                  : `${import.meta.env.VITE_API_URL}${product.image}`
              }
              alt={product.name}
              className="h-80 w-full object-cover group-hover:scale-105 transition duration-300"
            />

            <div className="p-6">

              <p className="text-pink-500 font-medium">
                {product.category}
              </p>

              <h2 className="text-2xl font-bold mt-2">
                {product.name}
              </h2>

              <p className="text-pink-500 font-bold text-xl mt-3">
                ₹{product.price}
              </p>

              <Link to={`/product/${product._id}`}>

                <button className="mt-5 w-full bg-black text-white py-3 rounded-full hover:bg-pink-500 transition">

                  View Product

                </button>

              </Link>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Shop;
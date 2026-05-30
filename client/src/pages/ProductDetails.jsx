import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import toast from "react-hot-toast";

function ProductDetails() {
  const { id } = useParams();

  const { cartItems, addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`
      );
  
      setProduct(data);
  
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-2xl font-bold">
        Loading...
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="text-center py-20 text-2xl font-bold">
        Product Not Found
      </div>
    );
  }
  const selectedSizeData =
  product.sizeStock?.find(
    item => item.size === selectedSize
  );

const cartQty =
  cartItems
    .filter(
      item =>
        item._id === product._id &&
        item.selectedSize === selectedSize
    )
    .reduce(
      (total, item) => total + item.qty,
      0
    );

const availableStock =
  (selectedSizeData?.stock || 0) -
  cartQty;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-14 items-start">
        <div>
          <img
            src={product.image}
            alt={product.name}
            className="w-full rounded-3xl shadow-2xl"
          />
        </div>

        <div>
          <p className="uppercase tracking-[5px] text-pink-500 mb-4">
            Tamanna's Hut
          </p>

          <h1 className="text-5xl font-bold">{product.name}</h1>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">Select Size</h3>

            <div className="flex gap-3 flex-wrap">

  {product.sizeStock?.map((item) => (

    <button
      key={item.size}
      onClick={() => setSelectedSize(item.size)}
      disabled={item.stock <= 0}
      className={`px-5 py-2 rounded-xl border ${
        selectedSize === item.size
          ? "bg-pink-500 text-white"
          : "bg-white"
      } ${
        item.stock <= 0
          ? "opacity-50 cursor-not-allowed"
          : ""
      }`}
    >
      {item.size} ({item.stock})
    </button>

  ))}

</div>
</div>

          <p className="text-pink-500 text-4xl font-bold mt-6">
            ₹{product.price}
          </p>

          <p className="text-gray-600 mt-8 leading-8 text-lg">
            {product.description}
          </p>

          <p className="mt-6 font-semibold">
            Category:
            <span className="text-pink-500 ml-2">
              {product.category}
            </span>
          </p>

          <p className="mt-4 font-semibold">
            Stock:
            <span
              className={`ml-2 ${
                availableStock > 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {availableStock > 0
                ? `${availableStock} Available`
                : "Out Of Stock"}
            </span>
          </p>

          <button
            onClick={() => {
              if (!selectedSize) {
                toast.error("Please select size");
                return;
              }
              
              if (!product.sizeStock?.find(item => item.size === selectedSize)) {
                alert("Selected size unavailable");
                return;
              }
              if (availableStock <= 0) {
                toast.error("Out Of Stock");
                return;
              }



              addToCart({
                ...product,
                selectedSize,
              });

              toast.success("Added To Cart");
            }}
            disabled={availableStock <= 0}
            className={`mt-10 px-10 py-4 rounded-full text-lg font-semibold transition ${
              availableStock <= 0
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {availableStock <= 0 ? "Out Of Stock" : "Add To Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
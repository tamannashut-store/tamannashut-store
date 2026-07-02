import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

function ProductDetails() {

  const { id } = useParams();

  const { cartItems, addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");

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
  const submitReview = async () => {

    try {

      const user = JSON.parse(
        localStorage.getItem("user")
      );

      if (!user) {

        alert("Please login first");

        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/products/${id}/review`,
        {
          userId: user.user.id,
          name: user.user.name,
          rating: Number(rating),
          comment,
        }
      );

      alert("Review submitted");

      setComment("");
      setRating(5);

      fetchProduct();

    } catch (error) {

      console.log(error);

      alert("Failed to submit review");

    }
  };
  return (
    <>
      <Helmet>
        <title>{`${product.name} | Tamanna's Hut`}</title>
        <meta
          name="description"
          content={product.description}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: [
              product.image?.startsWith("http")
                ? product.image
                : `${import.meta.env.VITE_API_URL}${product.image}`,
            ],
            description: product.description,

            brand: {
              "@type": "Brand",
              name: "Tamanna's Hut",
            },

            offers: {
              "@type": "Offer",
              url: `https://tamannashut.com/product/${id}`,
              priceCurrency: "INR",
              price: product.price,
              availability:
                availableStock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },

            ...(product.reviews?.length > 0 && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: (
                  product.reviews.reduce(
                    (sum, r) => sum + r.rating,
                    0
                  ) / product.reviews.length
                ).toFixed(1),
                reviewCount: product.reviews.length,
              },
            }),
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://tamannashut.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Shop",
                item: "https://tamannashut.com/shop",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: `https://tamannashut.com/product/${id}`,
              },
            ],
          })}
        </script>
        <meta
          property="og:title"
          content={`${product.name} | Tamanna's Hut`}
        />

        <meta
          property="og:description"
          content={product.description}
        />

        <meta
          property="og:image"
          content={
            product.image?.startsWith("http")
              ? product.image
              : `${import.meta.env.VITE_API_URL}${product.image}`
          }
        />

        <meta
          property="og:type"
          content="product"
        />
        <meta
          name="keywords"
          content={`${product.name}, baby dress, kids clothes, Tamanna's Hut`}
        />
        <link
          rel="canonical"
          href={`https://tamannashut.com/product/${id}`}
        />
      </Helmet>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-14 items-start">
          <div>
            <img
              src={
                product.image?.startsWith("http")
                  ? product.image
                  : `${import.meta.env.VITE_API_URL}${product.image}`
              }
              alt={`${product.name} - Tamanna's Hut Kids Fashion`}
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
                    className={`px-5 py-2 rounded-xl border ${selectedSize === item.size
                      ? "bg-pink-500 text-white"
                      : "bg-white"
                      } ${item.stock <= 0
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
            <div className="mt-12">

              <h2 className="text-2xl font-bold mb-4">
                Customer Reviews
              </h2>

              {product.reviews?.map(
                review => (

                  <div
                    key={review._id}
                    className="border-b py-4"
                  >

                    <h3 className="font-semibold">
                      {review.name}
                    </h3>

                    <p>
                      {"⭐".repeat(
                        review.rating
                      )}
                    </p>

                    <p>
                      {review.comment}
                    </p>

                  </div>

                )
              )}

            </div>
            <p className="mt-6 font-semibold">
              Category:
              <span className="text-pink-500 ml-2">
                {product.category}
              </span>
            </p>

            <p className="mt-4 font-semibold">
              Stock:
              <span
                className={`ml-2 ${availableStock > 0 ? "text-green-600" : "text-red-500"
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
              className={`mt-10 px-10 py-4 rounded-full text-lg font-semibold transition ${availableStock <= 0
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
            >
              {availableStock <= 0 ? "Out Of Stock" : "Add To Cart"}
            </button>
          </div>
          <div className="mt-10">

            <h2 className="text-2xl font-bold mb-4">
              Write Review
            </h2>

            <select
              value={rating}
              onChange={(e) =>
                setRating(e.target.value)
              }
              className="border p-3 rounded-xl"
            >
              <option value="5">⭐⭐⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐</option>
              <option value="3">⭐⭐⭐</option>
              <option value="2">⭐⭐</option>
              <option value="1">⭐</option>
            </select>

            <textarea
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              placeholder="Write review..."
              className="w-full border p-4 mt-4 rounded-xl"
            />

            <button
              onClick={submitReview}
              className="bg-pink-500 text-white px-5 py-3 rounded-xl mt-4"
            >
              Submit Review
            </button>

          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetails;
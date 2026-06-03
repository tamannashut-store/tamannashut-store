import banner1 from "../assets/banner1.jpg";
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../api/productApi";
import { WishlistContext } from "../context/WishlistContext";
import { Helmet } from "react-helmet-async";

function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await getProducts();

      setProducts(data);
    } catch (error) {
      console.log(error);
    }
  };
  const { addToWishlist } =
    useContext(WishlistContext);

  return (
    <>
      <Helmet>
        <title>
          Tamanna's Hut | Premium Kids Fashion Store
        </title>

        <meta
          name="description"
          content="Shop premium baby dresses, girls dresses, boys clothing and kids fashion online at Tamanna's Hut."
        />

        <meta
          name="keywords"
          content="kids fashion, baby dress, girls dress, boys clothing, Tamanna's Hut"
        />
        <meta
          property="og:title"
          content="Tamanna's Hut | Premium Kids Fashion Store"
        />

        <meta
          property="og:description"
          content="Shop premium baby dresses, girls dresses, boys clothing and kids fashion online."
        />

        <meta
          property="og:image"
          content="https://www.tamannashut.com/assets/logo-Bkaz0kee.png"
        />

        <meta
          property="og:type"
          content="website"
        />
        <link
          rel="canonical"
          href="https://tamannashut.com/"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Tamanna's Hut",
            "url": "https://www.tamannashut.com",
            "logo": "https://www.tamannashut.com/assets/logo-Bkaz0kee.png",
            "email": "support@tamannashut.com",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+919874328578",
              "contactType": "customer service",
              "areaServed": "IN",
              "availableLanguage": "English"
            },
            "sameAs": [
              "https://www.instagram.com/tamannashut"
            ]
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Tamanna's Hut",
            "url": "https://tamannashut.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://tamannashut.com/shop?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What products does Tamanna's Hut sell?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Tamanna's Hut sells premium baby clothes, girls dresses, boys clothing and kids fashion."
                }
              },
              {
                "@type": "Question",
                "name": "Do you deliver across India?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Tamanna's Hut delivers across India."
                }
              },
              {
                "@type": "Question",
                "name": "Do you accept returns?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, returns are accepted within 7 days according to our return policy."
                }
              }
            ]
          })}
        </script>
      </Helmet>
      <div className="w-full overflow-hidden">

        {/* HERO SECTION */}
        <section className="relative h-screen w-full">

          <img
            src={banner1}
            alt="Tamanna's Hut"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/30"></div>

          <div className="absolute inset-0 bg-black/25 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">

              <div className="max-w-xl bg-white/10 backdrop-blur-sm p-8 rounded-3xl">

                <p className="uppercase tracking-[6px] text-pink-200 text-sm mb-4">
                  Tamanna's Hut Of Purity
                </p>

                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
                  Premium Kids <br /> Fashion
                </h1>

                <p className="text-lg text-gray-100 leading-relaxed mb-8">
                  Stylish and comfortable outfits for boys and girls.
                  Beautiful collections crafted with elegance and love.
                </p>

                <div className="flex gap-4">
                  <button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-semibold transition">
                    Shop Now
                  </button>

                  <button className="border border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-black transition">
                    Explore
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY SECTION */}
        <section className="py-20 px-6 bg-white">

          <div className="max-w-7xl mx-auto">

            <h2 className="text-4xl font-bold text-center mb-14">
              Shop By Category
            </h2>

            <div className="grid md:grid-cols-3 gap-8">

              <div className="rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1519238359922-989348752efb"
                  alt=""
                  className="h-[400px] w-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">Girls Collection</h3>
                </div>
              </div>

              <div className="rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1519345182560-3f2917c472ef"
                  alt=""
                  className="h-[400px] w-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">Boys Collection</h3>
                </div>
              </div>

              <div className="rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1514090458221-65bb69cf63e6"
                  alt=""
                  className="h-[400px] w-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">New Arrivals</h3>
                </div>
              </div>

            </div>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">

            <h2 className="text-4xl font-bold text-center mb-12">
              Featured Collection
            </h2>

            <div className="grid md:grid-cols-4 gap-8">

              {products.map((product) => (
                <div key={product._id} className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
                  <img src={
                    product.image?.startsWith("http")
                      ? product.image
                      : `${import.meta.env.VITE_API_URL}${product.image}`
                  } alt={`${product.name} - Tamanna's Hut Kids Fashion`} className="h-72 w-full object-cover" />
                  <div className="p-5">
                    <h3 className="font-semibold text-lg">
                      {product.name}
                    </h3>
                    <button onClick={() => addToWishlist(product)} className="absolute top-4 right-4 bg-white shadow-lg p-3 rounded-full cursor-pointer">❤️</button>
                    <p className="text-pink-500 font-bold mt-2">
                      ₹{product.price}
                    </p>

                    <Link to={`/product/${product._id}`}>
                      <button className="mt-4 w-full bg-black text-white py-3 rounded-full hover:bg-pink-500 transition">
                        View Product
                      </button>
                    </Link>

                  </div>

                </div>
              ))}

            </div>
          </div>
        </section>
        {/* FEATURES */}
        {/* <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">

                    <h2 className="text-4xl font-bold text-center mb-12">
                        Featured Collection
                    </h2>

                    <div className="grid md:grid-cols-4 gap-8">

                        {products.map((product) => (
                            <div
                                key={product._id}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
                            >
                                <img
  src={
    product.image ||
    "https://via.placeholder.com/500x500?text=Tamannas+Hut"
  }
  alt={`${product.name} - Tamanna's Hut Kids Fashion`}
  className="h-72 w-full object-cover"
/>

                                <div className="p-5">

                                    <h3 className="font-semibold text-lg">
                                        {product.name}
                                    </h3>

                                    <p className="text-gray-500 mt-2 text-sm">
                                        {product.description}
                                    </p>

                                    <p className="text-pink-500 font-bold mt-3 text-xl">
                                        ₹{product.price}
                                    </p>

                                    <button className="mt-4 w-full bg-black text-white py-3 rounded-full hover:bg-pink-500 transition">
                                        View Product
                                    </button>

                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </section> */}
        {/* TESTIMONIALS */}

        <section className="mb-28">

          <div className="text-center mb-16">

            <p className="text-pink-500 uppercase tracking-[5px] font-semibold">

              Happy Customers

            </p>

            <h2 className="text-5xl font-bold mt-4">

              What Moms Say 💖

            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-10">

            {/* CARD 1 */}

            <div className="bg-white rounded-[35px] shadow-xl p-10 hover:-translate-y-2 transition duration-300">

              <div className="flex text-yellow-400 text-2xl mb-6">

                ⭐⭐⭐⭐⭐

              </div>

              <p className="text-gray-600 leading-relaxed text-lg">

                Absolutely loved the quality and fitting.
                The dress looked even prettier in real life.
                My daughter was so happy!

              </p>

              <div className="mt-8 flex items-center gap-4">

                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="customer"
                  className="w-14 h-14 rounded-full object-cover"
                />

                <div>

                  <h4 className="font-bold text-lg">
                    Priya Sharma
                  </h4>

                  <p className="text-gray-500 text-sm">
                    Kolkata
                  </p>

                </div>

              </div>

            </div>

            {/* CARD 2 */}

            <div className="bg-white rounded-[35px] shadow-xl p-10 hover:-translate-y-2 transition duration-300">

              <div className="flex text-yellow-400 text-2xl mb-6">

                ⭐⭐⭐⭐⭐

              </div>

              <p className="text-gray-600 leading-relaxed text-lg">

                Premium quality fabric and beautiful stitching.
                Delivery was fast and packaging was amazing.

              </p>

              <div className="mt-8 flex items-center gap-4">

                <img
                  src="https://randomuser.me/api/portraits/women/65.jpg"
                  alt="customer"
                  className="w-14 h-14 rounded-full object-cover"
                />

                <div>

                  <h4 className="font-bold text-lg">
                    Anjali Verma
                  </h4>

                  <p className="text-gray-500 text-sm">
                    Delhi
                  </p>

                </div>

              </div>

            </div>

            {/* CARD 3 */}

            <div className="bg-white rounded-[35px] shadow-xl p-10 hover:-translate-y-2 transition duration-300">

              <div className="flex text-yellow-400 text-2xl mb-6">

                ⭐⭐⭐⭐⭐

              </div>

              <p className="text-gray-600 leading-relaxed text-lg">

                Tamanna's Hut has become my favorite kids fashion store.
                Stylish collections and very comfortable for children.

              </p>

              <div className="mt-8 flex items-center gap-4">

                <img
                  src="https://randomuser.me/api/portraits/women/68.jpg"
                  alt="customer"
                  className="w-14 h-14 rounded-full object-cover"
                />

                <div>

                  <h4 className="font-bold text-lg">
                    Sneha Roy
                  </h4>

                  <p className="text-gray-500 text-sm">
                    Mumbai
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>
        {/* INSTAGRAM GALLERY */}

        <section className="mb-28">

          <div className="text-center mb-16">

            <p className="text-pink-500 uppercase tracking-[5px] font-semibold">

              Follow Us

            </p>

            <h2 className="text-5xl font-bold mt-4">

              Instagram Gallery 📸

            </h2>

            <p className="text-gray-500 mt-5 text-lg">

              @tamannashut

            </p>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

            <a
              href="https://instagram.com/YOURUSERNAME"
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-[30px] group block"
            ></a>

            <div className="overflow-hidden rounded-[30px] group">

              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                alt="gallery"
                className="h-80 w-full object-cover group-hover:scale-110 transition duration-500"
              />

            </div>

            <div className="overflow-hidden rounded-[30px] group">

              <img
                src="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=1000&auto=format&fit=crop"
                alt="gallery"
                className="h-80 w-full object-cover group-hover:scale-110 transition duration-500"
              />

            </div>

            <div className="overflow-hidden rounded-[30px] group">

              <img
                src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop"
                alt="gallery"
                className="h-80 w-full object-cover group-hover:scale-110 transition duration-500"
              />

            </div>

          </div>

        </section>
        {/* FOOTER */}
        <footer className="bg-black text-white py-10 text-center">
          <h2 className="text-3xl font-bold">Tamanna's Hut</h2>

          <p className="mt-4 text-white/70">
            Premium Fashion For Kids
          </p>

          <p className="mt-6 text-sm text-white/50">
            © 2026 Tamanna's Hut. All rights reserved.
          </p>
        </footer>

      </div>
    </>
  );
}

export default Home;
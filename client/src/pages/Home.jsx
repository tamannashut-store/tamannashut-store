import banner1 from "../assets/banner1.jpg";
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../api/productApi";
import { WishlistContext } from "../context/WishlistContext";
import { Helmet } from "react-helmet-async";
import { toast } from "react-hot-toast";
import Container from "../components/Container";
import Button from "../components/Button";
function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await getProducts();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const { addToWishlist } = useContext(WishlistContext);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    toast.success("Thanks for joining Tamanna's Hut!");
    setEmail("");
  };

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
      <Container className="w-full overflow-hidden">

        {/* HERO SECTION */}
        <section className="bg-brand-background">

          <div
            className="
    max-w-[1400px]
    mx-auto
    px-8
    py-20
    lg:py-28
    grid
    lg:grid-cols-2
    gap-16
    items-center
  "
          >

            {/* LEFT */}

            <div>

              <p className="uppercase tracking-[4px] text-brand-primary font-medium mb-5">
                Tamanna's Hut Of Purity
              </p>

              <h1 className="text-5xl lg:text-7xl font-serif leading-tight text-brand-dark mb-6">

                Timeless Style
                <br />
                For Every Moment

              </h1>

              <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-xl">

                Beautiful kidswear crafted with premium fabrics,
                comfort and elegance for every occasion.

              </p>

              <div className="flex gap-4">

                <Link
                  to="/shop"
                  className="bg-brand-primary hover:bg-[#2d4d33] text-white px-10 py-4 rounded-xl transition inline-flex items-center justify-center"
                >
                  Shop Now
                </Link>

                <Link
                  to="/new"
                  className="border border-brand-primary text-brand-primary px-10 py-4 rounded-xl hover:bg-brand-primary hover:text-white transition inline-flex items-center justify-center"
                >
                  Explore
                </Link>

              </div>

            </div>

            {/* RIGHT */}

            <div>

              <img
                src={banner1}
                alt="Tamanna's Hut"
                className="
        w-full
        h-[650px]
        object-cover
        rounded-[40px]
        "
              />

            </div>

          </div>

        </section>

        <section className="bg-white border-y border-[#ece7df]">
          <div className="max-w-7xl mx-auto py-8 grid md:grid-cols-4 text-center gap-6">

            <div>
              <h3 className="font-semibold text-brand-primary">
                Premium Fabric
              </h3>
            </div>

            <div>
              <h3 className="font-semibold text-brand-primary">
                Safe For Kids
              </h3>
            </div>

            <div>
              <h3 className="font-semibold text-brand-primary">
                Easy Returns
              </h3>
            </div>

            <div>
              <h3 className="font-semibold text-brand-primary">
                Fast Delivery
              </h3>
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

              <div className="
bg-white
rounded-[30px]
overflow-hidden
border
border-[#efe8dd]
hover:-translate-y-2
transition
duration-300
">
                <img
                  src="https://images.unsplash.com/photo-1519238359922-989348752efb"
                  alt=""
                  className="h-[400px] w-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">Girls Collection</h3>
                </div>
              </div>

              <div className="
bg-white
rounded-[30px]
overflow-hidden
border
border-[#efe8dd]
hover:-translate-y-2
transition
duration-300
">
                <img
                  src="https://images.unsplash.com/photo-1519345182560-3f2917c472ef"
                  alt=""
                  className="h-[400px] w-full object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">Boys Collection</h3>
                </div>
              </div>

              <div className="
bg-white
rounded-[30px]
overflow-hidden
border
border-[#efe8dd]
hover:-translate-y-2
transition
duration-300
">
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

            <p className="uppercase tracking-[4px] text-brand-primary mb-3">
              Our Collection
            </p>

            <h2 className="text-5xl font-serif">
              Featured Products
            </h2>

            <div className="grid md:grid-cols-4 gap-8">

              {products.map((product) => (
                <div key={product._id} className="
                bg-white
                rounded-[28px]
                overflow-hidden
                border
                border-[#efe8dd]
                hover:shadow-xl
                transition
                relative
                ">
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
                    <p className="text-brand-primary font-bold mt-2">
                      ₹{product.price}
                    </p>

                    <Link to={`/product/${product._id}`}>
                      <Button>
                        View Product
                      </Button>
                    </Link>

                  </div>

                </div>
              ))}

            </div>
          </div>
        </section>
        {/* FEATURES */}
        <section className="py-24 bg-brand-background">

          <div className="max-w-7xl mx-auto">

            <h2 className="text-center text-5xl font-serif mb-16">
              Why Parents Love Us
            </h2>

            <div className="bg-white rounded-3xl p-8 border border-[#ece7df] value-card-wrp">

              <div className="value-card">
                <h3 className="text-2xl font-semibold mb-4 text-brand-primary">
                  Premium Quality
                </h3>

                <p className="text-gray-600">
                  Soft fabrics and durable stitching for everyday comfort.
                </p>
              </div>

              <div className="value-card">
                <h3 className="text-2xl font-semibold mb-4 text-brand-primary">Comfort First</h3>
                <p className="text-gray-600">Designed for active kids.</p>
              </div>

              <div className="value-card">
                <h3 className="text-2xl font-semibold mb-4 text-brand-primary">Elegant Designs</h3>
                <p className="text-gray-600">Stylish outfits for every occasion.</p>
              </div>

            </div>

          </div>

        </section>

        {/* TESTIMONIALS */}

        <section className="mb-28">

          <div className="text-center mb-16">

            <p className="text-brand-primary uppercase tracking-[5px] font-semibold">

              Happy Customers

            </p>

            <h2 className="text-5xl font-bold mt-4">

              What Moms Say 💖

            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-10">

            {/* CARD 1 */}

            <div className="bg-white rounded-[35px] border border-[#ece7df] p-10 hover:-translate-y-2 transition duration-300">

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

            <div className="bg-white rounded-[35px] border border-[#ece7df] p-10 hover:-translate-y-2 transition duration-300">

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

            <div className="bg-white rounded-[35px] border border-[#ece7df] p-10 hover:-translate-y-2 transition duration-300">

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

            <p className="text-brand-primary uppercase tracking-[5px] font-semibold">

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


            <div className="overflow-hidden rounded-[30px] group">

              <a
                href="https://instagram.com/tamannashut"
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-[30px] group block"
              >
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                  alt="gallery"
                  className="h-80 w-full object-cover group-hover:scale-110 transition duration-500"
                />
              </a>
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
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="uppercase tracking-[4px] text-brand-primary font-medium mb-4">
              Join Our Community
            </p>

            <h2 className="text-5xl font-serif mb-6 text-brand-dark">
              Stay Updated With New Arrivals
            </h2>

            <p className="text-gray-600 mb-8 text-lg">
              Get updates on new arrivals, offers, and special collections.
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
          flex-1
          border
          border-[#ece7df]
          rounded-xl
          px-5
          py-4
          outline-none
          focus:border-brand-primary
        "
              />

              <Button
                type="submit"
                
              >
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </Container>
    </>
  );
}

export default Home;
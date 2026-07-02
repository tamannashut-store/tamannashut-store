import { Link } from "react-router-dom";

function Hero() {

  return (

    <section className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-white">

      <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-14 items-center">

        {/* LEFT CONTENT */}

        <div className="z-10">

          <p className="text-pink-500 font-semibold uppercase tracking-widest mb-4">

            Premium Kids Collection

          </p>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-gray-900">

            Fashion For
            <span className="text-pink-500"> Little Stars</span>

          </h1>

          <p className="mt-8 text-lg text-gray-600 leading-relaxed max-w-xl">

            Discover stylish, comfortable and premium-quality outfits
            for babies and kids. Designed with love for every occasion.

          </p>

          <div className="flex flex-wrap gap-5 mt-10">

            <Link to="/shop">

              <button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition">

                Shop Now

              </button>

            </Link>

            <Link to="/new">

              <button className="border border-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-black hover:text-white transition">

                New Arrivals

              </button>

            </Link>

          </div>

          {/* STATS */}

          <div className="flex gap-10 mt-14">

            <div>

              <h2 className="text-3xl font-bold text-gray-900">
                500+
              </h2>

              <p className="text-gray-500">
                Happy Customers
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-gray-900">
                100+
              </h2>

              <p className="text-gray-500">
                Premium Designs
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-gray-900">
                4.9★
              </h2>

              <p className="text-gray-500">
                Customer Rating
              </p>

            </div>

          </div>

        </div>

        {/* RIGHT IMAGE */}

        <div className="relative">

          <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-200 rounded-full blur-3xl opacity-40"></div>

          <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-yellow-100 rounded-full blur-3xl opacity-40"></div>

          <img
            src="/banner.jpg"
            alt="Tamanna's Hut"
            className="relative z-10 rounded-[40px] shadow-2xl object-cover w-full h-[650px]"
          />

        </div>

      </div>

    </section>
  );
}

export default Hero;
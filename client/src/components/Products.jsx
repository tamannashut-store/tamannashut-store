import { Link } from "react-router-dom";
const products = [
    {
        id: 1,
        name: "Girls Party Dress",
        price: "₹799",
        image:
            "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=800&auto=format&fit=crop",
    },

    {
        id: 2,
        name: "Baby Boy Set",
        price: "₹999",
        image:
            "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=800&auto=format&fit=crop",
    },

    {
        id: 3,
        name: "Kids Casual Wear",
        price: "₹699",
        image:
            "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=800&auto=format&fit=crop",
    },

    {
        id: 4,
        name: "Premium Ethnic Set",
        price: "₹1199",
        image:
            "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?q=80&w=800&auto=format&fit=crop",
    },
];

function Products() {
    return (
        <section className="py-24 px-10 bg-gray-50">

            <div className="text-center mb-16">
                <h2 className="text-5xl font-bold">
                    Featured Collection
                </h2>

                <p className="text-gray-500 mt-5 text-lg">
                    Explore our latest premium kids fashion collection
                </p>
            </div>

            <div className="grid md:grid-cols-4 gap-10">

                {products.map((product) => (
                    <Link
                        to={`/product/${product.id}`}
                        key={product.id}
                        className="bg-white rounded-3xl overflow-hidden shadow-lg hover:scale-105 transition duration-300 block"
                    >

                        <img
                            src={
                                product.image ||
                                "https://via.placeholder.com/500x500?text=Tamannas+Hut"
                            }
                            alt={product.name}
                            className="h-72 w-full object-cover"
                        />

                        <div className="p-6">

                            <h3 className="text-2xl font-bold">
                                {product.name}
                            </h3>

                            <p className="text-pink-500 text-xl font-semibold mt-3">
                                {product.price}
                            </p>

                            <button
                                onClick={() => addToCart(product)}
                                disabled={product.stock <= 0}
                                className={`px-6 py-3 rounded-full text-white font-semibold
    ${product.stock <= 0
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-pink-500 hover:bg-pink-600"
                                    }`}
                            >
                                {product.stock <= 0
                                    ? "Out Of Stock"
                                    : "Add To Cart"}
                            </button>

                        </div>
                    </Link>
                ))}

            </div>
        </section>
    );
}

export default Products;
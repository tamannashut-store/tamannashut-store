import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import axios from "axios";

function Cart() {

    const {
        cartItems,
        removeFromCart,
        increaseQty,
        decreaseQty,
    } = useContext(CartContext);

    const totalAmount = cartItems.reduce(
        (acc, item) => acc + item.price * item.qty,
        0
    );
    const [invalidItems, setInvalidItems] = useState([]);
    useEffect(() => {

        validateCart();
    
    }, [cartItems]);
    
    const validateCart = async () => {
        const invalid = [];
      
        for (const item of cartItems) {
          try {
            const { data } = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/products/${item._id}`
            );
      
            const sizeData = data.sizeStock?.find(
              (s) => s.size === item.selectedSize
            );
      
            if (!sizeData) {
              invalid.push(
                `${item._id}-${item.selectedSize}`
              );
              continue;
            }
      
            if (sizeData.stock < item.qty) {
              invalid.push(
                `${item._id}-${item.selectedSize}`
              );
            }
      
          } catch (error) {
            invalid.push(
              `${item._id}-${item.selectedSize}`
            );
          }
        }
      
        setInvalidItems(invalid);
      };
    return (

        <div className="max-w-7xl mx-auto px-6 py-20">

            <h1 className="text-4xl font-bold mb-10">
                Shopping Cart
            </h1>

            {cartItems.length === 0 ? (

                <p>Your cart is empty</p>

            ) : (

                <div className="grid gap-6">

                    {cartItems.map((item) => (

                        <div
                        key={`${item._id}-${item.selectedSize}`}
                            className="flex items-center gap-6 bg-white shadow-lg rounded-2xl p-5"
                        >

                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-32 h-32 object-cover rounded-xl"
                            />

                            <div className="flex-1">

                                <h2 className="text-2xl font-semibold">
                                    {item.name}
                                </h2>

                                <div className="flex items-center gap-3 mt-3">

    <button
        onClick={() =>
            decreaseQty(
                item._id,
                item.selectedSize
            )
        }
        className="w-8 h-8 rounded-full bg-gray-200"
    >
        -
    </button>

    <span className="font-semibold">
        {item.qty}
    </span>

    <button
        onClick={() =>
            increaseQty(
                item._id,
                item.selectedSize
            )
        }
        className="w-8 h-8 rounded-full bg-pink-500 text-white"
    >
        +
    </button>

</div>
{invalidItems.includes(
  `${item._id}-${item.selectedSize}`
) && (

<p className="text-red-500 mt-2 font-semibold">

    Size unavailable or out of stock

</p>

)}
<p className="text-gray-500 mt-1">
  Size: {item.selectedSize}
</p>
                                <p className="text-pink-500 font-bold text-xl mt-2">
                                    ₹{item.price}
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    removeFromCart(
                                      item._id,
                                      item.selectedSize
                                    )
                                  }
                                className="bg-red-500 text-white px-5 py-2 rounded-full"
                            >
                                Remove Item
                            </button>

                        </div>

                    ))}

                    <div className="text-right mt-10">

                        <h2 className="text-3xl font-bold">
                            Total: ₹{totalAmount}
                        </h2>

                        {
invalidItems.some(id =>
  cartItems.some(
    item =>
      `${item._id}-${item.selectedSize}` === id
  )
) ? (

<button
    disabled
    className="mt-6 bg-gray-400 text-white px-10 py-4 rounded-full cursor-not-allowed"
>

    Fix Cart Issues

</button>

) : (

<Link to="/checkout">

    <button className="mt-6 bg-black text-white px-10 py-4 rounded-full hover:bg-pink-500 transition">

        Checkout

    </button>

</Link>

)}

                    </div>

                </div>

            )}

        </div>
    );
}

export default Cart;
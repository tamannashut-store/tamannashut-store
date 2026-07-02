import { useState, useEffect } from "react";
import axios from "axios";

function AdminCoupons() {

  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  const fetchCoupons = async () => {

    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/coupons`
    );

    setCoupons(data);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const createCoupon = async (e) => {

    e.preventDefault();

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/coupons`,
      {
        code,
        discount,
      }
    );

    setCode("");
    setDiscount("");

    fetchCoupons();
  };

  return (

    <div className="max-w-5xl mx-auto p-10">

      <h1 className="text-4xl font-bold mb-8">
        Coupon Management
      </h1>

      <form
        onSubmit={createCoupon}
        className="bg-white p-6 rounded-2xl shadow mb-8"
      >

        <input
          type="text"
          placeholder="Coupon Code"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase())
          }
          className="border p-3 rounded-xl mr-3"
        />

        <input
          type="number"
          placeholder="Discount %"
          value={discount}
          onChange={(e) =>
            setDiscount(e.target.value)
          }
          className="border p-3 rounded-xl mr-3"
        />

        <button
          className="bg-pink-500 text-white px-5 py-3 rounded-xl"
        >
          Create Coupon
        </button>

      </form>

      {coupons.map((coupon) => (

        <div
          key={coupon._id}
          className="bg-white p-4 rounded-xl shadow mb-3"
        >

          <strong>{coupon.code}</strong>

          {" - "}

          {coupon.discount}% OFF

        </div>

      ))}

    </div>

  );

}

export default AdminCoupons;
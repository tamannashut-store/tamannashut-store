import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function Profile() {

  const userData = JSON.parse(
    localStorage.getItem("user")
  );

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      pincode: "",
    });

  useEffect(() => {

    fetchProfile();

  }, []);

  const fetchProfile = async () => {

    try {

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/profile/${userData.user.id}`
      );

      setFormData(data);

    } catch (error) {

      console.log(error);

    }

  };

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });

  };

  const updateProfile =
    async (e) => {

      e.preventDefault();

      try {

        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/auth/profile/${userData.user.id}`,
          formData
        );

        toast.success(
          "Profile Updated"
        );

      } catch (error) {

        toast.error(
          "Update Failed"
        );

      }

    };

  return (

    <div className="max-w-3xl mx-auto px-6 py-20">

      <h1 className="text-5xl font-bold mb-10">
        My Profile
      </h1>

      <form
        onSubmit={updateProfile}
        className="bg-white shadow-xl rounded-3xl p-8 space-y-5"
      >

        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          className="w-full border p-4 rounded-xl"
        />

        <input
          type="email"
          value={formData.email}
          disabled
          className="w-full border p-4 rounded-xl bg-gray-100"
        />

        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full border p-4 rounded-xl"
        />

        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address"
          className="w-full border p-4 rounded-xl h-32"
        />

        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="City"
          className="w-full border p-4 rounded-xl"
        />

        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          placeholder="Pincode"
          className="w-full border p-4 rounded-xl"
        />

        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-full"
        >
          Save Profile
        </button>

      </form>

    </div>

  );

}

export default Profile;
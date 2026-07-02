import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Container from "../components/Container";
function Profile() {

  const userData = JSON.parse(
    localStorage.getItem("user")
  );

  const [loading, setLoading] =
    useState(false);

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

      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        pincode: data.pincode || "",
      });

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed to load profile"
      );
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

      setLoading(true);

      try {

        const { data } =
          await axios.put(
            `${import.meta.env.VITE_API_URL}/api/auth/profile/${userData.user.id}`,
            formData
          );

        toast.success(
          "Profile Updated"
        );

        // Update localStorage

        const currentUser =
          JSON.parse(
            localStorage.getItem(
              "user"
            )
          );

        currentUser.user.name =
          data.name;

        localStorage.setItem(
          "user",
          JSON.stringify(
            currentUser
          )
        );

      } catch (error) {

        console.log(error);

        toast.error(
          "Update Failed"
        );

      } finally {

        setLoading(false);

      }

    };

  return (

    <Container className="py-20">

      <h1 className="text-5xl font-bold mb-10">
        My Profile
      </h1>

      <form
        onSubmit={updateProfile}
        className="bg-white shadow-xl rounded-3xl p-8 space-y-5"
      >

        <div>

          <label className="block mb-2 font-semibold">
            Full Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={
              handleChange
            }
            className="w-full border p-4 rounded-xl"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            Email
          </label>

          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full border p-4 rounded-xl bg-gray-100"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            Phone
          </label>

          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={
              handleChange
            }
            className="w-full border p-4 rounded-xl"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            Address
          </label>

          <textarea
            name="address"
            value={formData.address}
            onChange={
              handleChange
            }
            rows="4"
            className="w-full border p-4 rounded-xl"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            City
          </label>

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={
              handleChange
            }
            className="w-full border p-4 rounded-xl"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">
            Pincode
          </label>

          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={
              handleChange
            }
            className="w-full border p-4 rounded-xl"
          />

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-full font-semibold"
        >

          {loading
            ? "Updating..."
            : "Save Profile"}

        </button>

      </form>

    </Container>

  );

}

export default Profile;
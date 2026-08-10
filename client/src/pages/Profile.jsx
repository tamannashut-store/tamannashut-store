import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function Profile() {

  const userId = JSON.parse(localStorage.getItem("user"))?.user?.id;

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });

  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile/${userId}`)
      .then(({ data }) => { if (active) setFormData({ name: data.name || "", email: data.email || "", phone: data.phone || "", address: data.address || "", city: data.city || "", state: data.state || data.State || "", pincode: data.pincode || "" }); })
      .catch(() => { if (active) toast.error("Failed to load profile"); });
    return () => { active = false; };
  }, [userId]);

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
      ...(e.target.name === "pincode" ? { city: "", state: "" } : {}),
    });

  };

  const resolvePincode = async (showSuccess = false) => {
    if (!/^\d{6}$/.test(formData.pincode.trim())) { toast.error("Enter a valid 6-digit pincode"); return null; }
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/logistics/postcode/${formData.pincode.trim()}`);
      setFormData((current) => ({ ...current, pincode: data.pincode, city: data.city, state: data.state }));
      if (showSuccess) toast.success("Delivery location verified");
      return data;
    } catch (error) { toast.error(error.response?.data?.message || "This pincode could not be verified"); return null; }
  };

  const updateProfile =
    async (e) => {

      e.preventDefault();

      setLoading(true);

      try {

        const locality = await resolvePincode();
        if (!locality) return;

        const { data } =
          await axios.put(
            `${import.meta.env.VITE_API_URL}/api/auth/profile/${userId}`,
            { ...formData, city: locality.city, state: locality.state, pincode: locality.pincode }
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

    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:py-20">

      <h1 className="mb-8 text-3xl font-bold sm:mb-10 sm:text-5xl">
        My Profile
      </h1>

      <form
        onSubmit={updateProfile}
        className="space-y-5 rounded-3xl bg-white p-5 shadow-xl sm:p-8"
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
            readOnly
            className="w-full border p-4 rounded-xl bg-gray-50"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">State</label>

          <input type="text" name="state" value={formData.state} readOnly className="w-full border p-4 rounded-xl bg-gray-50" />

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
            onBlur={() => resolvePincode(true)}
            inputMode="numeric"
            maxLength="6"
            className="w-full border p-4 rounded-xl"
          />

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-full font-semibold"
        >

          {loading
            ? "Updating..."
            : "Save Profile"}

        </button>

      </form>

    </div>

  );

}

export default Profile;

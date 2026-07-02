import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Container from "../components/Container";
function ChangePassword() {

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  const [currentPassword,
    setCurrentPassword] =
      useState("");

  const [newPassword,
    setNewPassword] =
      useState("");

  const [confirmPassword,
    setConfirmPassword] =
      useState("");

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      if (
        newPassword !==
        confirmPassword
      ) {

        return toast.error(
          "Passwords do not match"
        );

      }

      try {

        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/auth/change-password/${user.user.id}`,
          {
            currentPassword,
            newPassword,
          }
        );

        toast.success(
          "Password Updated"
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

      } catch (error) {

        toast.error(
          error.response?.data?.message ||
          "Failed"
        );

      }

    };

  return (

    <Container className="py-20">

      <h1 className="text-4xl font-bold mb-8">
        Change Password
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-3xl p-8 space-y-5"
      >

        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) =>
            setCurrentPassword(
              e.target.value
            )
          }
          className="w-full border p-4 rounded-xl"
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(
              e.target.value
            )
          }
          className="w-full border p-4 rounded-xl"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(
              e.target.value
            )
          }
          className="w-full border p-4 rounded-xl"
        />

        <button
          className="w-full bg-pink-500 text-white py-4 rounded-full"
        >
          Update Password
        </button>

      </form>

    </Container>

  );

}

export default ChangePassword;
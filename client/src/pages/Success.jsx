import { Link } from "react-router-dom";
import Container from "../components/Container";
function Success() {

  return (

    <Container className="py-20">

      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full">

        <div className="text-6xl mb-5">
          🎉
        </div>

        <h1 className="text-4xl font-bold text-green-600 mb-4">
          Payment Successful
        </h1>

        <p className="text-gray-600 mb-8">
          Thank you for shopping with Tamanna's Hut.
        </p>

        <Link to="/shop">

          <button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full transition">

            Continue Shopping

          </button>

        </Link>

      </div>

    </Container>
  );
}

export default Success;
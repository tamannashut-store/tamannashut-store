import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {

  const [stats, setStats] = useState(null);

  useEffect(() => {

    fetchStats();

  }, []);

  const fetchStats = async () => {

    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/dashboard/stats`
    );

    setStats(data);
  };

  if (!stats) return <h1>Loading...</h1>;

  return (

    <div className="max-w-7xl mx-auto px-6 py-20">

      <h1 className="text-5xl font-bold mb-10">
        Admin Dashboard
      </h1>

      <div className="grid md:grid-cols-5 gap-6">

        <div className="bg-white shadow-xl p-6 rounded-3xl">
          <h2>Total Orders</h2>
          <p className="text-4xl font-bold">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white shadow-xl p-6 rounded-3xl">
          <h2>Total Products</h2>
          <p className="text-4xl font-bold">
            {stats.totalProducts}
          </p>
        </div>

        <div className="bg-white shadow-xl p-6 rounded-3xl">
          <h2>Total Users</h2>
          <p className="text-4xl font-bold">
            {stats.totalUsers}
          </p>
        </div>

        <div className="bg-white shadow-xl p-6 rounded-3xl">
          <h2>Pending Orders</h2>
          <p className="text-4xl font-bold">
            {stats.pendingOrders}
          </p>
        </div>

        <div className="bg-white shadow-xl p-6 rounded-3xl">
          <h2>Revenue</h2>
          <p className="text-4xl font-bold">
            ₹{stats.totalRevenue}
          </p>
        </div>

      </div>

    </div>

  );
}

export default AdminDashboard;
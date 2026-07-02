function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user"));
  
    return (
      <div
        style={{
          padding: "40px",
        }}
      >
        <h1>Dashboard</h1>
  
        <h2>Welcome {user?.name}</h2>
  
        <p>Email: {user?.email}</p>
      </div>
    );
  }
  
  export default Dashboard;
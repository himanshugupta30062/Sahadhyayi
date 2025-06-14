
import React from "react";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Dashboard</h1>
        <p className="text-gray-600 text-center">You are successfully signed in! 🎉</p>
      </div>
    </div>
  );
};

export default Dashboard;

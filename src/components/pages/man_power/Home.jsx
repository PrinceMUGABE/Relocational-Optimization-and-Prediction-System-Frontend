/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Users, ChartBar, Activity } from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const BASE_URL = "http://127.0.0.1:8000";

function Man_Power_Home() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
  });

  const [bookingData, setBookingData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);

  // Fetch user dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch total bookings
        const bookingsResponse = await axios.get(`${BASE_URL}/booking/user_bookings/`);
        setBookingData(bookingsResponse.data);

        // Fetch vehicle data
        const vehiclesResponse = await axios.get(`${BASE_URL}/vehicle/list_vehicles/`);
        setVehicleData(vehiclesResponse.data);

        // Calculate booking statistics
        setUserData({
          totalBookings: bookingsResponse.data.length,
          activeBookings: bookingsResponse.data.filter(booking => booking.status === 'Active').length,
          completedBookings: bookingsResponse.data.filter(booking => booking.status === 'Completed').length,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // Booking Status Chart Data
  const bookingStatusData = {
    labels: ['Total', 'Active', 'Completed'],
    datasets: [{
      data: [
        userData.totalBookings, 
        userData.activeBookings, 
        userData.completedBookings
      ],
      backgroundColor: COLORS.slice(0, 3),
    }]
  };

  // Vehicle Type Distribution
  const vehicleTypeData = {
    labels: vehicleData.map(vehicle => vehicle.type),
    datasets: [{
      data: vehicleData.map(vehicle => vehicle.total_weight_to_carry),
      backgroundColor: COLORS,
    }]
  };

  // Monthly Booking Trend (Mock data - replace with actual backend data)
  const monthlyBookingData = [
    { month: 'Jan', bookings: 4 },
    { month: 'Feb', bookings: 7 },
    { month: 'Mar', bookings: 5 },
    { month: 'Apr', bookings: 8 },
    { month: 'May', bookings: 6 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
            <Users className="mr-4 text-blue-500" size={48} />
            <div>
              <h2 className="text-xl font-semibold">Total Bookings</h2>
              <p className="text-3xl font-bold text-gray-700">{userData.totalBookings}</p>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
            <Activity className="mr-4 text-green-500" size={48} />
            <div>
              <h2 className="text-xl font-semibold">Active Bookings</h2>
              <p className="text-3xl font-bold text-gray-700">{userData.activeBookings}</p>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
            <ChartBar className="mr-4 text-purple-500" size={48} />
            <div>
              <h2 className="text-xl font-semibold">Completed Bookings</h2>
              <p className="text-3xl font-bold text-gray-700">{userData.completedBookings}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking Status Chart */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Booking Status</h2>
            <Doughnut 
              data={bookingStatusData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false 
              }} 
            />
          </div>

          {/* Vehicle Type Distribution */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Vehicle Type Distribution</h2>
            <Doughnut 
              data={vehicleTypeData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false 
              }} 
            />
          </div>

          {/* Monthly Booking Trend */}
          <div className="bg-white shadow-md rounded-lg p-6 col-span-full">
            <h2 className="text-xl font-semibold mb-4">Monthly Booking Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyBookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <RechartsBar dataKey="bookings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Man_Power_Home;
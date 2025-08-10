/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ChartBar,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Car,
  MapPin,
} from "lucide-react";
import {
  LineChart,
  BarChart,
  PieChart,
  Legend,
  Tooltip,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
  Label,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  Line,
  Bar,
} from "recharts";

// Color palette for charts
const COLORS = [
  "#0088FE", // Blue
  "#00C49F", // Green
  "#FFBB28", // Yellow
  "#FF8042", // Orange
  "#8884d8", // Purple
  "#82ca9d", // Light Green
  "#FF6B6B", // Red
  "#747EF7", // Indigo
  "#4ECDC4", // Teal
  "#F7B801", // Gold
];

const STATUS_COLORS = {
  active: "#10B981", // Green
  inactive: "#F87171", // Red
  pending: "#F59E0B", // Amber
  completed: "#3B82F6", // Blue
  inProgress: "#8B5CF6", // Purple
  canceled: "#6B7280", // Gray
  success: "#10B981", // Green
  failed: "#F87171", // Red
  error: "#EF4444", // Bright Red
};

const BASE_URL = "http://127.0.0.1:8000";

function AdminDashboard() {
  const navigate = useNavigate();

  // Fixed adapter functions
  const adaptUsersData = (backendUsers) => {
    // Correctly handle array structure that's already working
    return backendUsers.map((user) => ({
      id: user.id,
      role: user.role || "user",
      created_at: user.created_at || user.date_joined,
      // Other fields as needed
    }));
  };

  const adaptVehicleData = (backendVehicles) => {
    // Handle the case where vehicles is an array of objects without nested structure
    // Based on the console logs, vehicles are direct objects not in a nested 'vehicles' property
    return backendVehicles.map((vehicle) => ({
      id: vehicle.id,
      type: vehicle.type || "unknown",
      vehicle_status: vehicle.status || "active", // Use status if available
      created_date: vehicle.created_at || vehicle.created_date, // Handle different date field names
      plate_number: vehicle.plate_number,
      relocation_size: vehicle.relocation_size,
      driving_category: vehicle.driving_category,
    }));
  };

  const adaptDriversData = (backendDrivers) => {
    // Handle the case where drivers is an array of objects without nested structure
    // Based on the console logs, drivers are direct objects not in a nested 'drivers' property
    return backendDrivers.map((driver) => ({
      id: driver.id,
      availability_status:
        driver.availability_status || driver.status || "inactive",
      status: driver.status || "inactive",
      created_at: driver.created_at,
      first_name: driver.first_name,
      last_name: driver.last_name,
      driving_categories: driver.driving_categories,
    }));
  };

  const adaptFeedbackData = (backendFeedbacks) => {
    // Handle the case where feedbacks is an array of objects without nested structure
    return backendFeedbacks.map((feedback) => {
      // More robust rating extraction
      let rating = 0;
      if (typeof feedback.rating === "number") {
        rating = feedback.rating;
      } else if (
        typeof feedback.rating === "string" &&
        !isNaN(parseFloat(feedback.rating))
      ) {
        rating = parseFloat(feedback.rating);
      } else if (typeof feedback.rate === "number") {
        rating = feedback.rate;
      } else if (
        typeof feedback.rate === "string" &&
        !isNaN(parseFloat(feedback.rate))
      ) {
        rating = parseFloat(feedback.rate);
      }

      return {
        id: feedback.id,
        rating: rating,
        created_at: feedback.created_at || new Date().toISOString(),
      };
    });
  };

  // Modified function to handle demands data correctly
  // Modified function to handle demands data correctly and include predicted demand
  const adaptDemandsData = (demandsResponse) => {
    // Create a result array that will contain both past data and prediction
    let result = [];

    // Process past data if available
    if (demandsResponse.past_data && Array.isArray(demandsResponse.past_data)) {
      result = demandsResponse.past_data.map((demand) => ({
        id: demand.id || Math.random().toString(36).substring(7), // Generate ID if not present
        created_at:
          demand.date || demand.created_at || new Date().toISOString(),
        value: demand.value || demand.demand || 0,
        status: demand.status || "active",
        type: "historical", // Mark as historical data
        // Add other fields as needed
      }));
    }

    // Add the predicted demand as a separate entry if available
    if (demandsResponse.predicted_demand !== undefined) {
      // Create a prediction entry for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      result.push({
        id: "predicted-" + Math.random().toString(36).substring(7),
        created_at: tomorrow.toISOString(),
        value: demandsResponse.predicted_demand,
        status: "predicted",
        type: "prediction", // Mark as prediction data
      });
    }

    return result;
  };

  // Modified function to handle relocations data correctly
  const adaptRelocationsData = (relocationsData) => {
    // Handle direct array of relocation objects
    return relocationsData.map((relocation) => ({
      id: relocation.id,
      status: relocation.status || "pending",
      created_at:
        relocation.created_at || relocation.date || new Date().toISOString(),
      location: relocation.location || relocation.pickup_location || "Unknown",
      // Add other relevant fields
      destination: relocation.destination || relocation.dropoff_location,
      driver_id: relocation.driver_id,
      vehicle_id: relocation.vehicle_id,
    }));
  };

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);
  const [driverData, setDriverData] = useState([]);
  const [relocationData, setRelocationData] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [demandData, setDemandData] = useState([]);
  const [relocationsData, setRelocationsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [driversData, setDriversData] = useState([]);
  const [feedbacksData, setFeedbacksData] = useState([]);

  // Time-based metrics state
  const [timeMetrics, setTimeMetrics] = useState({
    daily: {
      users: [],
      vehicles: [],
      drivers: [],
      relocations: [],
      feedbacks: [],
      demands: [],
    },
    weekly: {
      users: [],
      vehicles: [],
      drivers: [],
      relocations: [],
      feedbacks: [],
      demands: [],
    },
    monthly: {
      users: [],
      vehicles: [],
      drivers: [],
      relocations: [],
      feedbacks: [],
      demands: [],
    },
  });

  // Status distribution state
  const [statusDistribution, setStatusDistribution] = useState({
    users: [],
    vehicles: [],
    drivers: [],
    relocations: [],
    demands: [],
  });

  // Feedback metrics state
  const [feedbackMetrics, setFeedbackMetrics] = useState({
    overallRating: 0,
    positiveCount: 0,
    negativeCount: 0,
    ratingDistribution: [],
    ratingTrend: [],
  });

  // Time period selector
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("weekly");

  // Process location metrics
  // Update the processLocationMetrics function to handle null locations
  const processLocationMetrics = (relocations) => {
    try {
      if (!relocations || !relocations.length) {
        return [];
      }

      // Group relocations by location with better null handling
      const locationCounts = {};
      relocations.forEach((relocation) => {
        const location = relocation.location || "Unknown";
        if (!locationCounts[location]) {
          locationCounts[location] = {
            count: 0,
            completed: 0,
            pending: 0,
            canceled: 0,
            in_progress: 0,
          };
        }
        locationCounts[location].count++;

        // Check both uppercase and lowercase status values
        const status = (relocation.status || "").toLowerCase();

        if (status === "completed") {
          locationCounts[location].completed++;
        } else if (status === "pending") {
          locationCounts[location].pending++;
        } else if (status === "canceled") {
          locationCounts[location].canceled++;
        } else if (status === "in_progress" || status === "inprogress") {
          locationCounts[location].in_progress++;
        }
      });

      return Object.entries(locationCounts)
        .map(([location, data]) => ({
          location,
          count: data.count,
          completed: data.completed,
          pending: data.pending,
          canceled: data.canceled,
          in_progress: data.in_progress,
          completionRate:
            data.count > 0
              ? Math.round((data.completed / data.count) * 100)
              : 0,
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error processing location metrics:", error);
      return [];
    }
  };

  // 2. Fix the processTimeMetrics function
  // Also update the processTimeMetrics function to handle demand prediction
  const processTimeMetrics = (
    users,
    vehicles,
    drivers,
    relocations,
    feedbacks,
    demands
  ) => {
    try {
      // Rest of the function remains the same...

      // Helper function to get date strings
      const getDateString = (dateObj) => {
        if (!dateObj) return null;
        const date = new Date(dateObj);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split("T")[0];
      };

      // Helper function to create date buckets
      const createDateBuckets = (daysAgo) => {
        const dates = [];
        for (let i = daysAgo; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(getDateString(date));
        }
        return dates;
      };

      // Modified helper function to handle demands with prediction
      const countDemandsByDate = (demands, dates) => {
        return dates.map((date) => {
          // Find historical data for this date
          const historicalItems = demands.filter((item) => {
            const itemDateRaw = item.created_at || item.date;
            if (!itemDateRaw) return false;

            const itemDate = getDateString(new Date(itemDateRaw));
            return itemDate === date && item.type === "historical";
          });

          // Find prediction data for this date
          const predictionItems = demands.filter((item) => {
            const itemDateRaw = item.created_at || item.date;
            if (!itemDateRaw) return false;

            const itemDate = getDateString(new Date(itemDateRaw));
            return itemDate === date && item.type === "prediction";
          });

          // If we have prediction data, use that value, otherwise use the count of historical data
          const count =
            predictionItems.length > 0
              ? predictionItems[0].value
              : historicalItems.length > 0
              ? historicalItems.reduce(
                  (sum, item) => sum + (item.value || 0),
                  0
                )
              : 0;

          return {
            date,
            count,
            isPrediction: predictionItems.length > 0,
          };
        });
      };

      // Generic helper for other data types
      const countItemsByDate = (items, dates, dateField = "created_at") => {
        return dates.map((date) => {
          // More robust checking for various date field names
          const count = items.filter((item) => {
            // Check different possible date field names
            const itemDateRaw =
              item[dateField] ||
              item.created_date ||
              item.date_created ||
              item.date_joined;
            if (!itemDateRaw) return false;

            const itemDate = getDateString(new Date(itemDateRaw));
            return itemDate === date;
          }).length;

          return {
            date,
            count,
          };
        });
      };

      // Create daily, weekly, and monthly date buckets
      const dailyDates = createDateBuckets(6); // Last 7 days
      const weeklyDates = createDateBuckets(28); // Last 4 weeks
      const monthlyDates = createDateBuckets(180); // Last 6 months

      // Process metrics for each time period
      const daily = {
        users: countItemsByDate(users, dailyDates, "created_at"),
        vehicles: countItemsByDate(vehicles, dailyDates, "created_date"),
        drivers: countItemsByDate(drivers, dailyDates, "created_at"),
        relocations: countItemsByDate(relocations, dailyDates, "created_at"),
        feedbacks: countItemsByDate(feedbacks, dailyDates, "created_at"),
        demands: countDemandsByDate(demands, dailyDates),
      };

      const weekly = {
        users: countItemsByDate(users, weeklyDates, "created_at"),
        vehicles: countItemsByDate(vehicles, weeklyDates, "created_date"),
        drivers: countItemsByDate(drivers, weeklyDates, "created_at"),
        relocations: countItemsByDate(relocations, weeklyDates, "created_at"),
        feedbacks: countItemsByDate(feedbacks, weeklyDates, "created_at"),
        demands: countDemandsByDate(demands, weeklyDates),
      };

      const monthly = {
        users: countItemsByDate(users, monthlyDates, "created_at"),
        vehicles: countItemsByDate(vehicles, monthlyDates, "created_date"),
        drivers: countItemsByDate(drivers, monthlyDates, "created_at"),
        relocations: countItemsByDate(relocations, monthlyDates, "created_at"),
        feedbacks: countItemsByDate(feedbacks, monthlyDates, "created_at"),
        demands: countDemandsByDate(demands, monthlyDates),
      };

      return { daily, weekly, monthly };
    } catch (error) {
      console.error("Error processing time metrics:", error);
      return {
        daily: {
          users: [],
          vehicles: [],
          drivers: [],
          relocations: [],
          feedbacks: [],
          demands: [],
        },
        weekly: {
          users: [],
          vehicles: [],
          drivers: [],
          relocations: [],
          feedbacks: [],
          demands: [],
        },
        monthly: {
          users: [],
          vehicles: [],
          drivers: [],
          relocations: [],
          feedbacks: [],
          demands: [],
        },
      };
    }
  };

  // 3. Fix the processStatusDistribution function
  // You'll also want to update the processStatusDistribution to handle prediction status
  const processStatusDistribution = (
    users,
    vehicles,
    drivers,
    relocations,
    demands
  ) => {
    try {
      // Helper function with improved status detection
      const countByStatus = (
        items,
        statusField = "status",
        defaultValue = "unknown"
      ) => {
        if (!items || !items.length) return [];

        const statusCounts = {};
        items.forEach((item) => {
          let status;

          if (statusField === "vehicle_status") {
            // More robust detection for vehicle status
            status = item.vehicle_status || "active";
          } else if (statusField === "availability_status") {
            // For drivers, check multiple fields
            status = item.availability_status || item.status || defaultValue;
          } else if (statusField === "role") {
            status = item.role || defaultValue;
          } else {
            status = item[statusField] || defaultValue;
          }

          // Normalize status to lowercase for consistency
          status = String(status).toLowerCase();

          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: items.length
            ? Math.round((count / items.length) * 100)
            : 0,
        }));
      };

      // Special handling for demands to include prediction status
      const countDemandsByStatus = (demands) => {
        if (!demands || !demands.length) return [];

        const statusCounts = {
          historical: 0,
          predicted: 0,
        };

        demands.forEach((item) => {
          if (item.type === "prediction") {
            statusCounts.predicted = (statusCounts.predicted || 0) + 1;
          } else {
            statusCounts.historical = (statusCounts.historical || 0) + 1;
          }
        });

        return Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: demands.length
            ? Math.round((count / demands.length) * 100)
            : 0,
        }));
      };

      // Process with improved status detection
      return {
        users: countByStatus(users, "role", "user"),
        vehicles: countByStatus(vehicles, "vehicle_status", "active"),
        drivers: countByStatus(drivers, "availability_status", "inactive"),
        relocations: countByStatus(relocations, "status", "pending"),
        demands: countDemandsByStatus(demands),
      };
    } catch (error) {
      console.error("Error processing status distribution:", error);
      return {
        users: [],
        vehicles: [],
        drivers: [],
        relocations: [],
        demands: [],
      };
    }
  };

  // 4. Fix the processFeedbackMetrics function
  const processFeedbackMetrics = (feedbacks) => {
    try {
      // Skip processing if no feedback data
      if (!feedbacks || !feedbacks.length) {
        return {
          overallRating: "0.0",
          positiveCount: 0,
          negativeCount: 0,
          ratingDistribution: [],
          ratingTrend: [],
        };
      }

      // Helper function to safely extract rating value
      const getRating = (feedback) => {
        // First try the primary rating field
        if (typeof feedback.rating === "number") return feedback.rating;

        // Next try to parse it as a number if it's a string
        if (typeof feedback.rating === "string") {
          const parsed = parseFloat(feedback.rating);
          if (!isNaN(parsed)) return parsed;
        }

        // Fall back to rate field
        if (typeof feedback.rate === "number") return feedback.rate;

        // Try to parse rate as number if it's a string
        if (typeof feedback.rate === "string") {
          const parsed = parseFloat(feedback.rate);
          if (!isNaN(parsed)) return parsed;
        }

        // Default to 0
        return 0;
      };

      // Calculate overall rating with improved parsing
      const ratings = feedbacks.map((feedback) => getRating(feedback));
      const validRatings = ratings.filter((r) => r > 0);

      let overallRating = "0.0";
      if (validRatings.length > 0) {
        const totalRating = validRatings.reduce(
          (sum, rating) => sum + rating,
          0
        );
        overallRating = (totalRating / validRatings.length).toFixed(1);
      }

      // Count positive (≥3) and negative (<3) feedbacks
      const positiveCount = ratings.filter((r) => r >= 3).length;
      const negativeCount = ratings.filter((r) => r > 0 && r < 3).length;

      // Create rating distribution with improved parsing
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbacks.forEach((feedback) => {
        const rating = Math.round(getRating(feedback));
        if (rating >= 1 && rating <= 5) {
          ratingCounts[rating]++;
        }
      });

      const ratingDistribution = Object.entries(ratingCounts).map(
        ([rating, count]) => ({
          rating: parseInt(rating),
          count,
          percentage: validRatings.length
            ? Math.round((count / validRatings.length) * 100)
            : 0,
        })
      );

      // Create rating trend (monthly)
      const ratingByMonth = {};
      const countByMonth = {};

      feedbacks.forEach((feedback) => {
        // More robust date handling
        if (!feedback.created_at) return;

        const date = new Date(feedback.created_at);
        if (isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const rating = getRating(feedback);
        if (rating <= 0) return;

        if (!ratingByMonth[monthKey]) {
          ratingByMonth[monthKey] = 0;
          countByMonth[monthKey] = 0;
        }

        ratingByMonth[monthKey] += rating;
        countByMonth[monthKey]++;
      });

      const ratingTrend = Object.entries(ratingByMonth)
        .map(([month, totalRating]) => ({
          month,
          avgRating: (totalRating / countByMonth[month]).toFixed(1),
          count: countByMonth[month],
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        overallRating,
        positiveCount,
        negativeCount,
        ratingDistribution,
        ratingTrend,
      };
    } catch (error) {
      console.error("Error processing feedback metrics:", error);
      return {
        overallRating: "0.0",
        positiveCount: 0,
        negativeCount: 0,
        ratingDistribution: [],
        ratingTrend: [],
      };
    }
  };

  // Fetch Data
  // Fetch Data - Fix the data fetching and state updates
  useEffect(() => {
    const fetchAllData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        // Fetch all data from endpoints
        const [
          usersRes,
          vehiclesRes,
          relocationsRes,
          driversRes,
          demandsRes,
          feedbacksRes,
        ] = await Promise.all([
          fetch(`${BASE_URL}/users/`, { headers }),
          fetch(`${BASE_URL}/vehicle/list_vehicles/`, { headers }),
          fetch(`${BASE_URL}/relocation/all/`, { headers }),
          fetch(`${BASE_URL}/driver/drivers/`, { headers }),
          fetch(`${BASE_URL}/demand/forecasts/`, { headers }),
          fetch(`${BASE_URL}/feedback/feedbacks/`, { headers }),
        ]);

        // Parse the JSON responses
        const [
          usersData,
          vehiclesData,
          relocationsData,
          driversData,
          demandsData,
          feedbacksData,
        ] = await Promise.all([
          usersRes.json(),
          vehiclesRes.json(),
          relocationsRes.json(),
          driversRes.json(),
          demandsRes.json(),
          feedbacksRes.json(),
        ]);

        // Log the raw data
        console.log("Users Data:", usersData);
        console.log("Vehicles Data:", vehiclesData);
        console.log("Relocations Data:", relocationsData);
        console.log("Drivers Data:", driversData);
        console.log("Demands Data:", demandsData);
        console.log("Feedbacks Data:", feedbacksData);

        // Use adapter functions with correct input structure
        const adaptedUsers = adaptUsersData(usersData?.users || []);

        // For vehicles, use the direct array if no nested vehicles property
        const vehiclesToAdapt = Array.isArray(vehiclesData)
          ? vehiclesData
          : vehiclesData?.vehicles || [];
        const adaptedVehicles = adaptVehicleData(vehiclesToAdapt);

        // For relocations, use the direct array if no nested relocations property
        const relocationsToAdapt = Array.isArray(relocationsData)
          ? relocationsData
          : relocationsData?.relocations || [];
        const adaptedRelocations = adaptRelocationsData(relocationsToAdapt);

        // For drivers, use the direct array if no nested drivers property
        const driversToAdapt = Array.isArray(driversData)
          ? driversData
          : driversData?.drivers || [];
        const adaptedDrivers = adaptDriversData(driversToAdapt);

        // For demands, use the specialized adapter that handles the nested structure
        const adaptedDemands = adaptDemandsData(demandsData);

        // For feedbacks, use the direct array if no nested feedbacks property
        const feedbacksToAdapt = Array.isArray(feedbacksData)
          ? feedbacksData
          : feedbacksData?.feedbacks || [];
        const adaptedFeedbacks = adaptFeedbackData(feedbacksToAdapt);

        // Log the adapted data
        console.log("Adapted Users:", adaptedUsers);
        console.log("Adapted Vehicles:", adaptedVehicles);
        console.log("Adapted Relocations:", adaptedRelocations);
        console.log("Adapted Drivers:", adaptedDrivers);
        console.log("Adapted Demands:", adaptedDemands);
        console.log("Adapted Feedbacks:", adaptedFeedbacks);

        // Set state with the adapted data
        setUserData(adaptedUsers);
        setVehicleData(adaptedVehicles);
        setDriverData(adaptedDrivers);
        setFeedbackData(adaptedFeedbacks);
        setDemandData(adaptedDemands);
        setRelocationData(adaptedRelocations);

        // Calculate location metrics
        const locationMetrics = processLocationMetrics(adaptedRelocations);
        setRelocationsData(locationMetrics);

        // Process time-based metrics and set state
        const timeMetricsData = processTimeMetrics(
          adaptedUsers,
          adaptedVehicles,
          adaptedDrivers,
          adaptedRelocations,
          adaptedFeedbacks,
          adaptedDemands
        );
        setTimeMetrics(timeMetricsData);

        // Process status distribution
        const statusDistData = processStatusDistribution(
          adaptedUsers,
          adaptedVehicles,
          adaptedDrivers,
          adaptedRelocations,
          adaptedDemands
        );
        setStatusDistribution(statusDistData);

        // Process feedback metrics
        const feedbackMetricsData = processFeedbackMetrics(adaptedFeedbacks);
        setFeedbackMetrics(feedbackMetricsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  // Format display date
  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="mt-20 p-6 flex items-center justify-center">
        <div className="text-lg font-semibold text-gray-600">
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 p-6 flex items-center justify-center">
        <div className="text-lg font-semibold text-red-600">Error: {error}</div>
      </div>
    );
  }

  const activeMetrics = timeMetrics[selectedTimePeriod] ||
    timeMetrics.weekly || {
      users: [],
      vehicles: [],
      drivers: [],
      relocations: [],
      feedbacks: [],
      demands: [],
    };

  const renderDemandChart = () => {
    const demandData = timeMetrics[selectedTimePeriod]?.demands || [];

    return (
      <div className="relative">
        <BarChart
          data={demandData}
          width={600}
          height={300}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatDisplayDate} />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* Render different bars for predictions vs historical data */}
          <Bar
            dataKey="count"
            name="Demand"
            fill={(data) => (data.isPrediction ? "#8884d8" : "#82ca9d")}
          />
        </BarChart>
        <div className="absolute top-0 right-0 flex items-center space-x-2 p-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#82ca9d] mr-1"></div>
            <span className="text-xs">Historical</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#8884d8] mr-1"></div>
            <span className="text-xs">Predicted</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen text-gray-300">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-red-500">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTimePeriod("daily")}
            className={`px-4 py-2 rounded-md ${
              selectedTimePeriod === "daily"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setSelectedTimePeriod("weekly")}
            className={`px-4 py-2 rounded-md ${
              selectedTimePeriod === "weekly"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setSelectedTimePeriod("monthly")}
            className={`px-4 py-2 rounded-md ${
              selectedTimePeriod === "monthly"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Users Card */}
        <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-800 hover:border-gray-700 transition-all">
          <div className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-800 p-3">
                <Users className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-200">
                  {userData.length}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Active:{" "}
                  {statusDistribution.users.find((s) => s.role === "customer")
                    ?.count || 0}
                </span>
                <span className="text-green-400">
                  +
                  {activeMetrics.users
                    .slice(-7)
                    .reduce((sum, day) => sum + day.count, 0)}{" "}
                  new
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Card */}
        <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-800 hover:border-gray-700 transition-all">
          <div className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-800 p-3">
                <Car className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-200">
                  {vehicleData.length}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Active:{" "}
                  {statusDistribution.vehicles.find(
                    (s) => s.status === "active"
                  )?.count || 0}
                </span>
                <span className="text-green-400">
                  +
                  {activeMetrics.vehicles
                    .slice(-7)
                    .reduce((sum, day) => sum + day.count, 0)}{" "}
                  new
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drivers Card */}
        <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-800 hover:border-gray-700 transition-all">
          <div className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-800 p-3">
                <Users className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-200">
                  {driverData.length}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Active:{" "}
                  {statusDistribution.drivers.find((s) => s.status === "active")
                    ?.count || 0}
                </span>
                <span className="text-green-400">
                  +
                  {activeMetrics.drivers
                    .slice(-7)
                    .reduce((sum, day) => sum + day.count, 0)}{" "}
                  new
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Relocations Card */}
        <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-800 hover:border-gray-700 transition-all">
          <div className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-800 p-3">
                <MapPin className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Relocations</p>
                <p className="text-2xl font-bold text-gray-200">
                  {relocationData.length}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Completed:{" "}
                  {statusDistribution.relocations.find(
                    (s) => s.status === "completed"
                  )?.count || 0}
                </span>
                <span className="text-green-400">
                  +
                  {activeMetrics.relocations
                    .slice(-7)
                    .reduce((sum, day) => sum + day.count, 0)}{" "}
                  new
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Demands Card */}
        <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-800 hover:border-gray-700 transition-all">
          <div className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-800 p-3">
                <ChartBar className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Demands</p>
                <p className="text-2xl font-bold text-gray-200">
                  {demandData.length}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Active:{" "}
                  {statusDistribution.demands.find((s) => s.status === "active")
                    ?.count || 0}
                </span>
                <span className="text-green-400">
                  +
                  {activeMetrics.demands
                    .slice(-7)
                    .reduce((sum, day) => sum + day.count, 0)}{" "}
                  new
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Card */}
        <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-800 hover:border-gray-700 transition-all">
          <div className="p-5">
            <div className="flex items-center">
              <div className="rounded-full bg-gray-800 p-3">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Feedbacks</p>
                <p className="text-2xl font-bold text-gray-200">
                  {feedbackData.length}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <ThumbsUp className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-gray-400">
                    {feedbackMetrics.positiveCount || 0}
                  </span>
                  <ThumbsDown className="h-4 w-4 text-red-400 ml-3 mr-1" />
                  <span className="text-gray-400">
                    {feedbackMetrics.negativeCount || 0}
                  </span>
                </div>
                <span className="text-blue-400">
                  {feedbackMetrics.overallRating || "0"}/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Time Series Chart - Activity Over Time */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-md border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-red-500">
            Activity Over Time
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            This line chart shows the trend of new users, vehicles, drivers,
            relocations, and demands over the selected time period. Use it to
            track growth patterns and identify busy periods.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeMetrics.users.map((day, index) => ({
                  date: formatDisplayDate(day.date),
                  Users: day.count,
                  Vehicles: activeMetrics.vehicles[index]?.count || 0,
                  Drivers: activeMetrics.drivers[index]?.count || 0,
                  Relocations: activeMetrics.relocations[index]?.count || 0,
                  Demands: activeMetrics.demands[index]?.count || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    color: "#E5E7EB",
                  }}
                  formatter={(value) => [`${value}`, ``]}
                />
                <RechartsLegend wrapperStyle={{ color: "#9CA3AF" }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

                {["Users", "Vehicles", "Drivers", "Relocations", "Demands"].map(
                  (key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={COLORS[index % COLORS.length]}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  )
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-md border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-red-500">
            Status Distribution
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            This bar chart displays the current status distribution across
            users, vehicles, and relocations. It helps visualize the proportion
            of active vs. inactive items in your system.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  ...statusDistribution.users.map((item) => ({
                    name: `Users: ${item.status}`,
                    count: item.count,
                    fill: STATUS_COLORS[item.status] || COLORS[0],
                  })),
                  ...statusDistribution.vehicles.map((item) => ({
                    name: `Vehicles: ${item.status}`,
                    count: item.count,
                    fill: STATUS_COLORS[item.status] || COLORS[1],
                  })),
                  ...statusDistribution.relocations.map((item) => ({
                    name: `Relocations: ${item.status}`,
                    count: item.count,
                    fill: STATUS_COLORS[item.status] || COLORS[2],
                  })),
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 10,
                    angle: -45,
                    textAnchor: "end",
                    fill: "#9CA3AF",
                  }}
                  height={80}
                />
                <YAxis tick={{ fill: "#9CA3AF" }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    color: "#E5E7EB",
                  }}
                  formatter={(value) => [`${value}`, ``]}
                />
                <Bar
                  dataKey="count"
                  name="Count"
                  fill={(entry) => entry.fill}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Distribution Chart */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-md border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-red-500">
            Feedback Rating Distribution
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            The pie chart breaks down customer feedback by star rating. Green
            sections represent positive ratings (3-5 stars), while red shows
            negative ratings (1-2 stars). The percentages show each rating's
            proportion.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feedbackMetrics.ratingDistribution}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  label={({ rating, percentage }) =>
                    `${rating} ★ (${percentage}%)`
                  }
                  labelLine={{ stroke: "#9CA3AF" }}
                >
                  {feedbackMetrics.ratingDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.rating >= 3 ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    color: "#E5E7EB",
                  }}
                  formatter={(value, name) => [
                    `${value} ratings`,
                    `${name} stars`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Trend Chart */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-md border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-red-500">
            Feedback Rating Trend
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            This area chart tracks the monthly average rating (red line) and
            total feedback volume (blue area). Use it to monitor customer
            satisfaction trends over time and correlate with system changes.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feedbackMetrics.ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF" }} />
                <YAxis domain={[0, 5]} tick={{ fill: "#9CA3AF" }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    color: "#E5E7EB",
                  }}
                  formatter={(value) => [`${value}`, ``]}
                />
                <Area
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.2}
                  name="Average Rating"
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  name="Number of Feedbacks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-gray-900 rounded-xl shadow-md p-6 mt-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-red-500">
          Location Distribution
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total Relocations
                </th>
                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {relocationsData.slice(0, 5).map((location, index) => (
                <tr
                  key={location.relocation}
                  className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {location.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {location.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {location.pending}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-red-600 h-2.5 rounded-full"
                          style={{ width: `${location.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-300">
                        {location.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;

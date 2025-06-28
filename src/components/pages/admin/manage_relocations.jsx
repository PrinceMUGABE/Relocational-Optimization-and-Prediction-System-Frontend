/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faDownload,
  faSearch,
  faTruck,
  faChartPie,
  faPlus,
  faRoad,
} from "@fortawesome/free-solid-svg-icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import mapData from "../customer/mapData.json";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-100 bg-red-900 rounded-lg">
          <h3 className="font-semibold">Something went wrong</h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Admin_Manage_Relocations() {
  const [relocations, setRelocations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [relocationsPerPage, setRelocationsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [downloadMenuVisible, setDownloadMenuVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRelocation, setCurrentRelocation] = useState(null);
  const navigate = useNavigate();

  // Destination location states
  // Simplified location states - removed province states
  const [selectedOriginDistrict, setSelectedOriginDistrict] = useState("");
  const [selectedOriginSector, setSelectedOriginSector] = useState("");
  const [selectedDestDistrict, setSelectedDestDistrict] = useState("");
  const [selectedDestSector, setSelectedDestSector] = useState("");

  const [startCoordinates, setStartCoordinates] = useState(null);
  const [endCoordinates, setEndCoordinates] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterOriginDistrict, setFilterOriginDistrict] = useState("");
  const [filterDestDistrict, setFilterDestDistrict] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const COLORS = ["#FF6B6B", "#4ECDC4", "#FFD166", "#F9F871"];
  const BASE_URL = "http://127.0.0.1:8000/relocation/";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    const accessToken = storedUserData
      ? JSON.parse(storedUserData).access_token
      : null;
    if (!accessToken) {
      navigate("/login");
      return;
    }
    handleFetch();
  }, [navigate]);

  // Fetch vehicles when component mounts
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/vehicle/list_vehicles/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVehicles(response.data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    fetchVehicles();
  }, [token]);

  // Fetch drivers when component mounts
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/driver/drivers/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDrivers(response.data);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    fetchDrivers();
  }, [token]);

  // Improved useMemo for extracting districts and sectors
  const allDistricts = useMemo(() => {
    let districts = [];
    if (!mapData || !mapData.provinces) {
      console.error("Map data is not properly structured:", mapData);
      return [];
    }

    mapData.provinces.forEach((province) => {
      if (province.coordinates && province.coordinates.districts) {
        province.coordinates.districts.forEach((district) => {
          districts.push(district);
        });
      }
    });

    console.log(
      "Extracted districts:",
      districts.map((d) => d.name)
    );
    return districts;
  }, []);

  // Enhanced getSectors function with error handling
  const getSectors = (districtName) => {
    if (!districtName) return [];

    const district = allDistricts.find((d) => d.name === districtName);
    if (!district) {
      console.warn(`District not found: ${districtName}`);
      return [];
    }

    if (!district.sectors || !Array.isArray(district.sectors)) {
      console.warn(`No sectors found for district: ${districtName}`);
      return [];
    }

    return district.sectors;
  };

  // Improved coordinate finding function
  const findSectorCoordinates = (districtName, sectorName) => {
    if (!districtName || !sectorName) {
      console.warn("Missing district or sector name in coordinate lookup");
      return null;
    }

    const district = allDistricts.find((d) => d.name === districtName);
    if (!district) {
      console.warn(`District not found for coordinates: ${districtName}`);
      return null;
    }

    const sector = district.sectors.find((s) => s.name === sectorName);
    if (!sector) {
      console.warn(
        `Sector not found for coordinates: ${sectorName} in ${districtName}`
      );
      return null;
    }

    if (!sector.latitude || !sector.longitude) {
      console.warn(`Missing coordinates for sector: ${sectorName}`);
      return null;
    }

    return { latitude: sector.latitude, longitude: sector.longitude };
  };

  // Fix for the openModal function
  // Fix for the openModal function - properly set location values
  // Fix for the openModal function
  const openModal = (relocation = null) => {
    setIsModalOpen(true);

    if (relocation) {
      // Set the current relocation first
      setCurrentRelocation(relocation);

      // Then set location fields with a slight delay to ensure currentRelocation is set
      setTimeout(() => {
        // Set districts
        setSelectedOriginDistrict(relocation.origin_district || "");
        setSelectedDestDistrict(relocation.destination_district || "");

        // Set sectors after districts are set
        setTimeout(() => {
          setSelectedOriginSector(relocation.origin_sector || "");
          setSelectedDestSector(relocation.destination_sector || "");
        }, 50);
      }, 50);
    } else {
      // Reset form for new relocation
      setCurrentRelocation(null);
      setSelectedOriginDistrict("");
      setSelectedOriginSector("");
      setSelectedDestDistrict("");
      setSelectedDestSector("");
    }
  };

  useEffect(() => {
    if (currentRelocation && isModalOpen) {
      // Set location values from the current relocation
      setSelectedOriginDistrict(currentRelocation.origin_district || "");
      setSelectedDestDistrict(currentRelocation.destination_district || "");

      // Only set sectors if they exist and a district is selected
      if (
        currentRelocation.origin_district &&
        currentRelocation.origin_sector
      ) {
        const originSectors = getSectors(currentRelocation.origin_district);
        const originSectorExists = originSectors.some(
          (sector) => sector.name === currentRelocation.origin_sector
        );

        if (originSectorExists) {
          setSelectedOriginSector(currentRelocation.origin_sector);
        }
      }

      if (
        currentRelocation.destination_district &&
        currentRelocation.destination_sector
      ) {
        const destSectors = getSectors(currentRelocation.destination_district);
        const destSectorExists = destSectors.some(
          (sector) => sector.name === currentRelocation.destination_sector
        );

        if (destSectorExists) {
          setSelectedDestSector(currentRelocation.destination_sector);
        }
      }
    }
  }, [currentRelocation, isModalOpen]);

  // Add a debugging useEffect to track all form state changes
  useEffect(() => {
    if (currentRelocation) {
      console.log("Form state updated:", {
        originDistrict: selectedOriginDistrict,
        originSector: selectedOriginSector,
        destDistrict: selectedDestDistrict,
        destSector: selectedDestSector,
        relocationData: {
          origin_district: currentRelocation.origin_district,
          origin_sector: currentRelocation.origin_sector,
          destination_district: currentRelocation.destination_district,
          destination_sector: currentRelocation.destination_sector,
        },
      });
    }
  }, [
    selectedOriginDistrict,
    selectedOriginSector,
    selectedDestDistrict,
    selectedDestSector,
    currentRelocation,
  ]);

  const handleFetch = async () => {
    try {
      const res = await axios.get(`${BASE_URL}all/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Data: ", res.data);
      setRelocations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching relocations:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Do you want to delete this relocation?")) return;
    try {
      await axios.delete(`${BASE_URL}delete/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await handleFetch();
      setMessage("Relocation deleted successfully");
      setMessageType("success");
      setCurrentPage(1);
    } catch (err) {
      console.error("Error deleting relocation:", err);
      setMessage(err.response?.data.message || "An error occurred");
      setMessageType("error");
    }
  };

  const handleDownload = {
    PDF: () => {
      const doc = new jsPDF();
      doc.autoTable({ html: "#relocation-table" });
      doc.save("relocations.pdf");
    },
    Excel: () => {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(relocations),
        "Relocations"
      );
      XLSX.writeFile(workbook, "relocations.xlsx");
    },
    CSV: () => {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        Object.keys(relocations[0]).join(",") +
        "\n" +
        relocations.map((row) => Object.values(row).join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "relocations.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  };

  // Add this function after the handleAddUpdateRelocation function
  // This will create summary stat cards to display at the top of the page

  const renderSummaryCards = () => {
    if (!relocations.length) return null;

    // Calculate summary statistics
    const totalRelocations = relocations.length;
    const pendingRelocations = relocations.filter(
      (r) => r.status === "pending"
    ).length;
    const completedRelocations = relocations.filter(
      (r) => r.status === "completed"
    ).length;
    const inProgressRelocations = relocations.filter(
      (r) => r.status === "in_progress"
    ).length;
    const canceledRelocations = relocations.filter(
      (r) => r.status === "canceled"
    ).length;

    // Calculate total revenue
    const totalRevenue = relocations.reduce(
      (sum, r) => sum + Number(r.adjusted_cost || 0),
      0
    );

    // Get upcoming relocations (scheduled within the next 7 days)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const upcomingRelocations = relocations.filter((r) => {
      const moveDate = new Date(r.move_datetime);
      return moveDate >= now && moveDate <= nextWeek;
    }).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Relocations Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center">
          <div className="p-3 rounded-full bg-blue-900 bg-opacity-30 mr-4">
            <FontAwesomeIcon icon={faTruck} className="text-blue-400 text-xl" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Relocations</p>
            <h3 className="text-2xl font-bold text-white">
              {totalRelocations}
            </h3>
          </div>
        </div>

        {/* Upcoming Relocations Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center">
          <div className="p-3 rounded-full bg-purple-900 bg-opacity-30 mr-4">
            <FontAwesomeIcon
              icon={faRoad}
              className="text-purple-400 text-xl"
            />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Upcoming (7 days)</p>
            <h3 className="text-2xl font-bold text-white">
              {upcomingRelocations}
            </h3>
          </div>
        </div>

        {/* Status Distribution Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Status Distribution</p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-xs text-gray-300">
                  Pending: {pendingRelocations}
                </span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-xs text-gray-300">
                  In Progress: {inProgressRelocations}
                </span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-300">
                  Completed: {completedRelocations}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-xs text-gray-300">
                  Canceled: {canceledRelocations}
                </span>
              </div>
            </div>
            <div className="h-16 w-16 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(
                  #3B82F6 0% ${(pendingRelocations / totalRelocations) * 100}%, 
                  #EAB308 ${(pendingRelocations / totalRelocations) * 100}% ${
                      ((pendingRelocations + inProgressRelocations) /
                        totalRelocations) *
                      100
                    }%, 
                  #10B981 ${
                    ((pendingRelocations + inProgressRelocations) /
                      totalRelocations) *
                    100
                  }% ${
                      ((pendingRelocations +
                        inProgressRelocations +
                        completedRelocations) /
                        totalRelocations) *
                      100
                    }%, 
                  #EF4444 ${
                    ((pendingRelocations +
                      inProgressRelocations +
                      completedRelocations) /
                      totalRelocations) *
                    100
                  }% 100%
                )`,
                  }}
                ></div>
                <div className="absolute inset-2 rounded-full bg-gray-900"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center">
          <div className="p-3 rounded-full bg-green-900 bg-opacity-30 mr-4">
            <FontAwesomeIcon
              icon={faChartPie}
              className="text-green-400 text-xl"
            />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <h3 className="text-2xl font-bold text-white">
              ${totalRevenue.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>
    );
  };

  // Add this function after the renderSummaryCards function
  const renderAdvancedFilters = () => {
    return (
      <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700 mb-6">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <h3 className="text-gray-200 font-medium">Advanced Filters</h3>
          <button className="text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${
                isFilterExpanded ? "transform rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {isFilterExpanded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Start Date
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                End Date
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Origin District
              </label>
              <select
                value={filterOriginDistrict}
                onChange={(e) => setFilterOriginDistrict(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 text-sm"
              >
                <option value="">All Districts</option>
                {allDistricts.map((district) => (
                  <option key={district.name} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm">
                Destination District
              </label>
              <select
                value={filterDestDistrict}
                onChange={(e) => setFilterDestDistrict(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 text-sm"
              >
                <option value="">All Districts</option>
                {allDistricts.map((district) => (
                  <option key={district.name} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setFilterOriginDistrict("");
                  setFilterDestDistrict("");
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add this function after the renderAdvancedFilters function
  const renderRecentActivity = () => {
    // Get 5 most recent relocations (sort by creation date)
    const recentRelocations = [...relocations]
      .sort(
        (a, b) =>
          new Date(b.created_at || b.move_datetime) -
          new Date(a.created_at || a.move_datetime)
      )
      .slice(0, 5);

    if (!recentRelocations.length) return null;

    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center">
          <FontAwesomeIcon icon={faRoad} className="mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentRelocations.map((relocation) => {
            // Determine colors based on status
            let statusColor;
            switch (relocation.status) {
              case "pending":
                statusColor = "bg-blue-500";
                break;
              case "in_progress":
                statusColor = "bg-yellow-500";
                break;
              case "completed":
                statusColor = "bg-green-500";
                break;
              case "canceled":
                statusColor = "bg-red-500";
                break;
              default:
                statusColor = "bg-gray-500";
            }

            return (
              <div key={relocation.id} className="flex">
                <div className="mr-4 flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                  <div className="w-0.5 h-full bg-gray-700"></div>
                </div>
                <div className="flex-1 bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-200">
                        Relocation #{relocation.id}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {relocation.origin_sector}, {relocation.origin_district}{" "}
                        → {relocation.destination_sector},{" "}
                        {relocation.destination_district}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full capitalize ${
                        relocation.status === "pending"
                          ? "bg-blue-900 text-blue-200"
                          : relocation.status === "in_progress"
                          ? "bg-yellow-900 text-yellow-200"
                          : relocation.status === "completed"
                          ? "bg-green-900 text-green-200"
                          : "bg-red-900 text-red-200"
                      }`}
                    >
                      {relocation.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>
                      <strong>Vehicle:</strong>{" "}
                      {relocation.vehicle?.plate_number || "Not assigned"} •
                      <strong> Date:</strong>{" "}
                      {new Date(relocation.move_datetime).toLocaleDateString()}{" "}
                      •<strong> Cost:</strong> $
                      {Number(relocation.adjusted_cost || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    if (!relocations.length) return null;

    const relocationStatusData = Object.entries(
      relocations.reduce((acc, relocation) => {
        acc[relocation.status] = (acc[relocation.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, value]) => ({ name: status, value }));

    const relocationSizeData = Object.entries(
      relocations.reduce((acc, relocation) => {
        acc[relocation.relocation_size] =
          (acc[relocation.relocation_size] || 0) + 1;
        return acc;
      }, {})
    ).map(([size, count]) => ({
      name: size,
      count,
    }));

    return (
      <div className="w-full lg:w-1/3 space-y-6">
        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-72">
            <h3 className="text-sm font-semibold mb-4 text-red-400 flex items-center">
              <FontAwesomeIcon icon={faRoad} className="mr-2" />
              Relocation Status Distribution
            </h3>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={relocationStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={{
                    position: "outside",
                    offset: 10,
                    fill: "#e5e7eb",
                  }}
                >
                  {relocationStatusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ color: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-72">
            <h3 className="text-sm font-semibold mb-4 text-red-400 flex items-center">
              <FontAwesomeIcon icon={faChartPie} className="mr-2" />
              Relocation Size Distribution
            </h3>
            <ResponsiveContainer>
              <LineChart data={relocationSizeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  padding={{ left: 20, right: 20 }}
                  tick={{ fontSize: 12, fill: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#e5e7eb" }}
                  padding={{ top: 20, bottom: 20 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#FF6B6B"
                  name="Relocation Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-72 mt-6">
            <h3 className="text-sm font-semibold mb-4 text-red-400 flex items-center">
              <FontAwesomeIcon icon={faChartPie} className="mr-2" />
              Popular Destination Districts
            </h3>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={Object.entries(
                    relocations.reduce((acc, relocation) => {
                      const district = relocation.destination_district;
                      if (district) {
                        acc[district] = (acc[district] || 0) + 1;
                      }
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={(entry) => entry.name}
                >
                  {Array(5)
                    .fill()
                    .map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>
      </div>
    );
  };

  useEffect(() => {
    // You might not need to fetch again, just re-render the filteredData table
    setCurrentPage(1); // reset to first page on filter
  }, [
    searchQuery,
    filterStatus,
    filterStartDate,
    filterEndDate,
    filterOriginDistrict,
    filterDestDistrict,
  ]);

  // ✅ Memoize filteredData to optimize performance and ensure proper re-rendering
  const filteredData = useMemo(() => {
    return relocations.filter((relocation) => {
      // 🔍 Text search filter
      const matchesSearch = [
        relocation.start_point,
        relocation.end_point,
        relocation.status,
        relocation.relocation_size,
        relocation.origin_district,
        relocation.destination_district,
        relocation.origin_sector,
        relocation.destination_sector,
        relocation.created_by?.phone_number,
        relocation.created_by?.email,
        relocation.vehicle?.plate_number,
        relocation.driver?.user?.phone_number,
      ].some(
        (field) =>
          field &&
          field.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );

      // 🟡 Status filter
      const matchesStatus =
        filterStatus === "all" || relocation.status === filterStatus;

      // 📅 Date range filter
      let matchesDate = true;
      if (filterStartDate) {
        const moveDate = new Date(relocation.move_datetime);
        const startFilterDate = new Date(filterStartDate);
        startFilterDate.setHours(0, 0, 0, 0);
        matchesDate = moveDate >= startFilterDate;
      }
      if (filterEndDate && matchesDate) {
        const moveDate = new Date(relocation.move_datetime);
        const endFilterDate = new Date(filterEndDate);
        endFilterDate.setHours(23, 59, 59, 999);
        matchesDate = moveDate <= endFilterDate;
      }

      // 📍 Origin and Destination district filters
      const matchesOriginDistrict =
        !filterOriginDistrict ||
        relocation.origin_district === filterOriginDistrict;

      const matchesDestDistrict =
        !filterDestDistrict ||
        relocation.destination_district === filterDestDistrict;

      // ✅ Final filter check
      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate &&
        matchesOriginDistrict &&
        matchesDestDistrict
      );
    });
  }, [
    relocations,
    searchQuery,
    filterStatus,
    filterStartDate,
    filterEndDate,
    filterOriginDistrict,
    filterDestDistrict,
  ]);

  // 🐛 Debug filtered results
  useEffect(() => {
    console.log("Filtered data updated:", filteredData);
  }, [filteredData]);

  const currentRelocations = filteredData.slice(
    (currentPage - 1) * relocationsPerPage,
    currentPage * relocationsPerPage
  );

  const handleAddUpdateRelocation = async (e) => {
    e.preventDefault();

    // Log the form data being submitted for debugging
    console.log("Submitting form with locations:", {
      origin_district: selectedOriginDistrict,
      origin_sector: selectedOriginSector,
      destination_district: selectedDestDistrict,
      destination_sector: selectedDestSector,
    });

    // Validate location selections
    if (
      !selectedOriginDistrict ||
      !selectedOriginSector ||
      !selectedDestDistrict ||
      !selectedDestSector
    ) {
      setMessage(
        "Please select both origin and destination locations completely"
      );
      setMessageType("error");
      return;
    }

    // Find coordinates for start and end sectors
    const startCoords = findSectorCoordinates(
      selectedOriginDistrict,
      selectedOriginSector
    );

    const endCoords = findSectorCoordinates(
      selectedDestDistrict,
      selectedDestSector
    );

    if (!startCoords || !endCoords) {
      setMessage("Invalid location selection. Please select valid locations.");
      setMessageType("error");
      return;
    }

    try {
      const relocationData = {
        start_point: selectedOriginSector,
        end_point: selectedDestSector,
        start_latitude: startCoords.latitude,
        start_longitude: startCoords.longitude,
        end_latitude: endCoords.latitude,
        end_longitude: endCoords.longitude,
        relocation_size: e.target.vehicle.value, // Vehicle ID
        driver_id: e.target.driver.value, // Driver ID
        move_datetime: e.target.move_datetime.value,
        status: e.target.status.value,
        is_paid: e.target.is_paid.value,

        // Explicitly set location fields
        origin_sector: selectedOriginSector,
        origin_district: selectedOriginDistrict,
        destination_sector: selectedDestSector,
        destination_district: selectedDestDistrict,

        // Add the cost fields
        base_cost: e.target.base_cost.value || 0,
        adjusted_cost: e.target.adjusted_cost.value || 0,
      };

      console.log("Sending relocation data:", relocationData);

      if (currentRelocation) {
        // Update existing relocation
        await axios.put(
          `${BASE_URL}update/${currentRelocation.id}/`,
          relocationData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setMessage("Relocation updated successfully");
      } else {
        // Create new relocation
        await axios.post(`${BASE_URL}create/`, relocationData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setMessage("Relocation created successfully");
      }

      handleFetch();
      setIsModalOpen(false);
      setCurrentRelocation(null);
      setMessageType("success");
    } catch (err) {
      console.error("Error submitting form:", err);
      setMessage(err.response?.data.error || "An error occurred");
      setMessageType("error");
    }
  };

  const renderModal = () => {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          isModalOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`fixed inset-0 bg-black opacity-50 ${
            isModalOpen ? "block" : "hidden"
          }`}
          onClick={() => setIsModalOpen(false)}
        ></div>
        <div className="bg-gray-900 rounded-lg shadow-xl p-6 z-50 w-full max-w-4xl border border-gray-800 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-red-500">
            {currentRelocation ? "Update Relocation" : "Add New Relocation"}
          </h2>
          <form onSubmit={handleAddUpdateRelocation}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin (Start) Location Section */}
              <div className="space-y-4">
                <h3 className="text-red-400 font-medium border-b border-gray-700 pb-2">
                  Origin Location
                </h3>

                {/* Origin District Dropdown */}
                <div>
                  <label className="block text-gray-300 mb-2">
                    Origin District
                  </label>
                  <select
                    value={selectedOriginDistrict}
                    onChange={(e) => {
                      setSelectedOriginDistrict(e.target.value);
                      setSelectedOriginSector(""); // Reset sector when district changes
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                  >
                    <option value="">Select District</option>
                    {allDistricts.map((district) => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Origin Sector Dropdown */}
                <div>
                  <label className="block text-gray-300 mb-2">
                    Origin Sector
                  </label>
                  <select
                    value={selectedOriginSector}
                    onChange={(e) => setSelectedOriginSector(e.target.value)}
                    disabled={!selectedOriginDistrict}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                  >
                    <option value="">Select Sector</option>
                    {getSectors(selectedOriginDistrict).map((sector) => (
                      <option key={sector.name} value={sector.name}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination Location Section */}
              <div className="space-y-4">
                <h3 className="text-red-400 font-medium border-b border-gray-700 pb-2">
                  Destination Location
                </h3>

                {/* Destination District Dropdown */}
                <div>
                  <label className="block text-gray-300 mb-2">
                    Destination District
                  </label>
                  <select
                    value={selectedDestDistrict}
                    onChange={(e) => {
                      setSelectedDestDistrict(e.target.value);
                      setSelectedDestSector("");
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                  >
                    <option value="">Select District</option>
                    {allDistricts.map((district) => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Sector Dropdown */}
                <div>
                  <label className="block text-gray-300 mb-2">
                    Destination Sector
                  </label>
                  <select
                    value={selectedDestSector}
                    onChange={(e) => setSelectedDestSector(e.target.value)}
                    disabled={!selectedDestDistrict}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                  >
                    <option value="">Select Sector</option>
                    {getSectors(selectedDestDistrict).map((sector) => (
                      <option key={sector.name} value={sector.name}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Dropdown - With onChange handler */}
              <div>
                <label className="block text-gray-300 mb-2">Vehicle</label>
                <div className="relative">
                  <select
                    name="vehicle"
                    value={currentRelocation?.vehicle?.id || ""}
                    onChange={(e) => {
                      if (currentRelocation) {
                        setCurrentRelocation({
                          ...currentRelocation,
                          vehicle: {
                            ...currentRelocation.vehicle,
                            id: e.target.value,
                          },
                        });
                      }
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 pr-10"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_type} - {vehicle.plate_number}
                      </option>
                    ))}
                  </select>
                  {currentRelocation?.vehicle?.id && vehicles.length > 0 && (
                    <div className="mt-2 bg-gray-800 p-2 rounded border border-gray-700 text-xs">
                      {(() => {
                        const selectedVehicle = vehicles.find(
                          (v) => v.id === Number(currentRelocation.vehicle.id)
                        );
                        if (selectedVehicle) {
                          return (
                            <>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">
                                  Plate Number:
                                </span>
                                <span className="text-white">
                                  {selectedVehicle.plate_number}
                                </span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">
                                  Weight Capacity:
                                </span>
                                <span className="text-white">
                                  {selectedVehicle.total_weight_to_carry} kg
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Category:</span>
                                <span className="text-white">
                                  {selectedVehicle.driving_category}
                                </span>
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Dropdown - With onChange handler */}
              <div>
                <label className="block text-gray-300 mb-2">Driver</label>
                <div className="relative">
                  <select
                    name="driver"
                    value={currentRelocation?.driver?.id || ""}
                    onChange={(e) => {
                      if (currentRelocation) {
                        setCurrentRelocation({
                          ...currentRelocation,
                          driver: {
                            ...currentRelocation.driver,
                            id: e.target.value,
                          },
                        });
                      }
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 pr-10"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.first_name} {driver.last_name} -{" "}
                        {driver.user?.phone_number ||
                          driver.driving_license_number}
                      </option>
                    ))}
                  </select>
                  {currentRelocation?.driver?.id && drivers.length > 0 && (
                    <div className="mt-2 bg-gray-800 p-2 rounded border border-gray-700 text-xs">
                      {(() => {
                        const selectedDriver = drivers.find(
                          (d) => d.id === Number(currentRelocation.driver.id)
                        );
                        if (selectedDriver) {
                          return (
                            <>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">Name:</span>
                                <span className="text-white">
                                  {selectedDriver.first_name}{" "}
                                  {selectedDriver.last_name}
                                </span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">Contact:</span>
                                <span className="text-white">
                                  {selectedDriver.user?.phone_number ||
                                    selectedDriver.driving_license_number}
                                </span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">
                                  Categories:
                                </span>
                                <span className="text-white">
                                  {selectedDriver.driving_categories}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">
                                  Availability:
                                </span>
                                <span
                                  className={
                                    selectedDriver.availability_status ===
                                    "available"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }
                                >
                                  {selectedDriver.availability_status}
                                </span>
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Dropdown - With onChange handler */}
              <div>
                <label className="block text-gray-300 mb-2">Status</label>
                <select
                  name="status"
                  value={currentRelocation?.status || "pending"}
                  onChange={(e) => {
                    if (currentRelocation) {
                      setCurrentRelocation({
                        ...currentRelocation,
                        status: e.target.value,
                      });
                    }
                  }}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              {/* Move Date with onChange handler */}
              <div>
                <label className="block text-gray-300 mb-2">Move Date</label>
                <input
                  type="datetime-local"
                  name="move_datetime"
                  value={
                    currentRelocation?.move_datetime
                      ? new Date(currentRelocation.move_datetime)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    if (currentRelocation) {
                      setCurrentRelocation({
                        ...currentRelocation,
                        move_datetime: e.target.value,
                      });
                    }
                  }}
                  required
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                />
              </div>

              {/* Cost Section */}
              <div className="space-y-4 col-span-2">
                <h3 className="text-red-400 font-medium border-b border-gray-700 pb-2">
                  Cost Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Base Cost Field */}
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Base Cost ($)
                    </label>
                    <input
                      type="number"
                      name="base_cost"
                      step="0.01"
                      min="0"
                      value={currentRelocation?.base_cost || ""}
                      onChange={(e) => {
                        if (currentRelocation) {
                          setCurrentRelocation({
                            ...currentRelocation,
                            base_cost: e.target.value,
                          });
                        }
                      }}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    />
                  </div>

                  {/* Adjusted Cost Field */}
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Adjusted Cost ($)
                    </label>
                    <input
                      type="number"
                      name="adjusted_cost"
                      step="0.01"
                      min="0"
                      value={currentRelocation?.adjusted_cost || ""}
                      onChange={(e) => {
                        if (currentRelocation) {
                          setCurrentRelocation({
                            ...currentRelocation,
                            adjusted_cost: e.target.value,
                          });
                        }
                      }}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Status Dropdown - Add this new section */}
              <div>
                <label className="block text-gray-300 mb-2">
                  Payment Status
                </label>
                <select
                  name="is_paid"
                  value={currentRelocation?.is_paid ? "true" : "false"}
                  onChange={(e) => {
                    if (currentRelocation) {
                      setCurrentRelocation({
                        ...currentRelocation,
                        is_paid: e.target.value === "true",
                      });
                    }
                  }}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                >
                  <option value="false">Not Paid</option>
                  <option value="true">Paid</option>
                </select>

                {/* Optional: Visual indicator */}
                <div className="mt-1 text-xs">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      currentRelocation?.is_paid
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {currentRelocation?.is_paid ? "✓ Paid" : "✗ Not Paid"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {currentRelocation ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleCreateRelocationNavigation = () => {
    navigate("/admin/createRelocation");
  };
  return (
    <ErrorBoundary>
      <div className="p-4 bg-gray-800 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 p-4 bg-gray-900 rounded-lg shadow-lg border border-gray-700">
            <h1 className="text-center text-red-500 font-bold text-xl mb-2">
              Manage Relocations
            </h1>
            <p className="text-center text-gray-400 text-sm">
              View, edit and manage relocation details from a central dashboard
            </p>
          </div>

          {message && (
            <div
              className={`text-center py-3 px-4 mb-6 rounded-lg shadow-md ${
                messageType === "success"
                  ? "bg-green-900 text-green-100"
                  : "bg-red-900 text-red-100"
              }`}
            >
              {message}
            </div>
          )}

          {renderSummaryCards()}
          {renderAdvancedFilters()}

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-2/3">
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div className="flex items-center">
                    <span className="text-red-400 flex items-center">
                      <FontAwesomeIcon icon={faRoad} className="mr-2" />
                      <span className="font-semibold">Total Relocations:</span>
                      <span className="ml-2 px-3 py-1 bg-red-600 text-white rounded-full">
                        {filteredData.length}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="text-gray-400"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Search relocations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full text-gray-300 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setDownloadMenuVisible(!downloadMenuVisible)
                        }
                        className="py-2 bg-red-600 px-4 rounded-lg text-white flex items-center justify-center hover:bg-red-700 transition duration-200 w-full sm:w-auto"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Export
                      </button>
                      {downloadMenuVisible && (
                        <div className="absolute right-0 mt-2 bg-gray-800 text-gray-200 shadow-lg rounded-lg p-2 z-10 border border-gray-700 w-32">
                          {Object.keys(handleDownload).map((format) => (
                            <button
                              key={format}
                              onClick={() => {
                                handleDownload[format]();
                                setDownloadMenuVisible(false);
                              }}
                              className="block w-full px-4 py-2 text-left hover:bg-gray-700 rounded transition"
                            >
                              {format}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleCreateRelocationNavigation}
                      className="py-2 bg-blue-600 px-4 rounded-lg text-white flex items-center justify-center hover:bg-blue-700 transition duration-200 w-full sm:w-auto"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add Relocation
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg shadow-md border border-gray-700">
                  <table
                    id="relocation-table"
                    className="w-full text-sm text-left"
                  >
                    <thead className="text-xs uppercase bg-red-600 text-white">
                      <tr>
                        <th className="px-6 py-3 rounded-tl-lg">#</th>
                        <th className="px-6 py-3">Owner</th>
                        <th className="px-6 py-3">Start Point</th>
                        <th className="px-6 py-3">End Point</th>
                        <th className="px-6 py-3">Size</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Move Date</th>
                        <th className="px-6 py-3">Cost</th>
                        <th className="px-6 py-3">Paid By</th>
                        <th className="px-6 py-3">Payment Status</th>
                        <th className="px-6 py-3 rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRelocations.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center py-8 text-gray-400 bg-gray-800"
                          >
                            <div className="flex flex-col items-center">
                              <FontAwesomeIcon
                                icon={faRoad}
                                className="text-4xl mb-3 text-gray-600"
                              />
                              <p>No relocations found matching your criteria</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentRelocations.map((relocation, index) => (
                          <tr
                            key={relocation.id}
                            className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700 transition duration-200"
                          >
                            <td className="px-6 py-4 text-gray-300">
                              {(currentPage - 1) * relocationsPerPage +
                                index +
                                1}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {relocation.created_by?.phone_number}
                              <p className="text-red-700">
                                {relocation.created_by?.email}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-gray-300">
                              {relocation.origin_sector}
                              <p className="text-red-700">
                                {relocation.origin_district}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {relocation.destination_sector}
                              <p className="text-red-700">
                                {relocation.destination_district}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-gray-300 capitalize">
                              {relocation.relocation_size}
                              <p className="text-red-700">Assigned car:</p>
                              <p>{relocation.vehicle.plate_number}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-300 capitalize">
                              {relocation.status}
                              <p className="text-red-700">Assigned driver:</p>
                              <p>
                                {relocation.driver?.user?.phone_number ||
                                  relocation.driver.driving_license_number}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {new Date(
                                relocation.move_datetime
                              ).toLocaleString()}
                            </td>

                            <td className="px-12 py-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-gray-500 text-sm font-medium">
                                    Adjusted Cost
                                  </span>
                                  <p className="text-lg font-semibold">
                                    $
                                    {Number(relocation.adjusted_cost).toFixed(
                                      2
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500 text-sm font-medium">
                                    Base Cost
                                  </span>
                                  <p className="text-lg font-semibold">
                                    ${Number(relocation.base_cost).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-2">
                              {relocation.phone_number || "N/A"}
                            </td>

                            <td className="px-4 py-2">
                              {relocation.is_paid ? "Paid" : "Unpaid"}
                            </td>

                            <td className="px-6 py-4">
  <div className="flex space-x-3">
    {relocation.status !== "completed" && (
      <button
        onClick={() => {
          setCurrentRelocation(relocation);
          setIsModalOpen(true);
        }}
        className="text-blue-400 hover:text-blue-300 transition"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>
    )}
    <button
      onClick={() => handleDelete(relocation.id)}
      className="text-red-400 hover:text-red-300 transition"
    >
      <FontAwesomeIcon icon={faTrash} />
    </button>
  </div>
</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="mt-6">{renderRecentActivity()}</div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-300">Rows per page:</span>
                    <select
                      value={relocationsPerPage}
                      onChange={(e) =>
                        setRelocationsPerPage(Number(e.target.value))
                      }
                      className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-800 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      {[5, 10, 30, 50, 100].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 bg-red-600 text-white rounded-lg">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={
                        currentPage * relocationsPerPage >= filteredData.length
                      }
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 hover:bg-gray-600 transition disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {renderCharts()}
          </div>
        </div>

        {renderModal()}
      </div>
    </ErrorBoundary>
  );
}

export default Admin_Manage_Relocations;

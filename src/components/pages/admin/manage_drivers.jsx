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
  faUser,
  faFilter,
  faPlus,
  faCheckCircle,
  faTimesCircle,
  faTimes,
  faUpload,
  faSpinner,
  faEye,
  faChevronLeft,
  faChevronRight,
  faFile,
  faFileExcel,
  faFileCsv,
  faIdCard,
  faIdBadge,
} from "@fortawesome/free-solid-svg-icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Logo from "../../../assets/pictures/logo.png";

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

function Admin_Manage_Drivers() {
  const [driversData, setDriversData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [driversPerPage, setDriversPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [downloadMenuVisible, setDownloadMenuVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const navigate = useNavigate();

  const BASE_URL = "http://127.0.0.1:8000/driver/";
  const token = localStorage.getItem("token");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFetch = async () => {
    try {
      const res = await axios.get(`${BASE_URL}drivers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriversData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  const [filters, setFilters] = useState({
    status: "",
    availability: "",
    drivingCategories: [],
    gender: "",
    ageRange: { min: "", max: "" },
    experience: { min: "", max: "" },
    sortBy: "",
    sortOrder: "asc",
  });

  // Add summary data calculation
  const summaryData = React.useMemo(() => {
    if (!driversData.length) return [];

    const totalDrivers = driversData.length;
    const approvedDrivers = driversData.filter(
      (driver) => driver.status === "approved"
    ).length;

    const activeDrivers = driversData.filter(
      (driver) => driver.availability_status === "active"
    ).length;

    return [
      {
        title: "Total Drivers",
        value: totalDrivers,
        icon: faUser,
        color: "bg-blue-500",
      },
      {
        title: "Approved Drivers",
        value: approvedDrivers,
        icon: faCheckCircle,
        color: "bg-green-500",
      },

      {
        title: "Active Drivers",
        value: activeDrivers,
        icon: faUser,
        color: "bg-purple-500",
      },
    ];
  }, [driversData]);

  const filteredData = driversData.filter((driver) => {
    const nameMatch = [driver.first_name, driver.last_name]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const statusMatch = !filters.status || driver.status === filters.status;
    const availabilityMatch =
      !filters.availability ||
      driver.availability_status === filters.availability;
    const genderMatch = !filters.gender || driver.gender === filters.gender;
    const categoriesMatch =
      filters.drivingCategories.length === 0 ||
      filters.drivingCategories.some((category) =>
        driver.driving_categories.includes(category)
      );

    return (
      nameMatch &&
      statusMatch &&
      availabilityMatch &&
      genderMatch &&
      categoriesMatch
    );
  });

  const currentDrivers = filteredData.slice(
    (currentPage - 1) * driversPerPage,
    currentPage * driversPerPage
  );

  // Enhanced Render Summary Cards
  const renderSummaryCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {summaryData.map((card, index) => (
        <div
          key={index}
          className={`${card.color} text-white rounded-lg p-4 shadow-md border border-gray-800 flex items-center hover:scale-105 transition duration-300`}
        >
          <div className="mr-4">
            <FontAwesomeIcon icon={card.icon} className="text-3xl" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-75">{card.title}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );


  const handleViewDocument = (documentType) => {
    if (!selectedDriver) return;
    
    let documentUrl = '';
    if (documentType === 'national_id_card' && selectedDriver.national_id_card) {
      documentUrl = selectedDriver.national_id_card;
    } else if (documentType === 'driving_license' && selectedDriver.driving_license) {
      documentUrl = selectedDriver.driving_license;
    }
    
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const renderDriverDetailsModal = () =>
    selectedDriver && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-800">Driver Details</h2>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-red-800">Full Name</p>
              <p className="font-medium text-gray-800">
                {selectedDriver.first_name} {selectedDriver.last_name}
              </p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Gender</p>
              <p className="capitalize text-gray-800">{selectedDriver.gender}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Phone Number</p>
              <p className="text-gray-800">{selectedDriver.phone_number}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Email</p>
              <p className="text-gray-800">{selectedDriver.email}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Driving Categories</p>
              <p className="text-gray-800 capitalize">{selectedDriver.driving_categories.join(", ")}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Status</p>
              <p className="uppercase text-gray-800">{selectedDriver.status}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Resident</p>
              <p className="uppercase text-gray-800">{selectedDriver.residence}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Availability Status</p>
              <p className="uppercase text-gray-800">{selectedDriver.availability_status}</p>
            </div>
          </div>
          
          {/* Document Viewer Buttons */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-red-800 mb-3">Driver Documents</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleViewDocument('national_id_card')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                disabled={!selectedDriver.national_id_card}
              >
                <FontAwesomeIcon icon={faIdCard} className="mr-2" />
                View National ID
              </button>
              <button
                onClick={() => handleViewDocument('driving_license')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                disabled={!selectedDriver.driving_license}
              >
                <FontAwesomeIcon icon={faIdBadge} className="mr-2" />
                View License
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const renderDriversTable = () => (
    <div className="bg-gray-900 shadow-md rounded-lg overflow-x-auto border border-gray-800">
      <table className="w-full" id="driver-table">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-3 text-left text-gray-300">Name</th>
            <th className="p-3 text-left text-gray-300">Phone</th>
            <th className="p-3 text-left text-gray-300">Driving Categories</th>
            <th className="p-3 text-left text-gray-300">Status</th>
            <th className="p-3 text-left text-gray-300">Availability</th>
            <th className="p-3 text-left text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentDrivers.map((driver) => (
            <tr
              key={driver.id}
              className="border-b border-gray-700 hover:bg-gray-800 transition duration-200"
            >
              <td className="p-3 text-gray-300">
                {driver.first_name} {driver.last_name}
              </td>
              <td className="p-3 text-gray-300">{driver.phone_number}</td>
              <td className="p-3 text-gray-300">
                {driver.driving_categories.join(", ")}
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    driver.status === "approved"
                      ? "bg-green-900 text-green-400"
                      : "bg-red-900 text-red-400"
                  }`}
                >
                  {driver.status.toUpperCase()}
                </span>
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    driver.availability_status === "active"
                      ? "bg-green-900 text-green-400"
                      : "bg-red-900 text-red-400"
                  }`}
                >
                  {driver.availability_status.toUpperCase()}
                </span>
              </td>
              <td className="p-3 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedDriver(driver);
                    setIsViewModalOpen(true);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button
                  onClick={() => handleEditDriver(driver)}
                  className="text-green-500 hover:text-green-700"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-gray-900 text-gray-300 border border-gray-700 rounded px-2 py-1"
          >
            {[5, 10, 15, 20, 25].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="text-gray-300 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="text-gray-300 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCharts = () => {
    const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FDCB6E", "#6C5CE7"];

    const statusData = Object.entries(
      driversData.reduce((acc, driver) => {
        acc[driver.status] = (acc[driver.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    const drivingCategoriesData = Object.entries(
      driversData.reduce((acc, driver) => {
        driver.driving_categories.forEach((category) => {
          acc[category] = (acc[category] || 0) + 1;
        });
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            Driver Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {statusData.map((entry, index) => (
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
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ color: "#f9fafb" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            Driving Categories Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={drivingCategoriesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {drivingCategoriesData.map((entry, index) => (
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
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ color: "#f9fafb" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDriverCard = (driver) => (
    <div
      key={driver.id}
      className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:border-red-500 transition duration-300"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={
              driver.availability_status === "active"
                ? faCheckCircle
                : faTimesCircle
            }
            className={`mr-2 ${
              driver.availability_status === "active"
                ? "text-green-500"
                : "text-red-500"
            }`}
          />
          <span
            className={`font-semibold ${
              driver.availability_status === "active"
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {driver.availability_status.toUpperCase()}
          </span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            driver.status === "approved"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {driver.status.toUpperCase()}
        </span>
      </div>
      <div className="text-center mb-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-4xl mb-3">
          {driver.first_name[0]}
          {driver.last_name[0]}
        </div>
        <h3 className="text-xl font-bold text-white">
          {driver.first_name} {driver.last_name}
        </h3>
        <p className="text-gray-400">{driver.user.phone_number}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-700 p-2 rounded text-center">
          <span className="block text-gray-400">Driving Categories</span>
          <span className="font-semibold text-white">
            {driver.driving_categories.join(", ")}
          </span>
        </div>
        <div className="bg-gray-700 p-2 rounded text-center">
          <span className="block text-gray-400">Gender</span>
          <span className="font-semibold text-white capitalize">
            {driver.gender}
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            setCurrentDriver(driver);
            setIsModalOpen(true);
          }}
          className="w-1/2 mr-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FontAwesomeIcon icon={faEdit} className="mr-2" />
          Edit
        </button>
        <button
          onClick={() => handleDelete(driver.id)}
          className="w-1/2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <FontAwesomeIcon icon={faTrash} className="mr-2" />
          Delete
        </button>
      </div>
    </div>
  );

  // Comprehensive Filter Modal
  const renderFilterModal = () => (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFilterModalOpen ? "visible" : "invisible"
      }`}
    >
      <div
        className={`fixed inset-0 bg-black opacity-50 ${
          isFilterModalOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsFilterModalOpen(false)}
      ></div>
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 z-50 w-[500px] border border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-red-500">
          Advanced Filters
        </h2>
        <div className="space-y-4">
          {/* Existing Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
              >
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Availability</label>
              <select
                value={filters.availability}
                onChange={(e) =>
                  setFilters({ ...filters, availability: e.target.value })
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
              >
                <option value="">All Availabilities</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Driving Categories */}
          <div>
            <label className="block text-gray-300 mb-2">
              Driving Categories
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["A", "B", "B1", "C", "D", "D1", "E", "F"].map((category) => (
                <label key={category} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={category}
                    checked={filters.drivingCategories.includes(category)}
                    onChange={(e) => {
                      const updatedCategories = e.target.checked
                        ? [...filters.drivingCategories, category]
                        : filters.drivingCategories.filter(
                            (c) => c !== category
                          );
                      setFilters({
                        ...filters,
                        drivingCategories: updatedCategories,
                      });
                    }}
                    className="form-checkbox h-4 w-4 text-red-600 bg-gray-800 border-gray-700 rounded"
                  />
                  <span className="ml-2 text-gray-300">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) =>
                  setFilters({ ...filters, gender: e.target.value })
                }
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              
            </div>
          </div>

        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={() => {
              // Reset all filters
              setFilters({
                status: "",
                availability: "",
                drivingCategories: [],
                gender: "",
                ageRange: { min: "", max: "" },
                experience: { min: "", max: "" },
                sortBy: "",
                sortOrder: "asc",
              });
              setIsFilterModalOpen(false);
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={() => setIsFilterModalOpen(false)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  // Pre-fill Form on Edit
  const handleEditDriver = (driver) => {
    setCurrentDriver(driver);
    setIsModalOpen(true);

    // Timeout to ensure modal is open before populating
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.elements.first_name.value = driver.first_name;
        form.elements.last_name.value = driver.last_name;
        form.elements.gender.value = driver.gender;
        form.elements.phone_number.value = driver.phone_number;
        form.elements.email.value = driver.email;
        form.elements.national_id_number.value = driver.national_id_number;
        form.elements.driving_license_number.value =
        driver.driving_license_number;
        form.elements.residence.value = driver.residence;
        form.elements.status.value = driver.status;
        form.elements.availability_status.value = driver.availability_status;

        // Reset and check driving categories
        form.elements.drivingCategories.forEach((checkbox) => {
          checkbox.checked = driver.driving_categories.includes(checkbox.value);
        });
      }
    }, 100);
  };

  // Comprehensive Filtering and Sorting Logic
  const filteredAndSortedDrivers = useMemo(() => {
    let result = driversData.filter((driver) => {
      const nameMatch = [driver.first_name, driver.last_name]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const statusMatch = !filters.status || driver.status === filters.status;
      const availabilityMatch =
        !filters.availability ||
        driver.availability_status === filters.availability;
      const genderMatch = !filters.gender || driver.gender === filters.gender;

      const categoriesMatch =
        filters.drivingCategories.length === 0 ||
        filters.drivingCategories.some((category) =>
          driver.driving_categories.includes(category)
        );

      // Age and Experience Filters (assuming you have these fields)
      const ageMatch =
        (!filters.ageRange.min || driver.age >= filters.ageRange.min) &&
        (!filters.ageRange.max || driver.age <= filters.ageRange.max);

      const experienceMatch =
        (!filters.experience.min ||
          driver.years_of_experience >= filters.experience.min) &&
        (!filters.experience.max ||
          driver.years_of_experience <= filters.experience.max);

      return (
        nameMatch &&
        statusMatch &&
        availabilityMatch &&
        genderMatch &&
        categoriesMatch &&
        ageMatch &&
        experienceMatch
      );
    });

    // Sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        const sortValue = filters.sortBy;
        const sortMultiplier = filters.sortOrder === "asc" ? 1 : -1;

        if (sortValue === "name") {
          return (
            sortMultiplier *
            (a.first_name + a.last_name).localeCompare(
              b.first_name + b.last_name
            )
          );
        }
        if (sortValue === "status") {
          return sortMultiplier * a.status.localeCompare(b.status);
        }
        // Add more sorting conditions as needed
        return 0;
      });
    }

    return result;
  }, [driversData, searchQuery, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Do you want to delete this driver?")) return;
    try {
      await axios.delete(`${BASE_URL}delete/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await handleFetch();
      setMessage("Driver deleted successfully");
      setMessageType("success");
      setCurrentPage(1);
    } catch (err) {
      setMessage(err.response?.data.message || "An error occurred");
      setMessageType("error");
    }
  };

// Replace the existing handleDownload object with this enhanced version

// Helper function to convert image to base64
const getImageBase64 = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = reject;
    img.src = src;
  });
};

const handleDownload = {
  PDF: async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Add Logo
    try {
      const logoBase64 = await getImageBase64(Logo);
      doc.addImage(logoBase64, 'PNG', 15, 10, 25, 20);
    } catch (error) {
      console.log('Logo conversion failed, using placeholder');
      // Fallback placeholder
      doc.setFillColor(220, 38, 38);
      doc.rect(15, 10, 25, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('RMS', 27.5, 22, { align: 'center' });
    }

    // Header - Company Info (positioned next to logo)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RELOCATION MANAGEMENT SYSTEM', 45, 18);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Driver Management Report', 45, 26);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 45, 32);

    // Report Title (centered)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('DRIVER MANAGEMENT REPORT', pageWidth / 2, 45, { align: 'center' });

    // Summary Section
    const summaryY = 55;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Executive Summary', 15, summaryY);

    // Summary data calculations
    const totalDrivers = filteredAndSortedDrivers.length;
    const approvedDrivers = filteredAndSortedDrivers.filter(driver => driver.status === 'approved').length;
    const rejectedDrivers = filteredAndSortedDrivers.filter(driver => driver.status === 'rejected').length;
    const activeDrivers = filteredAndSortedDrivers.filter(driver => driver.availability_status === 'active').length;
    const inactiveDrivers = filteredAndSortedDrivers.filter(driver => driver.availability_status === 'inactive').length;

    // Calculate driving categories distribution
    const categoriesCount = {};
    filteredAndSortedDrivers.forEach(driver => {
      driver.driving_categories.forEach(category => {
        categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      });
    });

    // Summary statistics
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const summaryData = [
      ['Total Drivers', totalDrivers.toString()],
      ['Approved Drivers', `${approvedDrivers} (${((approvedDrivers / totalDrivers) * 100).toFixed(1)}%)`],
      ['Rejected Drivers', `${rejectedDrivers} (${((rejectedDrivers / totalDrivers) * 100).toFixed(1)}%)`],
      ['Active Drivers', `${activeDrivers} (${((activeDrivers / totalDrivers) * 100).toFixed(1)}%)`],
      ['Inactive Drivers', `${inactiveDrivers} (${((inactiveDrivers / totalDrivers) * 100).toFixed(1)}%)`]
    ];

    // Create summary table
    doc.autoTable({
      head: [['Metric', 'Value']],
      body: summaryData,
      startY: summaryY + 10,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    // Key Insights
    let currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Key Insights', 15, currentY);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    currentY += 10;

    const insights = [
      `• Driver approval rate: ${((approvedDrivers / totalDrivers) * 100).toFixed(1)}%`,
      `• Driver activity rate: ${((activeDrivers / totalDrivers) * 100).toFixed(1)}%`,
      `• Most common driving category: ${Object.keys(categoriesCount).reduce((a, b) => categoriesCount[a] > categoriesCount[b] ? a : b, 'N/A')}`,
      `• Total driving categories covered: ${Object.keys(categoriesCount).length}`
    ];

    insights.forEach(insight => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(insight, 20, currentY);
      currentY += 6;
    });

    // Add some space before the table
    currentY += 10;
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    // Driver Details Table
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Driver Details', 15, currentY);

    // Prepare table data
    const tableColumns = [
      { header: 'Name', dataKey: 'name' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Categories', dataKey: 'categories' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Availability', dataKey: 'availability' },
      { header: 'Residence', dataKey: 'residence' }
    ];

    const tableData = filteredAndSortedDrivers.map(driver => ({
      name: `${driver.first_name} ${driver.last_name}`,
      phone: driver.phone_number,
      categories: driver.driving_categories.join(', '),
      status: driver.status.toUpperCase(),
      availability: driver.availability_status.toUpperCase(),
      residence: driver.residence
    }));

    doc.autoTable({
      columns: tableColumns,
      body: tableData,
      startY: currentY + 5,
      theme: 'striped',
      headStyles: { 
        fillColor: [220, 38, 38], 
        textColor: 255, 
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 35 }
      },
      margin: { left: 15, right: 15 },
      showHead: 'everyPage'
    });

    // Footer on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Relocation Management System - Driver Report - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `drivers_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  },

  Excel: () => {
    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['RELOCATION MANAGEMENT SYSTEM'],
      ['Driver Management Report'],
      [`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`],
      [''],
      ['EXECUTIVE SUMMARY'],
      [''],
      ['Metric', 'Value', 'Percentage'],
      ['Total Drivers', filteredAndSortedDrivers.length, '100%'],
      ['Approved Drivers', filteredAndSortedDrivers.filter(d => d.status === 'approved').length, `${((filteredAndSortedDrivers.filter(d => d.status === 'approved').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`],
      ['Rejected Drivers', filteredAndSortedDrivers.filter(d => d.status === 'rejected').length, `${((filteredAndSortedDrivers.filter(d => d.status === 'rejected').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`],
      ['Active Drivers', filteredAndSortedDrivers.filter(d => d.availability_status === 'active').length, `${((filteredAndSortedDrivers.filter(d => d.availability_status === 'active').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`],
      ['Inactive Drivers', filteredAndSortedDrivers.filter(d => d.availability_status === 'inactive').length, `${((filteredAndSortedDrivers.filter(d => d.availability_status === 'inactive').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the summary sheet
    summarySheet['!merges'] = [
      { s: { c: 0, r: 0 }, e: { c: 2, r: 0 } },
      { s: { c: 0, r: 1 }, e: { c: 2, r: 1 } },
      { s: { c: 0, r: 2 }, e: { c: 2, r: 2 } },
      { s: { c: 0, r: 4 }, e: { c: 2, r: 4 } }
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Driver Details Sheet
    const driverDetailsData = filteredAndSortedDrivers.map(driver => ({
      'First Name': driver.first_name,
      'Last Name': driver.last_name,
      'Phone Number': driver.phone_number,
      'Email': driver.email,
      'Gender': driver.gender,
      'Driving Categories': driver.driving_categories.join(', '),
      'National ID': driver.national_id_number,
      'License Number': driver.driving_license_number,
      'Residence': driver.residence,
      'Status': driver.status.toUpperCase(),
      'Availability': driver.availability_status.toUpperCase()
    }));

    const driverSheet = XLSX.utils.json_to_sheet(driverDetailsData);
    XLSX.utils.book_append_sheet(workbook, driverSheet, 'Driver Details');

    // Categories Analysis Sheet
    const categoriesCount = {};
    filteredAndSortedDrivers.forEach(driver => {
      driver.driving_categories.forEach(category => {
        categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      });
    });

    const categoriesData = Object.entries(categoriesCount).map(([category, count]) => ({
      'Driving Category': category,
      'Number of Drivers': count,
      'Percentage': `${((count / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`
    }));

    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories Analysis');

    // Save the Excel file
    const fileName = `drivers_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  },

  CSV: () => {
    // Create comprehensive CSV with summary
    const csvRows = [];
    
    // Header information
    csvRows.push(['RELOCATION MANAGEMENT SYSTEM - Driver Management Report']);
    csvRows.push([`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`]);
    csvRows.push(['']);
    
    // Summary section
    csvRows.push(['EXECUTIVE SUMMARY']);
    csvRows.push(['Metric', 'Value', 'Percentage']);
    csvRows.push(['Total Drivers', filteredAndSortedDrivers.length, '100%']);
    csvRows.push(['Approved Drivers', filteredAndSortedDrivers.filter(d => d.status === 'approved').length, `${((filteredAndSortedDrivers.filter(d => d.status === 'approved').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`]);
    csvRows.push(['Rejected Drivers', filteredAndSortedDrivers.filter(d => d.status === 'rejected').length, `${((filteredAndSortedDrivers.filter(d => d.status === 'rejected').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`]);
    csvRows.push(['Active Drivers', filteredAndSortedDrivers.filter(d => d.availability_status === 'active').length, `${((filteredAndSortedDrivers.filter(d => d.availability_status === 'active').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`]);
    csvRows.push(['Inactive Drivers', filteredAndSortedDrivers.filter(d => d.availability_status === 'inactive').length, `${((filteredAndSortedDrivers.filter(d => d.availability_status === 'inactive').length / filteredAndSortedDrivers.length) * 100).toFixed(1)}%`]);
    csvRows.push(['']);
    
    // Driver details header
    csvRows.push(['DRIVER DETAILS']);
    csvRows.push(['First Name', 'Last Name', 'Phone Number', 'Email', 'Gender', 'Driving Categories', 'National ID', 'License Number', 'Residence', 'Status', 'Availability']);
    
    // Driver data
    filteredAndSortedDrivers.forEach(driver => {
      csvRows.push([
        driver.first_name,
        driver.last_name,
        driver.phone_number,
        driver.email,
        driver.gender,
        driver.driving_categories.join('; '),
        driver.national_id_number,
        driver.driving_license_number,
        driver.residence,
        driver.status.toUpperCase(),
        driver.availability_status.toUpperCase()
      ]);
    });

    // Convert to CSV format
    const csvContent = csvRows.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `drivers_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
        const formData = new FormData();
        const form = e.target;
        
        const fields = [
            "first_name", "last_name", "gender", "phone_number", "email", 
            "national_id_number", "driving_license_number", "residence", "status", "availability_status"
        ];

        // Directly use the form's current values
        fields.forEach((field) => {
            formData.append(field, form.elements[field].value);
        });

        const selectedCategories = Array.from(form.elements.drivingCategories)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);
        formData.append("driving_categories", selectedCategories);

        const nationalIdFile = form.elements.nationalIdUpload.files[0];
        const drivingLicenseFile = form.elements.drivingLicenseUpload.files[0];

        if (nationalIdFile) {
            formData.append("national_id_card", nationalIdFile);
        }
        if (drivingLicenseFile) {
            formData.append("driving_license", drivingLicenseFile);
        }

        const token = localStorage.getItem("token");
        const url = currentDriver 
            ? `${BASE_URL}update/${currentDriver.id}/` 
            : `${BASE_URL}create/`;

        const response = await axios({
            method: currentDriver ? "put" : "post",
            url,
            data: formData,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });

        setMessage(currentDriver ? "Driver updated successfully" : "Driver added successfully");
        setMessageType("success");

        await handleFetch();
        setIsModalOpen(false);
    } catch (err) {
        console.error("Error submitting driver:", err);
        setMessage(err.response?.data.message || "An error occurred");
        setMessageType("error");
    } finally {
        setIsSubmitting(false);
    }
};


const renderDownloadDropdown = () => (
  <div className="relative">
    <button
      onClick={() => setDownloadMenuVisible(!downloadMenuVisible)}
      className="bg-gray-800 text-gray-300 px-4 py-2 rounded flex items-center hover:bg-gray-700 transition"
      disabled={isDownloading}
    >
      {isDownloading ? (
        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
      ) : (
        <FontAwesomeIcon icon={faDownload} className="mr-2" />
      )}
      {isDownloading ? 'Generating...' : 'Download'}
    </button>
    {downloadMenuVisible && !isDownloading && (
      <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
        <button
          onClick={async () => {
            setIsDownloading(true);
            setDownloadMenuVisible(false);
            try {
              await handleDownload.PDF();
              setMessage('PDF downloaded successfully');
              setMessageType('success');
            } catch (error) {
              setMessage('Error generating PDF');
              setMessageType('error');
            }
            setIsDownloading(false);
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 flex items-center"
        >
          <FontAwesomeIcon icon={faFile} className="mr-2" /> PDF Report
        </button>
        <button
          onClick={() => {
            handleDownload.Excel();
            setDownloadMenuVisible(false);
            setMessage('Excel file downloaded successfully');
            setMessageType('success');
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 flex items-center"
        >
          <FontAwesomeIcon icon={faFileExcel} className="mr-2" /> Excel Workbook
        </button>
        <button
          onClick={() => {
            handleDownload.CSV();
            setDownloadMenuVisible(false);
            setMessage('CSV file downloaded successfully');
            setMessageType('success');
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 flex items-center"
        >
          <FontAwesomeIcon icon={faFileCsv} className="mr-2" /> CSV Data
        </button>
      </div>
    )}
  </div>
);
  return (
    <div className="container mx-auto p-4 bg-gray-950 min-h-screen text-gray-300">
      {renderSummaryCards()}

      <div className="bg-gray-900 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-500">
            Drivers Management
          </h2>
          <div className="flex space-x-4">
            {renderDownloadDropdown()}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              Filters
            </button>
            <button
              onClick={() => {
                setCurrentDriver(null);
                setIsModalOpen(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Add Driver
            </button>
          </div>
        </div>

        {renderDriversTable()}
      </div>

      {renderCharts()}
      {renderFilterModal()} 

      {/* Modals */}
      {isViewModalOpen && renderDriverDetailsModal()}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4 py-8">
          <div className="bg-gray-900 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-gray-800 relative">
            <div className="sticky top-0 bg-gray-900 z-10 flex justify-between items-center mb-6 pb-2 border-b border-gray-800">
              <h2 className="text-xl font-bold text-red-500">
                {currentDriver ? "Update Driver" : "Add New Driver"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Form Fields */}
            <form
              className="grid md:grid-cols-2 gap-6"
              onSubmit={handleDriverSubmit}
            >
              {/* First Column */}
              <div className="space-y-4">
                {/* First Name */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    placeholder="Enter last name"
                  />
                </div>

                {/* Gender */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Gender</label>
                  <select
                    name="gender"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    maxLength={10}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {/* Second Column */}
              <div className="space-y-4">
                {/* National ID Number */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    National ID Number
                  </label>
                  <input
                    type="text"
                    name="national_id_number"
                    maxLength={16}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    placeholder="Enter national ID number"
                  />
                </div>

                {/* Driving License Number */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Driving License Number
                  </label>
                  <input
                    type="text"
                    name="driving_license_number"
                    maxLength={16}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    placeholder="Enter driving license number"
                  />
                </div>

                {/* Driving Categories */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Driving Categories
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["A", "B", "B1", "C", "D", "D1", "E", "F"].map(
                      (category) => (
                        <label
                          key={category}
                          className="inline-flex items-center"
                        >
                          <input
                            type="checkbox"
                            name="drivingCategories" // Add this
                            value={category}
                            className="form-checkbox h-4 w-4 text-red-600 bg-gray-800 border-gray-700 rounded"
                          />
                          <span className="ml-2 text-gray-300">{category}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Residence */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Residence</label>
                  <input
                    type="text"
                    name="residence"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    placeholder="Enter residence"
                  />
                </div>

                {/* Status */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Status</label>
                  <select
                    name="status"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                  >
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>


                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Availability Status</label>
                  <select
                    name="availability_status"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">In Active</option>
            
                  </select>
                </div>
              </div>

              {/* File Uploads (Span Both Columns) */}
              <div className="md:col-span-2 space-y-4">
                {/* National ID Card Upload */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    National ID Card
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      name="nationalIdUpload"
                      className="hidden"
                      id="national-id-upload"
                    />
                    <label
                      htmlFor="national-id-upload"
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 flex items-center cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faUpload} className="mr-2" />
                      Upload National ID
                    </label>
                  </div>
                </div>

                {/* Driving License Upload */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Driving License
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      name="drivingLicenseUpload"
                      className="hidden"
                      id="driving-license-upload"
                    />
                    <label
                      htmlFor="driving-license-upload"
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300 flex items-center cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faUpload} className="mr-2" />
                      Upload Driving License
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 text-white rounded ${
                      isSubmitting
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className="mr-2"
                        />
                        {currentDriver ? "Updating..." : "Adding..."}
                      </>
                    ) : currentDriver ? (
                      "Update"
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Admin_Manage_Drivers;

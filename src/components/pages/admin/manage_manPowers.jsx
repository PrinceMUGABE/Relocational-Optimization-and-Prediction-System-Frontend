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

function Admin_Manage_Man_Powers() {
  const [man_powersData, setman_powersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [man_powersPerPage, setman_powersPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [downloadMenuVisible, setDownloadMenuVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentman_power, setCurrentman_power] = useState(null);
  const [selectedman_power, setSelectedman_power] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const navigate = useNavigate();

  const BASE_URL = "http://127.0.0.1:8000/man_power/";
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
      const res = await axios.get(`${BASE_URL}man_powers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setman_powersData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching man_powers:", err);
    }
  };

  const [filters, setFilters] = useState({
    status: "",
    availability: "",
    gender: "",
    ageRange: { min: "", max: "" },
    experience: { min: "", max: "" },
    sortBy: "",
    sortOrder: "asc",
  });

  // Add summary data calculation
  const summaryData = React.useMemo(() => {
    if (!man_powersData.length) return [];

    const totalman_powers = man_powersData.length;
    const approvedman_powers = man_powersData.filter(
      (man_power) => man_power.status === "approved"
    ).length;

    const activeman_powers = man_powersData.filter(
      (man_power) => man_power.availability_status === "active"
    ).length;

    return [
      {
        title: "Total man_powers",
        value: totalman_powers,
        icon: faUser,
        color: "bg-blue-500",
      },
      {
        title: "Approved man_powers",
        value: approvedman_powers,
        icon: faCheckCircle,
        color: "bg-green-500",
      },

      {
        title: "Active man_powers",
        value: activeman_powers,
        icon: faUser,
        color: "bg-purple-500",
      },
    ];
  }, [man_powersData]);

  const filteredData = man_powersData.filter((man_power) => {
    const nameMatch = [man_power.first_name, man_power.last_name]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const statusMatch = !filters.status || man_power.status === filters.status;
    const availabilityMatch =
      !filters.availability ||
      man_power.availability_status === filters.availability;
    const genderMatch = !filters.gender || man_power.gender === filters.gender;


    return (
      nameMatch &&
      statusMatch &&
      availabilityMatch &&
      genderMatch
    );
  });

  const currentman_powers = filteredData.slice(
    (currentPage - 1) * man_powersPerPage,
    currentPage * man_powersPerPage
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
    if (!selectedman_power) return;
    
    let documentUrl = '';
    if (documentType === 'national_id_card' && selectedman_power.national_id_card) {
      documentUrl = selectedman_power.national_id_card;
    }
    
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const renderman_powerDetailsModal = () =>
    selectedman_power && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg w-full max-w-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-800">man_power Details</h2>
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
                {selectedman_power.first_name} {selectedman_power.last_name}
              </p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Gender</p>
              <p className="capitalize text-gray-800">{selectedman_power.gender}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Phone Number</p>
              <p className="text-gray-800">{selectedman_power.phone_number}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Email</p>
              <p className="text-gray-800">{selectedman_power.email}</p>
            </div>

            <div>
              <p className="font-semibold text-red-800">Status</p>
              <p className="uppercase text-gray-800">{selectedman_power.status}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Resident</p>
              <p className="uppercase text-gray-800">{selectedman_power.residence}</p>
            </div>
            <div>
              <p className="font-semibold text-red-800">Availability Status</p>
              <p className="uppercase text-gray-800">{selectedman_power.availability_status}</p>
            </div>
          </div>
          
          {/* Document Viewer Buttons */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-red-800 mb-3">man_power Documents</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleViewDocument('national_id_card')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                disabled={!selectedman_power.national_id_card}
              >
                <FontAwesomeIcon icon={faIdCard} className="mr-2" />
                View National ID
              </button>

            </div>
          </div>
        </div>
      </div>
    );

  const renderman_powersTable = () => (
    <div className="bg-gray-900 shadow-md rounded-lg overflow-x-auto border border-gray-800">
      <table className="w-full" id="man_power-table">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-3 text-left text-gray-300">Name</th>
            <th className="p-3 text-left text-gray-300">Phone</th>
            <th className="p-3 text-left text-gray-300">Status</th>
            <th className="p-3 text-left text-gray-300">Availability</th>
            <th className="p-3 text-left text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentman_powers.map((man_power) => (
            <tr
              key={man_power.id}
              className="border-b border-gray-700 hover:bg-gray-800 transition duration-200"
            >
              <td className="p-3 text-gray-300">
                {man_power.first_name} {man_power.last_name}
              </td>
              <td className="p-3 text-gray-300">{man_power.phone_number}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    man_power.status === "approved"
                      ? "bg-green-900 text-green-400"
                      : "bg-red-900 text-red-400"
                  }`}
                >
                  {man_power.status.toUpperCase()}
                </span>
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    man_power.availability_status === "active"
                      ? "bg-green-900 text-green-400"
                      : "bg-red-900 text-red-400"
                  }`}
                >
                  {man_power.availability_status.toUpperCase()}
                </span>
              </td>
              <td className="p-3 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedman_power(man_power);
                    setIsViewModalOpen(true);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button
                  onClick={() => handleEditman_power(man_power)}
                  className="text-green-500 hover:text-green-700"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleDelete(man_power.id)}
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
      man_powersData.reduce((acc, man_power) => {
        acc[man_power.status] = (acc[man_power.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));


    return (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            man_power Status Distribution
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

      </div>
    );
  };

  const renderman_powerCard = (man_power) => (
    <div
      key={man_power.id}
      className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:border-red-500 transition duration-300"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={
              man_power.availability_status === "active"
                ? faCheckCircle
                : faTimesCircle
            }
            className={`mr-2 ${
              man_power.availability_status === "active"
                ? "text-green-500"
                : "text-red-500"
            }`}
          />
          <span
            className={`font-semibold ${
              man_power.availability_status === "active"
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {man_power.availability_status.toUpperCase()}
          </span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            man_power.status === "approved"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {man_power.status.toUpperCase()}
        </span>
      </div>
      <div className="text-center mb-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-4xl mb-3">
          {man_power.first_name[0]}
          {man_power.last_name[0]}
        </div>
        <h3 className="text-xl font-bold text-white">
          {man_power.first_name} {man_power.last_name}
        </h3>
        <p className="text-gray-400">{man_power.user.phone_number}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">

        <div className="bg-gray-700 p-2 rounded text-center">
          <span className="block text-gray-400">Gender</span>
          <span className="font-semibold text-white capitalize">
            {man_power.gender}
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            setCurrentman_power(man_power);
            setIsModalOpen(true);
          }}
          className="w-1/2 mr-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FontAwesomeIcon icon={faEdit} className="mr-2" />
          Edit
        </button>
        <button
          onClick={() => handleDelete(man_power.id)}
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
  const handleEditman_power = (man_power) => {
    setCurrentman_power(man_power);
    setIsModalOpen(true);

    // Timeout to ensure modal is open before populating
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.elements.first_name.value = man_power.first_name;
        form.elements.last_name.value = man_power.last_name;
        form.elements.gender.value = man_power.gender;
        form.elements.phone_number.value = man_power.phone_number;
        form.elements.email.value = man_power.email;
        form.elements.national_id_number.value = man_power.national_id_number;
        form.elements.residence.value = man_power.residence;
        form.elements.status.value = man_power.status;
        form.elements.availability_status.value = man_power.availability_status;
      }
    }, 100);
  };

  // Comprehensive Filtering and Sorting Logic
  const filteredAndSortedman_powers = useMemo(() => {
    let result = man_powersData.filter((man_power) => {
      const nameMatch = [man_power.first_name, man_power.last_name]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const statusMatch = !filters.status || man_power.status === filters.status;
      const availabilityMatch =
        !filters.availability ||
        man_power.availability_status === filters.availability;
      const genderMatch = !filters.gender || man_power.gender === filters.gender;

      // Age and Experience Filters (assuming you have these fields)
      const ageMatch =
        (!filters.ageRange.min || man_power.age >= filters.ageRange.min) &&
        (!filters.ageRange.max || man_power.age <= filters.ageRange.max);

      const experienceMatch =
        (!filters.experience.min ||
          man_power.years_of_experience >= filters.experience.min) &&
        (!filters.experience.max ||
          man_power.years_of_experience <= filters.experience.max);

      return (
        nameMatch &&
        statusMatch &&
        availabilityMatch &&
        genderMatch &&
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
  }, [man_powersData, searchQuery, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Do you want to delete this man_power?")) return;
    try {
      await axios.delete(`${BASE_URL}delete/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await handleFetch();
      setMessage("man_power deleted successfully");
      setMessageType("success");
      setCurrentPage(1);
    } catch (err) {
      setMessage(err.response?.data.message || "An error occurred");
      setMessageType("error");
    }
  };


const [logoBase64, setLogoBase64] = useState(null);

// Add this useEffect to convert logo to base64
useEffect(() => {
  const convertImageToBase64 = (imageSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        ctx.drawImage(this, 0, 0);
        const dataURL = canvas.toDataURL();
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  };

  convertImageToBase64(Logo)
    .then(base64 => setLogoBase64(base64))
    .catch(err => console.error('Error converting logo:', err));
}, []);

// Helper functions for insights and analysis
const getMostCommonGender = () => {
  if (filteredAndSortedman_powers.length === 0) return 'N/A';
  
  const genders = {};
  filteredAndSortedman_powers.forEach(manpower => {
    genders[manpower.gender] = (genders[manpower.gender] || 0) + 1;
  });
  
  const mostCommon = Object.entries(genders).sort((a, b) => b[1] - a[1])[0];
  return mostCommon ? `${mostCommon[0]} (${mostCommon[1]} people)` : 'N/A';
};

const getMostCommonResidence = () => {
  if (filteredAndSortedman_powers.length === 0) return 'N/A';
  
  const residences = {};
  filteredAndSortedman_powers.forEach(manpower => {
    if (manpower.residence) {
      residences[manpower.residence] = (residences[manpower.residence] || 0) + 1;
    }
  });
  
  const mostCommon = Object.entries(residences).sort((a, b) => b[1] - a[1])[0];
  return mostCommon ? `${mostCommon[0]} (${mostCommon[1]} people)` : 'N/A';
};

const getApprovalRate = () => {
  if (filteredAndSortedman_powers.length === 0) return '0%';
  
  const approvedCount = filteredAndSortedman_powers.filter(mp => mp.status === 'approved').length;
  const rate = (approvedCount / filteredAndSortedman_powers.length * 100).toFixed(1);
  return `${rate}% (${approvedCount}/${filteredAndSortedman_powers.length})`;
};

const getActiveRate = () => {
  if (filteredAndSortedman_powers.length === 0) return '0%';
  
  const activeCount = filteredAndSortedman_powers.filter(mp => mp.availability_status === 'active').length;
  const rate = (activeCount / filteredAndSortedman_powers.length * 100).toFixed(1);
  return `${rate}% (${activeCount}/${filteredAndSortedman_powers.length})`;
};

// Replace your existing handleDownload object with this enhanced version
const handleDownload = {
  PDF: () => {
    const doc = new jsPDF();
    
    try {
      // Add logo if available
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 20, 10, 40, 20);
      }
      
      // Add company header
      doc.setFontSize(16);
      doc.setTextColor(220, 53, 69); // Red color similar to your theme
      doc.text('RELOCATION MANAGEMENT SYSTEM', 20, 40);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Man Power Management Report', 20, 50);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 60);
      
      // Add summary section
      doc.setFontSize(14);
      doc.setTextColor(220, 53, 69);
      doc.text('Executive Summary', 20, 80);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const summaryTableData = [
        ['Metric', 'Value'],
        ['Total Man Power', filteredAndSortedman_powers.length.toString()],
        ['Approved Personnel', filteredAndSortedman_powers.filter(mp => mp.status === 'approved').length.toString()],
        ['Rejected Personnel', filteredAndSortedman_powers.filter(mp => mp.status === 'rejected').length.toString()],
        ['Active Personnel', filteredAndSortedman_powers.filter(mp => mp.availability_status === 'active').length.toString()],
        ['Inactive Personnel', filteredAndSortedman_powers.filter(mp => mp.availability_status === 'inactive').length.toString()],
        ['Approval Rate', getApprovalRate()],
        ['Active Rate', getActiveRate()]
      ];
      
      doc.autoTable({
        startY: 90,
        head: [summaryTableData[0]],
        body: summaryTableData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 20 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 50 }
        }
      });
      
      // Add key insights
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setTextColor(220, 53, 69);
      doc.text('Key Insights', 20, finalY);
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      const insights = [
        `• Total personnel registered: ${filteredAndSortedman_powers.length}`,
        `• Approval rate: ${getApprovalRate()}`,
        `• Active personnel rate: ${getActiveRate()}`,
        `• Most common gender: ${getMostCommonGender()}`,
        `• Most common residence: ${getMostCommonResidence()}`
      ];
      
      insights.forEach((insight, index) => {
        doc.text(insight, 25, finalY + 15 + (index * 8));
      });
      
      // Add detailed table on new page if needed
      const tableStartY = finalY + 70;
      if (tableStartY > 250) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(220, 53, 69);
        doc.text('Man Power Details', 20, 30);
        
        // Prepare table data
        const tableData = filteredAndSortedman_powers.map(manpower => [
          `${manpower.first_name} ${manpower.last_name}`,
          manpower.gender,
          manpower.phone_number,
          manpower.email || 'N/A',
          manpower.residence || 'N/A',
          manpower.status,
          manpower.availability_status
        ]);
        
        doc.autoTable({
          startY: 40,
          head: [['Full Name', 'Gender', 'Phone', 'Email', 'Residence', 'Status', 'Availability']],
          body: tableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [220, 53, 69], 
            textColor: 255,
            fontSize: 8
          },
          styles: { 
            fontSize: 7,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Name
            1: { cellWidth: 15 }, // Gender
            2: { cellWidth: 25 }, // Phone
            3: { cellWidth: 35 }, // Email
            4: { cellWidth: 25 }, // Residence
            5: { cellWidth: 20 }, // Status
            6: { cellWidth: 20 }  // Availability
          }
        });
      } else {
        doc.setFontSize(14);
        doc.setTextColor(220, 53, 69);
        doc.text('Man Power Details', 20, tableStartY);
        
        // Prepare table data
        const tableData = filteredAndSortedman_powers.map(manpower => [
          `${manpower.first_name} ${manpower.last_name}`,
          manpower.gender,
          manpower.phone_number,
          manpower.email || 'N/A',
          manpower.residence || 'N/A',
          manpower.status,
          manpower.availability_status
        ]);
        
        doc.autoTable({
          startY: tableStartY + 10,
          head: [['Full Name', 'Gender', 'Phone', 'Email', 'Residence', 'Status', 'Availability']],
          body: tableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [220, 53, 69], 
            textColor: 255,
            fontSize: 8
          },
          styles: { 
            fontSize: 7,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Name
            1: { cellWidth: 15 }, // Gender
            2: { cellWidth: 25 }, // Phone
            3: { cellWidth: 35 }, // Email
            4: { cellWidth: 25 }, // Residence
            5: { cellWidth: 20 }, // Status
            6: { cellWidth: 20 }  // Availability
          }
        });
      }
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Relocation Management System - Page ${i} of ${pageCount}`, 
                 20, doc.internal.pageSize.height - 10);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Error generating PDF report');
      setMessageType('error');
    }
    
    doc.save(`manpower_report_${new Date().toISOString().split('T')[0]}.pdf`);
    setMessage('PDF report generated successfully!');
    setMessageType('success');
  },

  Excel: () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['RELOCATION MANAGEMENT SYSTEM'],
        ['Man Power Management Report'],
        [`Generated on: ${new Date().toLocaleDateString()}`],
        [''],
        ['EXECUTIVE SUMMARY'],
        ['Metric', 'Value'],
        ['Total Man Power', filteredAndSortedman_powers.length],
        ['Approved Personnel', filteredAndSortedman_powers.filter(mp => mp.status === 'approved').length],
        ['Rejected Personnel', filteredAndSortedman_powers.filter(mp => mp.status === 'rejected').length],
        ['Active Personnel', filteredAndSortedman_powers.filter(mp => mp.availability_status === 'active').length],
        ['Inactive Personnel', filteredAndSortedman_powers.filter(mp => mp.availability_status === 'inactive').length],
        ['Approval Rate', getApprovalRate()],
        ['Active Rate', getActiveRate()],
        [''],
        ['KEY INSIGHTS'],
        [`Total personnel registered: ${filteredAndSortedman_powers.length}`],
        [`Personnel approval rate: ${getApprovalRate()}`],
        [`Active personnel rate: ${getActiveRate()}`],
        [`Most common gender: ${getMostCommonGender()}`],
        [`Most common residence: ${getMostCommonResidence()}`]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Detailed Data Sheet
      const detailedData = filteredAndSortedman_powers.map(manpower => ({
        'Full Name': `${manpower.first_name} ${manpower.last_name}`,
        'First Name': manpower.first_name,
        'Last Name': manpower.last_name,
        'Gender': manpower.gender,
        'Phone Number': manpower.phone_number,
        'Email': manpower.email || 'N/A',
        'National ID': manpower.national_id_number,
        'Residence': manpower.residence || 'N/A',
        'Status': manpower.status,
        'Availability Status': manpower.availability_status,
        'Created Date': manpower.created_at ? new Date(manpower.created_at).toLocaleDateString() : 'N/A',
        'Updated Date': manpower.updated_at ? new Date(manpower.updated_at).toLocaleDateString() : 'N/A'
      }));
      
      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Data');
      
      // Status Analysis Sheet
      const statusAnalysis = ['approved', 'rejected'].map(status => ({
        'Status': status.charAt(0).toUpperCase() + status.slice(1),
        'Count': filteredAndSortedman_powers.filter(mp => mp.status === status).length,
        'Percentage': `${((filteredAndSortedman_powers.filter(mp => mp.status === status).length / filteredAndSortedman_powers.length) * 100).toFixed(1)}%`
      }));
      
      const statusSheet = XLSX.utils.json_to_sheet(statusAnalysis);
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status Analysis');
      
      // Gender Analysis Sheet
      const genderAnalysis = ['male', 'female', 'other'].map(gender => ({
        'Gender': gender.charAt(0).toUpperCase() + gender.slice(1),
        'Count': filteredAndSortedman_powers.filter(mp => mp.gender === gender).length,
        'Percentage': `${((filteredAndSortedman_powers.filter(mp => mp.gender === gender).length / filteredAndSortedman_powers.length) * 100).toFixed(1)}%`
      }));
      
      const genderSheet = XLSX.utils.json_to_sheet(genderAnalysis);
      XLSX.utils.book_append_sheet(workbook, genderSheet, 'Gender Analysis');
      
      // Availability Analysis Sheet
      const availabilityAnalysis = ['active', 'inactive'].map(availability => ({
        'Availability': availability.charAt(0).toUpperCase() + availability.slice(1),
        'Count': filteredAndSortedman_powers.filter(mp => mp.availability_status === availability).length,
        'Percentage': `${((filteredAndSortedman_powers.filter(mp => mp.availability_status === availability).length / filteredAndSortedman_powers.length) * 100).toFixed(1)}%`
      }));
      
      const availabilitySheet = XLSX.utils.json_to_sheet(availabilityAnalysis);
      XLSX.utils.book_append_sheet(workbook, availabilitySheet, 'Availability Analysis');
      
      XLSX.writeFile(workbook, `manpower_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setMessage('Excel report generated successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      setMessage('Error generating Excel report');
      setMessageType('error');
    }
  },

  CSV: () => {
    try {
      // Prepare enhanced CSV with summary at the top
      const summaryRows = [
        ['RELOCATION MANAGEMENT SYSTEM'],
        [`Generated on: ${new Date().toLocaleDateString()}`],
        [''],
        ['EXECUTIVE SUMMARY'],
        ['Total Man Power', filteredAndSortedman_powers.length],
        ['Approved Personnel', filteredAndSortedman_powers.filter(mp => mp.status === 'approved').length],
        ['Rejected Personnel', filteredAndSortedman_powers.filter(mp => mp.status === 'rejected').length],
        ['Active Personnel', filteredAndSortedman_powers.filter(mp => mp.availability_status === 'active').length],
        ['Inactive Personnel', filteredAndSortedman_powers.filter(mp => mp.availability_status === 'inactive').length],
        ['Approval Rate', getApprovalRate()],
        ['Active Rate', getActiveRate()],
        ['Most Common Gender', getMostCommonGender()],
        ['Most Common Residence', getMostCommonResidence()],
        [''],
        ['DETAILED DATA'],
        ['Full Name', 'Gender', 'Phone Number', 'Email', 'National ID', 'Residence', 'Status', 'Availability Status', 'Created Date']
      ];
      
      const dataRows = filteredAndSortedman_powers.map(manpower => [
        `"${manpower.first_name} ${manpower.last_name}"`,
        manpower.gender,
        manpower.phone_number,
        manpower.email || 'N/A',
        manpower.national_id_number,
        `"${manpower.residence || 'N/A'}"`,
        manpower.status,
        manpower.availability_status,
        manpower.created_at ? new Date(manpower.created_at).toLocaleDateString() : 'N/A'
      ]);
      
      const allRows = [...summaryRows, ...dataRows];
      const csvContent = "data:text/csv;charset=utf-8," + 
        allRows.map(row => row.join(",")).join("\n");
      
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `manpower_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setMessage('CSV report generated successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Error generating CSV:', error);
      setMessage('Error generating CSV report');
      setMessageType('error');
    }
  }
};


  const handleman_powerSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
        const formData = new FormData();
        const form = e.target;
        
        const fields = [
            "first_name", "last_name", "gender", "phone_number", "email", 
            "national_id_number", "residence", "status", "availability_status"
        ];

        // Directly use the form's current values
        fields.forEach((field) => {
            formData.append(field, form.elements[field].value);
        });


        const nationalIdFile = form.elements.nationalIdUpload.files[0];


        if (nationalIdFile) {
            formData.append("national_id_card", nationalIdFile);
        }


        const token = localStorage.getItem("token");
        const url = currentman_power 
            ? `${BASE_URL}update/${currentman_power.id}/` 
            : `${BASE_URL}create/`;

        const response = await axios({
            method: currentman_power ? "put" : "post",
            url,
            data: formData,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });

        setMessage(currentman_power ? "man_power updated successfully" : "man_power added successfully");
        setMessageType("success");

        await handleFetch();
        setIsModalOpen(false);
    } catch (err) {
        console.error("Error submitting man_power:", err);
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
        className="bg-gray-800 text-gray-300 px-4 py-2 rounded flex items-center"
      >
        <FontAwesomeIcon icon={faDownload} className="mr-2" />
        Download
      </button>
      {downloadMenuVisible && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              handleDownload.PDF();
              setDownloadMenuVisible(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 flex items-center"
          >
            <FontAwesomeIcon icon={faFile} className="mr-2" /> PDF
          </button>
          <button
            onClick={() => {
              handleDownload.Excel();
              setDownloadMenuVisible(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 flex items-center"
          >
            <FontAwesomeIcon icon={faFileExcel} className="mr-2" /> Excel
          </button>
          <button
            onClick={() => {
              handleDownload.CSV();
              setDownloadMenuVisible(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-300 flex items-center"
          >
            <FontAwesomeIcon icon={faFileCsv} className="mr-2" /> CSV
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
            man_powers Management
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
                setCurrentman_power(null);
                setIsModalOpen(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Add man_power
            </button>
          </div>
        </div>

        {renderman_powersTable()}
      </div>

      {renderCharts()}
      {renderFilterModal()} 

      {/* Modals */}
      {isViewModalOpen && renderman_powerDetailsModal()}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4 py-8">
          <div className="bg-gray-900 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-gray-800 relative">
            <div className="sticky top-0 bg-gray-900 z-10 flex justify-between items-center mb-6 pb-2 border-b border-gray-800">
              <h2 className="text-xl font-bold text-red-500">
                {currentman_power ? "Update man_power" : "Add New man_power"}
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
              onSubmit={handleman_powerSubmit}
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
                        {currentman_power ? "Updating..." : "Adding..."}
                      </>
                    ) : currentman_power ? (
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
export default Admin_Manage_Man_Powers;

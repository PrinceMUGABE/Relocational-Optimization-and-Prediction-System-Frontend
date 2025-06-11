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

function Man_Power_Manage_Relocations() {
  const [relocations, setRelocations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [relocationsPerPage, setRelocationsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [downloadMenuVisible, setDownloadMenuVisible] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentRelocation, setCurrentRelocation] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const navigate = useNavigate();

  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleFetch = async () => {
    try {
      const res = await axios.get(`${BASE_URL}get-man-power/`, {
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

  // New function for handling status updates only
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
  
    if (!currentRelocation || !newStatus) {
      setMessage("Invalid data. Please select a valid status.");
      setMessageType("error");
      setErrorMessage("Invalid data. Please select a valid status.");
      setErrorModalOpen(true);
      return;
    }
  
    try {
      const response = await axios.patch(
        `${BASE_URL}status-update/${currentRelocation.id}/`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
  
      setMessage(response.data.message || "Status updated successfully");
      setMessageType("success");
      handleFetch();
      closeStatusModal();
    } catch (err) {
      console.error("Error updating status:", err);
      
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.message || 
                       "Failed to update status";
  
      setMessage(errorMsg);
      setMessageType("error");
      
      // Set error message and open modal
      setErrorMessage(errorMsg);
      setErrorModalOpen(true);
    }
  };

  const openStatusModal = (relocation) => {
    setCurrentRelocation(relocation);
    setNewStatus(relocation.status || "");
    setStatusNotes("");
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setCurrentRelocation(null);
    setNewStatus("");
    setStatusNotes("");
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
      </div>
    );
  };

  const filteredData = relocations.filter((relocation) =>
    [
      relocation.start_point,
      relocation.end_point,
      relocation.status,
      relocation.relocation_size,
    ].some((field) => field?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentRelocations = filteredData.slice(
    (currentPage - 1) * relocationsPerPage,
    currentPage * relocationsPerPage
  );

  // New simpler modal just for status updates
  const renderStatusModal = () => {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          isStatusModalOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`fixed inset-0 bg-black opacity-50 ${
            isStatusModalOpen ? "block" : "hidden"
          }`}
          onClick={closeStatusModal}
        ></div>
        <div className="bg-gray-900 rounded-lg shadow-xl p-6 z-50 w-full max-w-md border border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-red-500">
            Update Relocation Status
          </h2>
          <form onSubmit={handleStatusUpdate}>
            <div className="space-y-4">
              {/* Current Status Display */}
              <div className="mb-4">
                <span className="block text-gray-400 mb-1">Current Status:</span>
                <span className="px-3 py-1 bg-gray-800 rounded-md text-white inline-block capitalize">
                  {currentRelocation?.status || "N/A"}
                </span>
              </div>

              {/* New Status Dropdown */}
              <div>
                <label className="block text-gray-300 mb-2 font-bold">
                  New Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 bg-gray-800 border-2 border-red-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Relocation Details Summary */}
              <div className="mt-6 p-3 bg-gray-800 rounded-md border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Relocation Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-gray-400">Origin:</div>
                  <div className="text-white">{currentRelocation?.origin_sector || "N/A"}</div>
                  
                  <div className="text-gray-400">Destination:</div>
                  <div className="text-white">{currentRelocation?.destination_sector || "N/A"}</div>
                  
                  <div className="text-gray-400">Vehicle:</div>
                  <div className="text-white">{currentRelocation?.vehicle?.plate_number || "N/A"}</div>
                  
                  <div className="text-gray-400">Move Date:</div>
                  <div className="text-white">{currentRelocation?.move_datetime ? 
                    new Date(currentRelocation.move_datetime).toLocaleString() : "N/A"}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={closeStatusModal}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Update Status
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ErrorModal = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-red-600 font-bold text-lg">Error</h2>
          <p className="text-black">{message} !!!!!!</p>
          <button 
            onClick={onClose} 
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
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
              View and update relocation statuses from a central dashboard
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
                        <th className="px-6 py-3 rounded-tr-lg">Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRelocations.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
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
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                                relocation.status === 'completed' ? 'bg-green-900 text-green-200' :
                                relocation.status === 'canceled' ? 'bg-red-900 text-red-200' :
                                relocation.status === 'in_progress' ? 'bg-blue-900 text-blue-200' :
                                'bg-yellow-900 text-yellow-200'
                              }`}>
                                {relocation.status}
                              </span>
                              {/* <p className="text-red-700 mt-1">Assigned driver:</p>
                              <p className="text-gray-300">
                                {relocation.driver?.user?.phone_number ||
                                  relocation.driver.driving_license_number}
                              </p> */}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {new Date(
                                relocation.move_datetime
                              ).toLocaleString()}
                            </td>

                            <td className="px-6 py-4">
                              {relocation.driver ? (
                                <div className="flex items-center space-x-2">
                                  {/* <img
                                    src={relocation.driver.user?.profile_picture || relocation.driver.profile_picture}
                                    alt="Driver"
                                    className="w-8 h-8 rounded-full"
                                  /> */}
                                  <span className="text-gray-300">
                                    {relocation.driver.user?.phone_number ||
                                      relocation.driver.first_name}{" "}
                                   
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">No driver assigned</span>
                              )}
                            </td>

                            {/* <td className="px-6 py-4">
                              <button
                                onClick={() => openStatusModal(relocation)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition flex items-center"
                              >
                                <FontAwesomeIcon icon={faEdit} className="mr-1" />
                                Update Status
                              </button>
                            </td> */}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
        {renderStatusModal()}

        <ErrorModal 
          isOpen={errorModalOpen} 
          onClose={() => setErrorModalOpen(false)} 
          message={errorMessage} 
        />
      </div>
    </ErrorBoundary>



  );
}

export default Man_Power_Manage_Relocations;
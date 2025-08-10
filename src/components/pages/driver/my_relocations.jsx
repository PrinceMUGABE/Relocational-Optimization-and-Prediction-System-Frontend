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

function Driver_Manage_Relocations() {
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
      const res = await axios.get(`${BASE_URL}get-driver/`, {
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
     
     // Add logo to the top left corner
     const logoWidth = 30;
     const logoHeight = 15;
     doc.addImage(Logo, "PNG", 10, 10, logoWidth, logoHeight);
     
     // Header with company name and system title
     doc.setFontSize(12);
     doc.setTextColor(220, 38, 38); // Red color matching your theme
     doc.text("RELOCATION MANAGEMENT SYSTEM", 50, 15);
     
     doc.setFontSize(10);
     doc.setTextColor(100, 100, 100);
     doc.text("Relocation Management Report", 50, 20);
     doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 50, 25);
     
     // Add red line separator
     doc.setDrawColor(220, 38, 38);
     doc.setLineWidth(0.5);
     doc.line(10, 30, 200, 30);
     
     // Report Title
     doc.setFontSize(16);
     doc.setTextColor(0, 0, 0);
     doc.text("RELOCATION MANAGEMENT REPORT", 105, 40, { align: "center" });
     
     // Executive Summary Section
     doc.setFontSize(12);
     doc.setTextColor(220, 38, 38);
     doc.text("Executive Summary", 14, 55);
     
     // Create summary table
     const summaryData = [
       ["Metric", "Value"],
       ["Total Relocations", filteredData.length.toString()],
       ["Approved Relocations", filteredData.filter(r => r.status === "completed").length.toString()],
       ["Rejected Relocations", filteredData.filter(r => r.status === "canceled").length.toString()],
       ["Pending Relocations", filteredData.filter(r => r.status === "pending").length.toString()],
       ["In Progress", filteredData.filter(r => r.status === "in_progress").length.toString()],
     ];
     
     doc.autoTable({
       startY: 60,
       head: [summaryData[0]],
       body: summaryData.slice(1),
       theme: "grid",
       headStyles: {
         fillColor: [220, 38, 38],
         textColor: [255, 255, 255],
         fontSize: 10,
       },
       bodyStyles: {
         fontSize: 9,
       },
       columnStyles: {
         0: { cellWidth: 50 },
         1: { cellWidth: 30, halign: "center" },
       },
       margin: { left: 14, right: 14 },
     });
     
     // Key Insights Section
     let currentY = doc.lastAutoTable.finalY + 15;
     doc.setFontSize(12);
     doc.setTextColor(220, 38, 38);
     doc.text("Key Insights", 14, currentY);
     
     // Calculate insights
     const totalRevenue = filteredData.reduce((sum, r) => sum + Number(r.adjusted_cost || 0), 0);
     const avgCost = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
     const completionRate = filteredData.length > 0 ? 
       (filteredData.filter(r => r.status === "completed").length / filteredData.length * 100) : 0;
     
     // Most popular destination
     const destinationCounts = filteredData.reduce((acc, r) => {
       const dest = r.destination_district;
       acc[dest] = (acc[dest] || 0) + 1;
       return acc;
     }, {});
     const mostPopularDest = Object.entries(destinationCounts)
       .sort((a, b) => b[1] - a[1])[0];
     
     const insights = [
       `• Total revenue generated: FRW${totalRevenue.toFixed(2)}`,
       `• Average cost per relocation: FRW${avgCost.toFixed(2)}`,
       `• Completion rate: ${completionRate.toFixed(1)}%`,
       `• Most popular destination: ${mostPopularDest ? mostPopularDest[0] : 'N/A'} (${mostPopularDest ? mostPopularDest[1] : 0} relocations)`,
     ];
     
     doc.setFontSize(10);
     doc.setTextColor(80, 80, 80);
     insights.forEach((insight, index) => {
       doc.text(insight, 14, currentY + 8 + (index * 5));
     });
     
     // Relocation Details Section
     currentY = currentY + 35;
     doc.setFontSize(12);
     doc.setTextColor(220, 38, 38);
     doc.text("Relocation Details", 14, currentY);
     
     const headers = [
       "ID",
       "Owner",
       "Origin", 
       "Destination",
       "Status",
       "Move Date",
       "Cost",
     ];
     
     const data = filteredData.map((relocation) => [
       relocation.id.toString(),
       relocation.created_by?.phone_number || 'N/A',
       `${relocation.origin_sector}, ${relocation.origin_district}`,
       `${relocation.destination_sector}, ${relocation.destination_district}`,
       relocation.status.charAt(0).toUpperCase() + relocation.status.slice(1),
       new Date(relocation.move_datetime).toLocaleDateString(),
       `$${Number(relocation.adjusted_cost || 0).toFixed(2)}`,
     ]);
     
     doc.autoTable({
       startY: currentY + 5,
       head: [headers],
       body: data,
       theme: "grid",
       headStyles: {
         fillColor: [220, 38, 38],
         textColor: [255, 255, 255],
         fontSize: 8,
       },
       bodyStyles: {
         fontSize: 7,
       },
       alternateRowStyles: {
         fillColor: [245, 245, 245],
       },
       columnStyles: {
         0: { cellWidth: 15 },
         1: { cellWidth: 25 },
         2: { cellWidth: 40 },
         3: { cellWidth: 40 },
         4: { cellWidth: 20 },
         5: { cellWidth: 25 },
         6: { cellWidth: 20 },
       },
     });
     
     // Add footer with page numbers
     const pageCount = doc.internal.getNumberOfPages();
     for (let i = 1; i <= pageCount; i++) {
       doc.setPage(i);
       doc.setFontSize(8);
       doc.setTextColor(150, 150, 150);
       doc.text(
         `Relocation Management System - Driver Report - Page ${i} of ${pageCount}`,
         105,
         285,
         { align: "center" }
       );
     }
     
     doc.save(`relocation_report_${new Date().toISOString().split('T')[0]}.pdf`);
   },
 
   Excel: () => {
     const workbook = XLSX.utils.book_new();
     
     // Calculate metrics for summary
     const totalRevenue = filteredData.reduce((sum, r) => sum + Number(r.adjusted_cost || 0), 0);
     const avgCost = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
     const completionRate = filteredData.length > 0 ? 
       (filteredData.filter(r => r.status === "completed").length / filteredData.length * 100) : 0;
     
     // Executive Summary sheet
     const summaryData = [
       ["RELOCATION MANAGEMENT SYSTEM"],
       ["Driver Management Report"],
       [""],
       [`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
       [""],
       ["EXECUTIVE SUMMARY"],
       [""],
       ["Metric", "Value"],
       ["Total Relocations", filteredData.length],
       ["Approved Relocations", filteredData.filter(r => r.status === "completed").length],
       ["Rejected Relocations", filteredData.filter(r => r.status === "canceled").length],
       ["Pending Relocations", filteredData.filter(r => r.status === "pending").length],
       ["In Progress", filteredData.filter(r => r.status === "in_progress").length],
       [""],
       ["KEY INSIGHTS"],
       [""],
       ["Total Revenue Generated", `FRW${totalRevenue.toFixed(2)}`],
       ["Average Cost per Relocation", `FRW${avgCost.toFixed(2)}`],
       ["Completion Rate", `${completionRate.toFixed(1)}%`],
       [""],
       ["RELOCATION DETAILS"],
     ];
 
     XLSX.utils.book_append_sheet(
       workbook,
       XLSX.utils.aoa_to_sheet(summaryData),
       "Executive Summary"
     );
 
     // Filtered Data sheet
     const headers = [
       "ID",
       "Owner Phone",
       "Owner Email",
       "Origin District",
       "Origin Sector", 
       "Destination District",
       "Destination Sector",
       "Status",
       "Move Date",
       "Base Cost",
       "Adjusted Cost",
       "Payment Status",
       "Vehicle Plate",
       "Driver Contact",
       "Relocation Size"
     ];
 
     const data = filteredData.map((relocation) => [
       relocation.id,
       relocation.created_by?.phone_number || 'N/A',
       relocation.created_by?.email || 'N/A',
       relocation.origin_district,
       relocation.origin_sector,
       relocation.destination_district,
       relocation.destination_sector,
       relocation.status.charAt(0).toUpperCase() + relocation.status.slice(1),
       new Date(relocation.move_datetime).toLocaleDateString(),
       Number(relocation.base_cost || 0).toFixed(2),
       Number(relocation.adjusted_cost || 0).toFixed(2),
       relocation.is_paid ? "Paid" : "Unpaid",
       relocation.vehicle?.plate_number || "N/A",
       relocation.driver?.user?.phone_number || relocation.driver?.driving_license_number || "N/A",
       relocation.relocation_size
     ]);
 
     XLSX.utils.book_append_sheet(
       workbook,
       XLSX.utils.aoa_to_sheet([headers, ...data]),
       "Filtered Relocation Data"
     );
     
     // Status Analysis sheet
     const statusAnalysis = [
       ["STATUS ANALYSIS"],
       [""],
       ["Status", "Count", "Percentage", "Revenue"],
     ];
     
     const statusBreakdown = ["pending", "in_progress", "completed", "canceled"].map(status => {
       const statusData = filteredData.filter(r => r.status === status);
       const statusRevenue = statusData.reduce((sum, r) => sum + Number(r.adjusted_cost || 0), 0);
       const percentage = filteredData.length > 0 ? (statusData.length / filteredData.length * 100) : 0;
       
       return [
         status.charAt(0).toUpperCase() + status.slice(1),
         statusData.length,
         `${percentage.toFixed(1)}%`,
         `$${statusRevenue.toFixed(2)}`
       ];
     });
     
     statusAnalysis.push(...statusBreakdown);
     
     XLSX.utils.book_append_sheet(
       workbook,
       XLSX.utils.aoa_to_sheet(statusAnalysis),
       "Status Analysis"
     );
 
     XLSX.writeFile(workbook, `relocation_report_${new Date().toISOString().split('T')[0]}.xlsx`);
   },
 
   CSV: () => {
     // Calculate metrics
     const totalRevenue = filteredData.reduce((sum, r) => sum + Number(r.adjusted_cost || 0), 0);
     const avgCost = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
     const completionRate = filteredData.length > 0 ? 
       (filteredData.filter(r => r.status === "completed").length / filteredData.length * 100) : 0;
     
     // Create enhanced CSV content
     let csvContent = "RELOCATION MANAGEMENT SYSTEM\n";
     csvContent += "Driver Management Report\n";
     csvContent += `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
     
     csvContent += "EXECUTIVE SUMMARY\n";
     csvContent += "Metric,Value\n";
     csvContent += `Total Relocations,${filteredData.length}\n`;
     csvContent += `Approved Relocations,${filteredData.filter(r => r.status === "completed").length}\n`;
     csvContent += `Rejected Relocations,${filteredData.filter(r => r.status === "canceled").length}\n`;
     csvContent += `Pending Relocations,${filteredData.filter(r => r.status === "pending").length}\n`;
     csvContent += `In Progress,${filteredData.filter(r => r.status === "in_progress").length}\n\n`;
     
     csvContent += "KEY INSIGHTS\n";
     csvContent += `Total Revenue Generated,$${totalRevenue.toFixed(2)}\n`;
     csvContent += `Average Cost per Relocation,$${avgCost.toFixed(2)}\n`;
     csvContent += `Completion Rate,${completionRate.toFixed(1)}%\n\n`;
     
     // Most popular destination
     const destinationCounts = filteredData.reduce((acc, r) => {
       const dest = r.destination_district;
       acc[dest] = (acc[dest] || 0) + 1;
       return acc;
     }, {});
     const mostPopularDest = Object.entries(destinationCounts)
       .sort((a, b) => b[1] - a[1])[0];
     
     if (mostPopularDest) {
       csvContent += `Most Popular Destination,${mostPopularDest[0]} (${mostPopularDest[1]} relocations)\n\n`;
     }
     
     // Relocation Details
     csvContent += "RELOCATION DETAILS\n";
     const headers = [
       "ID",
       "Owner Phone", 
       "Owner Email",
       "Origin District",
       "Origin Sector",
       "Destination District", 
       "Destination Sector",
       "Status",
       "Move Date",
       "Base Cost",
       "Adjusted Cost",
       "Payment Status",
       "Vehicle Plate",
       "Driver Contact",
       "Relocation Size"
     ].join(",");
 
     csvContent += headers + "\n";
 
     filteredData.forEach((relocation) => {
       csvContent += [
         relocation.id,
         `"${relocation.created_by?.phone_number || 'N/A'}"`,
         `"${relocation.created_by?.email || 'N/A'}"`,
         `"${relocation.origin_district}"`,
         `"${relocation.origin_sector}"`,
         `"${relocation.destination_district}"`,
         `"${relocation.destination_sector}"`,
         relocation.status.charAt(0).toUpperCase() + relocation.status.slice(1),
         new Date(relocation.move_datetime).toLocaleDateString(),
         Number(relocation.base_cost || 0).toFixed(2),
         Number(relocation.adjusted_cost || 0).toFixed(2),
         relocation.is_paid ? "Paid" : "Unpaid",
         `"${relocation.vehicle?.plate_number || "N/A"}"`,
         `"${relocation.driver?.user?.phone_number || relocation.driver?.driving_license_number || "N/A"}"`,
         relocation.relocation_size,
       ].join(",") + "\n";
     });
     
     // Add status breakdown
     csvContent += "\n\nSTATUS ANALYSIS\n";
     csvContent += "Status,Count,Percentage,Revenue\n";
     
     ["pending", "in_progress", "completed", "canceled"].forEach(status => {
       const statusData = filteredData.filter(r => r.status === status);
       const statusRevenue = statusData.reduce((sum, r) => sum + Number(r.adjusted_cost || 0), 0);
       const percentage = filteredData.length > 0 ? (statusData.length / filteredData.length * 100) : 0;
       
       csvContent += `${status.charAt(0).toUpperCase() + status.slice(1)},${statusData.length},${percentage.toFixed(1)}%,$${statusRevenue.toFixed(2)}\n`;
     });
 
     const link = document.createElement("a");
     link.setAttribute(
       "href",
       "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
     );
     link.setAttribute("download", `relocation_report_${new Date().toISOString().split('T')[0]}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
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
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(response.data.message || "Status updated successfully");
      setMessageType("success");
      handleFetch();
      closeStatusModal();
    } catch (err) {
      console.error("Error updating status:", err);

      const errorMsg =
        err.response?.data?.error ||
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
                <span className="block text-gray-400 mb-1">
                  Current Status:
                </span>
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
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Relocation Details
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-gray-400">Origin:</div>
                  <div className="text-white">
                    {currentRelocation?.origin_sector || "N/A"}
                  </div>

                  <div className="text-gray-400">Destination:</div>
                  <div className="text-white">
                    {currentRelocation?.destination_sector || "N/A"}
                  </div>

                  <div className="text-gray-400">Vehicle:</div>
                  <div className="text-white">
                    {currentRelocation?.vehicle?.plate_number || "N/A"}
                  </div>

                  <div className="text-gray-400">Move Date:</div>
                  <div className="text-white">
                    {currentRelocation?.move_datetime
                      ? new Date(
                          currentRelocation.move_datetime
                        ).toLocaleString()
                      : "N/A"}
                  </div>
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
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          >
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
                        <th className="px-6 py-3 rounded-tr-lg">Actions</th>
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
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                                  relocation.status === "completed"
                                    ? "bg-green-900 text-green-200"
                                    : relocation.status === "canceled"
                                    ? "bg-red-900 text-red-200"
                                    : relocation.status === "in_progress"
                                    ? "bg-blue-900 text-blue-200"
                                    : "bg-yellow-900 text-yellow-200"
                                }`}
                              >
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
                              {relocation.status !== "completed" && (
                                <button
                                  onClick={() => openStatusModal(relocation)}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition flex items-center"
                                >
                                  <FontAwesomeIcon
                                    icon={faEdit}
                                    className="mr-1"
                                  />
                                  Update Status
                                </button>
                              )}
                            </td>
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

export default Driver_Manage_Relocations;

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

function Customer_Manage_Relocations() {
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
      const res = await axios.get(`${BASE_URL}user/`, {
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

      // Add title and header (shifted down to accommodate logo)
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Relocation Management Report", 105, 25, { align: "center" });

      doc.setFontSize(12);
      doc.text(`From: ${new Date().toLocaleDateString()}`, 14, 35);
      doc.text(`To: ${new Date().toLocaleDateString()}`, 14, 40);
      doc.text("Type: Comprehensive Relocation Analysis", 14, 45);

      // Add summary statistics (adjusted y positions)
      doc.setFontSize(14);
      doc.text("Summary Statistics", 14, 55);

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

      doc.setFontSize(11);
      doc.text(`Total Relocations: ${totalRelocations}`, 20, 65);
      doc.text(`Pending: ${pendingRelocations}`, 20, 70);
      doc.text(`In Progress: ${inProgressRelocations}`, 20, 75);
      doc.text(`Completed: ${completedRelocations}`, 20, 80);
      doc.text(`Canceled: ${canceledRelocations}`, 20, 85);

      // Add relocation data table (adjusted startY)
      doc.setFontSize(14);
      doc.text("Relocation Details", 14, 95);

      const headers = [
        "ID",
        "Origin",
        "Destination",
        "Size",
        "Status",
        "Move Date",
        "Cost",
      ];

      const data = relocations.map((relocation) => [
        relocation.id,
        `${relocation.origin_sector}, ${relocation.origin_district}`,
        `${relocation.destination_sector}, ${relocation.destination_district}`,
        relocation.relocation_size,
        relocation.status,
        new Date(relocation.move_datetime).toLocaleDateString(),
        `$${Number(relocation.adjusted_cost).toFixed(2)}`,
      ]);

      doc.autoTable({
        startY: 100, // Adjusted start position
        head: [headers],
        body: data,
        theme: "grid",
        headStyles: {
          fillColor: [255, 0, 0], // Red header
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: "center" });
        doc.text(`Printed on: ${new Date().toLocaleDateString()}`, 105, 290, {
          align: "center",
        });
      }

      doc.save("relocation_report.pdf");
    },

    Excel: () => {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Relocation Management Report"],
        [""],
        ["From:", new Date().toLocaleDateString()],
        ["To:", new Date().toLocaleDateString()],
        ["Type:", "Comprehensive Relocation Analysis"],
        [""],
        ["Summary Statistics"],
        ["Total Relocations:", relocations.length],
        ["Pending:", relocations.filter((r) => r.status === "pending").length],
        [
          "Completed:",
          relocations.filter((r) => r.status === "completed").length,
        ],
        [
          "In Progress:",
          relocations.filter((r) => r.status === "in_progress").length,
        ],
        [
          "Canceled:",
          relocations.filter((r) => r.status === "canceled").length,
        ],
        [""],
        ["Relocation Details"],
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(summaryData),
        "Summary"
      );

      // Data sheet
      const headers = [
        "ID",
        "Origin District",
        "Origin Sector",
        "Destination District",
        "Destination Sector",
        "Size",
        "Status",
        "Move Date",
        "Cost",
        "Vehicle",
        "Driver",
      ];

      const data = relocations.map((relocation) => [
        relocation.id,
        relocation.origin_district,
        relocation.origin_sector,
        relocation.destination_district,
        relocation.destination_sector,
        relocation.relocation_size,
        relocation.status,
        new Date(relocation.move_datetime).toLocaleDateString(),
        Number(relocation.adjusted_cost).toFixed(2),
        relocation.vehicle?.plate_number || "N/A",
        relocation.driver?.user?.phone_number ||
          relocation.driver?.driving_license_number ||
          "N/A",
      ]);

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([headers, ...data]),
        "Relocation Data"
      );

      XLSX.writeFile(workbook, "relocation_report.xlsx");
    },

    CSV: () => {
      // Create summary section
      let csvContent = "Relocation Management Report\n\n";
      csvContent += `From:,${new Date().toLocaleDateString()}\n`;
      csvContent += `To:,${new Date().toLocaleDateString()}\n`;
      csvContent += "Type:,Comprehensive Relocation Analysis\n\n";

      // Add summary statistics
      csvContent += "Summary Statistics\n";
      csvContent += `Total Relocations:,${relocations.length}\n`;
      csvContent += `Pending:,${
        relocations.filter((r) => r.status === "pending").length
      }\n`;
      csvContent += `Completed:,${
        relocations.filter((r) => r.status === "completed").length
      }\n`;
      csvContent += `In Progress:,${
        relocations.filter((r) => r.status === "in_progress").length
      }\n`;
      csvContent += `Canceled:,${
        relocations.filter((r) => r.status === "canceled").length
      }\n\n`;

      // Add relocation data
      csvContent += "Relocation Details\n";
      const headers = [
        "ID",
        "Origin District",
        "Origin Sector",
        "Destination District",
        "Destination Sector",
        "Size",
        "Status",
        "Move Date",
        "Cost",
        "Vehicle",
        "Driver",
      ].join(",");

      csvContent += headers + "\n";

      relocations.forEach((relocation) => {
        csvContent +=
          [
            relocation.id,
            `"${relocation.origin_district}"`,
            `"${relocation.origin_sector}"`,
            `"${relocation.destination_district}"`,
            `"${relocation.destination_sector}"`,
            relocation.relocation_size,
            relocation.status,
            new Date(relocation.move_datetime).toLocaleDateString(),
            Number(relocation.adjusted_cost).toFixed(2),
            relocation.vehicle?.plate_number || "N/A",
            relocation.driver?.user?.phone_number ||
              relocation.driver?.driving_license_number ||
              "N/A",
          ].join(",") + "\n";
      });

      const link = document.createElement("a");
      link.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
      );
      link.setAttribute("download", "relocation_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  };

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
                    disabled
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
                    disabled
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
                    disabled
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
                    disabled
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
                <select
                  name="vehicle"
                  value={currentRelocation?.vehicle?.id || ""}
                  disabled
                  onChange={(e) => {
                    // Create a modified copy of currentRelocation
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
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_type} - {vehicle.plate_number} (Weight:{" "}
                      {vehicle.total_weight_to_carry} kg) - (Category:{""}{" "}
                      {vehicle.driving_category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Dropdown - With onChange handler */}
              <div>
                <label className="block text-gray-300 mb-2">Driver</label>
                <select
                  name="driver"
                  value={currentRelocation?.driver?.id || ""}
                  disabled
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
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name} -{" "}
                      {driver.user?.phone_number} {"   "}
                      {/* {driver.driving_categories} - {"  "} */}
                      {driver.availability_status}
                    </option>
                  ))}
                </select>
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
                  {/* <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option> */}
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
                  {/* <div>
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
                      disabled
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    />
                  </div> */}

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
                      disabled
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-gray-300"
                    />
                  </div>
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
    navigate("/customer/vehicles");
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
                        title="Export comprehensive report with summary statistics and relocation details"
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Export Report
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
                        <th className="px-6 py-3">Payment Status</th>
                        <th className="px-6 py-3">Paid By</th>
                        {/* <th className="px-6 py-3 rounded-tr-lg">Actions</th> */}
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
                                    Cost
                                  </span>
                                  <p className="text-lg font-semibold">
                                    $
                                    {Number(relocation.adjusted_cost).toFixed(
                                      2
                                    )}
                                  </p>
                                </div>
                                {/* <div>
                                  <span className="text-gray-500 text-sm font-medium">
                                    Base Cost
                                  </span>
                                  <p className="text-lg font-semibold">
                                    ${Number(relocation.base_cost).toFixed(2)}
                                  </p>
                                </div> */}
                              </div>
                            </td>

                            <td className="px-4 py-2">
                              {relocation.is_paid ? "Paid" : "Unpaid"}
                            </td>

                            <td className="px-4 py-2">
                              {relocation.phone_number || "N/A"}
                            </td>

                            {/* <td className="px-6 py-4">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => {
                                    setCurrentRelocation(relocation);
                                    setIsModalOpen(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 transition"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  onClick={() => handleDelete(relocation.id)}
                                  className="text-red-400 hover:text-red-300 transition"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
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
        {renderModal()}
      </div>
    </ErrorBoundary>
  );
}

export default Customer_Manage_Relocations;

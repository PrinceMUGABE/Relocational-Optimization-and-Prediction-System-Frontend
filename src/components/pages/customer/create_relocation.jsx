/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import mapData from "../customer/mapData.json";

// Custom icon creation function
const createCustomIcon = (color) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const Customer_Create_Relocation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mapInstance, setMapInstance] = useState(null);
  const mapContainerRef = useRef(null);

  // State for form inputs
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSectors, setAllSectors] = useState([]);
  const [selectedOriginDistrict, setSelectedOriginDistrict] = useState("");
  const [selectedDestinationDistrict, setSelectedDestinationDistrict] =
    useState("");
  const [selectedOriginSector, setSelectedOriginSector] = useState("");
  const [selectedDestinationSector, setSelectedDestinationSector] =
    useState("");

  // Marker and route states
  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [routeLine, setRouteLine] = useState(null);

  // Recommendation states
  const [recommendationData, setRecommendationData] = useState(null);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] =
    useState(false);

  // Other form states
  const [moveDateTime, setMoveDateTime] = useState("");
  const [originCoordinates, setOriginCoordinates] = useState(null);
  const [destinationCoordinates, setDestinationCoordinates] = useState(null);
  const [recommendationToken, setRecommendationToken] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [currentRelocation, setCurrentRelocation] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Vehicle ID from previous page
  const vehicleId = location.state?.vehicleId;

  // Get all districts from provinces
  const getAllDistricts = () => {
    const districts = mapData.provinces.flatMap((province) =>
      province.coordinates.districts.map((district) => ({
        name: district.name,
        provinceName: province.city || province.province,
      }))
    );
    return districts;
  };

  // Get sectors for a specific district
  const getSectorsForDistrict = (districtName) => {
    const allSectorsData = mapData.provinces.flatMap((province) =>
      province.coordinates.districts
        .filter((district) => district.name === districtName)
        .flatMap((district) =>
          district.sectors.map((sector) => ({
            ...sector,
            districtName: district.name,
            provinceName: province.city || province.province,
          }))
        )
    );
    return allSectorsData;
  };

  // Get coordinates for a specific sector
  const getSectorCoordinates = (sectorName, districtName) => {
    const matchingSector = mapData.provinces.flatMap((province) =>
      province.coordinates.districts
        .filter((district) => district.name === districtName)
        .flatMap((district) =>
          district.sectors.filter((sector) => sector.name === sectorName)
        )
    )[0];

    return matchingSector
      ? { lat: matchingSector.latitude, lng: matchingSector.longitude }
      : null;
  };

  // Draw optimal route with improved visualization
  const drawOptimalRoute = (coordinates) => {
    if (!mapInstance || !coordinates || coordinates.length === 0) return;

    // Remove existing route line
    if (routeLine) {
      mapInstance.removeLayer(routeLine);
    }

    // Create new route line with backend coordinates
    const routeCoordinates = coordinates.map((coord) => [
      coord.latitude,
      coord.longitude,
    ]);

    const newRouteLine = L.polyline(routeCoordinates, {
      color: "red",
      weight: 5,
      dashArray: "10, 10", // Dashed line
      opacity: 0.7,
    }).addTo(mapInstance);

    setRouteLine(newRouteLine);

    // Fit map to route bounds with some padding
    if (routeCoordinates.length > 0) {
      mapInstance.fitBounds(routeCoordinates, {
        padding: [50, 50], // Add some padding around the route
        maxZoom: 12, // Prevent zooming too close
      });
    }
  };

  // Populate districts on component mount
  useEffect(() => {
    const districts = getAllDistricts();
    setAllDistricts(districts);
  }, []);

  // Update sectors when origin district changes
  useEffect(() => {
    if (selectedOriginDistrict) {
      const sectorsForDistrict = getSectorsForDistrict(selectedOriginDistrict);
      setAllSectors(sectorsForDistrict);
    }
  }, [selectedOriginDistrict]);

  // Initial map creation
  useEffect(() => {
    // Find center of first province (Kigali)
    const firstProvince = mapData.provinces[0];
    const provinceCenter = [
      firstProvince.coordinates.city_center.latitude,
      firstProvince.coordinates.city_center.longitude,
    ];

    const map = L.map(mapContainerRef.current).setView(provinceCenter, 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    setMapInstance(map);

    // Add markers for notable locations and district centers
    mapData.provinces.forEach((province) => {
      if (province.coordinates.notable_locations) {
        province.coordinates.notable_locations.forEach((location) => {
          L.marker([location.latitude, location.longitude])
            .bindPopup(
              `${location.name} (${province.city || province.province})`
            )
            .addTo(map);
        });
      }

      // Add markers for all district centers
      province.coordinates.districts.forEach((district) => {
        L.marker([district.latitude, district.longitude])
          .bindPopup(
            `${district.name} District (${province.city || province.province})`
          )
          .addTo(map);
      });
    });

    // Cleanup function
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Map click handling and marker placement
  useEffect(() => {
    if (!mapInstance) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;

      if (!originMarker) {
        // Place origin marker
        const newOriginMarker = L.marker([lat, lng], {
          icon: createCustomIcon("green"),
        }).addTo(mapInstance);
        setOriginMarker(newOriginMarker);
        setOriginCoordinates({ lat, lng });
      } else if (!destinationMarker) {
        // Place destination marker
        const newDestinationMarker = L.marker([lat, lng], {
          icon: createCustomIcon("red"),
        }).addTo(mapInstance);
        setDestinationMarker(newDestinationMarker);
        setDestinationCoordinates({ lat, lng });

        // Draw line between markers
        const line = L.polyline(
          [
            [originMarker.getLatLng().lat, originMarker.getLatLng().lng],
            [lat, lng],
          ],
          { color: "blue" }
        ).addTo(mapInstance);
        setRouteLine(line);
      } else {
        // Remove existing markers and line
        mapInstance.removeLayer(originMarker);
        mapInstance.removeLayer(destinationMarker);
        if (routeLine) mapInstance.removeLayer(routeLine);

        // Place new origin marker
        const newOriginMarker = L.marker([lat, lng], {
          icon: createCustomIcon("green"),
        }).addTo(mapInstance);
        setOriginMarker(newOriginMarker);
        setDestinationMarker(null);
        setRouteLine(null);
        setOriginCoordinates({ lat, lng });
        setDestinationCoordinates(null);
      }
    };

    mapInstance.on("click", handleMapClick);

    return () => {
      mapInstance.off("click", handleMapClick);
    };
  }, [mapInstance, originMarker, destinationMarker, routeLine]);

  // Sector change handlers
  const handleOriginSectorChange = (sectorName) => {
    setSelectedOriginSector(sectorName);

    // Get coordinates for the selected sector
    const sectorCoordinates = getSectorCoordinates(
      sectorName,
      selectedOriginDistrict
    );

    if (sectorCoordinates) {
      // Remove existing origin marker if any
      if (originMarker) {
        mapInstance.removeLayer(originMarker);
      }

      // Add new marker for the selected sector
      const newOriginMarker = L.marker(
        [sectorCoordinates.lat, sectorCoordinates.lng],
        { icon: createCustomIcon("green") }
      ).addTo(mapInstance);

      // Update states
      setOriginMarker(newOriginMarker);
      setOriginCoordinates(sectorCoordinates);

      // Center map on selected location
      mapInstance.setView([sectorCoordinates.lat, sectorCoordinates.lng], 12);
    }
  };

  const handleDestinationSectorChange = (sectorName) => {
    setSelectedDestinationSector(sectorName);

    // Get coordinates for the selected sector
    const sectorCoordinates = getSectorCoordinates(
      sectorName,
      selectedDestinationDistrict
    );

    if (sectorCoordinates) {
      // Remove existing destination marker if any
      if (destinationMarker) {
        mapInstance.removeLayer(destinationMarker);
      }

      // Add new marker for the selected sector
      const newDestinationMarker = L.marker(
        [sectorCoordinates.lat, sectorCoordinates.lng],
        { icon: createCustomIcon("red") }
      ).addTo(mapInstance);

      // Update states
      setDestinationMarker(newDestinationMarker);
      setDestinationCoordinates(sectorCoordinates);

      // Draw line if origin marker exists
      if (originMarker && originCoordinates) {
        // Remove existing route line if any
        if (routeLine) {
          mapInstance.removeLayer(routeLine);
        }

        // Draw new route line
        const line = L.polyline(
          [
            [originCoordinates.lat, originCoordinates.lng],
            [sectorCoordinates.lat, sectorCoordinates.lng],
          ],
          { color: "blue" }
        ).addTo(mapInstance);
        setRouteLine(line);
      }

      // Center map on selected location
      mapInstance.setView([sectorCoordinates.lat, sectorCoordinates.lng], 12);
    }
  };

  // Reset map view
  const resetMap = () => {
    if (mapInstance) {
      const firstProvince = mapData.provinces[0];
      const provinceCenter = [
        firstProvince.coordinates.city_center.latitude,
        firstProvince.coordinates.city_center.longitude,
      ];

      mapInstance.setView(provinceCenter, 8);

      // Remove existing markers and line
      if (originMarker) mapInstance.removeLayer(originMarker);
      if (destinationMarker) mapInstance.removeLayer(destinationMarker);
      if (routeLine) mapInstance.removeLayer(routeLine);

      // Reset states
      setOriginMarker(null);
      setDestinationMarker(null);
      setRouteLine(null);
      setOriginCoordinates(null);
      setDestinationCoordinates(null);
      setSelectedOriginDistrict("");
      setSelectedDestinationDistrict("");
      setSelectedOriginSector("");
      setSelectedDestinationSector("");
    }
  };

  // Retrieve the token from local storage
  const token = localStorage.getItem("token");

  // Handle form submission
  // Fix for the handleSubmit function - properly accessing the vehicle value
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if token exists
    if (!token) {
      alert("Authentication token not found. Please log in again.");
      navigate("/login");
      return;
    }

    // Validation checks
    if (!originCoordinates || !destinationCoordinates) {
      alert("Please select origin and destination points on the map");
      return;
    }

    if (!moveDateTime) {
      alert("Please select a date and time");
      return;
    }

    // Get the selected vehicle ID from the dropdown
    const vehicleSelect = document.querySelector('select[name="vehicle"]');
    const selectedVehicleId = vehicleSelect ? vehicleSelect.value : null;

    if (!selectedVehicleId || selectedVehicleId === "") {
      alert("Please select a vehicle");
      return;
    }

    try {
      // Prepare submission data
      const submissionData = {
        start_point: `${originCoordinates.lng},${originCoordinates.lat}`,
        end_point: `${destinationCoordinates.lng},${destinationCoordinates.lat}`,
        vehicle_id: selectedVehicleId, // Use the selected vehicle ID
        move_datetime: new Date(moveDateTime).toISOString(),
        origin_district: selectedOriginDistrict,
        origin_sector: selectedOriginSector,
        destination_district: selectedDestinationDistrict,
        destination_sector: selectedDestinationSector,
      };

      console.log("Submitted Data: ", submissionData);

      // Submit to backend
      const response = await axios.post(
        "http://127.0.0.1:8000/relocation/create/",
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Route Recommendations: ", response.data);

      setRecommendationToken(response.data.recommendation_token);

      // Set recommendation data and open modal
      setRecommendationData(response.data);
      setIsRecommendationModalOpen(true);

      // Draw optimal route if available
      if (
        response.data.optimal_route &&
        response.data.optimal_route.coordinates
      ) {
        drawOptimalRoute(response.data.optimal_route.coordinates);
      }
    } catch (error) {
      console.error("Error submitting route:", error);
      alert("Failed to submit route. Please try again.");
    }
  };

  // Fixed vehicle dropdown in the return section
  // Replace the existing vehicle dropdown with this:
  <div>
    <label className="block text-sm font-medium text-gray-700">Vehicle</label>
    <select
      name="vehicle"
      className="mt-1 text-black block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      defaultValue={vehicleId || ""}
    >
      <option value="">Select Vehicle</option>
      {vehicles.map((vehicle) => (
        <option key={vehicle.id} value={vehicle.id}>
          {vehicle.vehicle_type} (Weight: {vehicle.total_weight_to_carry} kg)
        </option>
      ))}
    </select>
  </div>;

  // Handle route confirmation
  const handleConfirmRoute = async () => {
    // Retrieve the token from local storage
    const token = localStorage.getItem("token");

    // Check if token exists
    if (!token) {
      alert("Authentication token not found. Please log in again.");
      navigate("/login");
      return;
    }

    // Check if recommendation token exists
    if (!recommendationToken) {
      alert("No recommendation token found. Please submit a route first.");
      return;
    }

    // Validate phone number
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number for payment processing.");
      return;
    }

    // Basic phone number validation (adjust regex as needed for your requirements)
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      alert("Please enter a valid phone number.");
      return;
    }

    try {
      // Submit confirmation with the recommendation token and phone number
      const response = await axios.post(
        "http://127.0.0.1:8000/relocation/confirm/",
        {
          recommendation_token: recommendationToken,
          phone_number: phoneNumber.trim(), // Include phone number in the request
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      navigate("/customer/relocations");
    } catch (error) {
      console.error("Error confirming route:", error);

      // Check for unauthorized error
      if (error.response && error.response.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      alert("Failed to confirm route. Please try again.");
    }
  };

  // Handle route cancellation
  const handleCancelRoute = async () => {
    // Retrieve the token from local storage
    const token = localStorage.getItem("token");

    // Check if token exists
    if (!token) {
      alert("Authentication token not found. Please log in again.");
      navigate("/login");
      return;
    }

    // Check if recommendation token exists
    if (!recommendationToken) {
      alert("No recommendation token found. Please submit a route first.");
      return;
    }

    try {
      // Submit cancellation with the recommendation token
      await axios.post(
        "http://127.0.0.1:8000/relocation/cancel/",
        {
          recommendation_token: recommendationToken,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setIsRecommendationModalOpen(false);

      // Reset map route visualization
      if (routeLine) {
        mapInstance.removeLayer(routeLine);
        setRouteLine(null);
      }
    } catch (error) {
      console.error("Error canceling route:", error);

      // Check for unauthorized error
      if (error.response && error.response.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      alert("Failed to cancel route. Please try again.");
    }
  };

 const RecommendationModal = () => {
  if (!recommendationData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-2">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[95vh] flex flex-col relative overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setIsRecommendationModalOpen(false)}
            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold z-10"
          >
            ✕
          </button>
          <h2 className="text-xl text-black font-bold pr-8">Route Recommendation</h2>
        </div>

        {/* Content - Scrollable with better height management */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="space-y-4 pb-4">
            {/* Route Information Box */}
            {/* <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-base text-blue-800 mb-2">Route Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-black"><strong>Origin:</strong> {recommendationData.origin_district} - {recommendationData.origin_sector}</p>
                  <p className="text-black"><strong>Destination:</strong> {recommendationData.destination_district} - {recommendationData.destination_sector}</p>
                </div>
                <div>
                  <p className="text-black"><strong>Distance:</strong> {recommendationData.optimal_route.distance_km} km</p>
                  <p className="text-black"><strong>Duration:</strong> {recommendationData.optimal_route.estimated_duration}</p>
                </div>
              </div>
              <p className="text-black mt-2 text-sm"><strong>Adjusted Cost:</strong> <span className="text-red-600 font-bold text-lg">{recommendationData.optimal_route.adjusted_cost}</span></p>
            </div> */}

            {/* Travel Conditions Box */}
            {/* <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-base text-gray-800 mb-2">Travel Conditions</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-black"><strong>Season:</strong> {recommendationData.conditions.season}</p>
                  <p className="text-black"><strong>Weather:</strong> {recommendationData.conditions.weather}</p>
                </div>
                <div>
                  <p className="text-black"><strong>Time of Day:</strong> {recommendationData.conditions.time_of_day}</p>
                  <p className="text-black"><strong>Traffic:</strong> {recommendationData.conditions.traffic_condition}</p>
                </div>
              </div>
            </div> */}

            {/* Payment Section - Prominently displayed */}
            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400 shadow-lg">
              <div className="flex items-center mb-3">
                <div className="bg-yellow-200 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Payment Information</h3>
                  <p className="text-gray-600 text-sm">Enter your phone number to proceed</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+250 123 456 789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Payment request will be sent to this number</p>
                </div>
                
                <div className="bg-white p-3 rounded border border-gray-300 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black">Total Amount:</span>
                    <span className="text-xl font-bold text-red-600">{recommendationData.optimal_route.adjusted_cost}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Relocation Tips - Compact */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h3 className="font-semibold text-base text-green-800 mb-2">Relocation Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recommendationData.relocation_tips.map((tip, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-green-600 mr-2 text-xs mt-1">•</span>
                    <span className="text-gray-700 text-xs leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirmRoute}
              disabled={!phoneNumber.trim()}
              className={`px-6 py-3 rounded-md font-medium text-base flex-1 transition-all duration-200 ${
                !phoneNumber.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {!phoneNumber.trim() ? 'Enter Phone Number' : 'Confirm & Pay Now'}
            </button>
            <button
              onClick={handleCancelRoute}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium text-base flex-1 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Cancel Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
  // Inside the RecommendationModal component
  const renderRelocationTips = (tips) => {
    // If tips are 3 or fewer, render as a single list
    if (tips.length <= 3) {
      return (
        <ul className="list-disc list-inside">
          {tips.map((tip, index) => (
            <li key={index} className="text-sm text-gray-600">
              {tip}
            </li>
          ))}
        </ul>
      );
    }

    // If tips exceed 3, split into multiple columns
    const firstColumnTips = tips.slice(0, Math.ceil(tips.length / 2));
    const secondColumnTips = tips.slice(Math.ceil(tips.length / 2));

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <ul className="list-disc list-inside">
            {firstColumnTips.map((tip, index) => (
              <li key={index} className="text-sm text-gray-600">
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <ul className="list-disc list-inside">
            {secondColumnTips.map((tip, index) => (
              <li key={index} className="text-sm text-gray-600">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

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

  return (

<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
  <div className="max-w-6xl mx-auto px-4">
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <h1 className="text-3xl font-bold text-white">Create New Relocation</h1>
        <p className="text-blue-100 mt-2">Plan your move with our intelligent routing system</p>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="mb-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Origin District Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 bg-yellow-100 px-3 py-1 rounded-md border-l-4 border-yellow-500">
                📍 Origin District
              </label>
              <select
                value={selectedOriginDistrict}
                onChange={(e) => {
                  setSelectedOriginDistrict(e.target.value);
                  setSelectedOriginSector("");
                }}
                className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select Origin District</option>
                {allDistricts.map((district) => (
                  <option
                    key={`${district.name}-${district.provinceName}`}
                    value={district.name}
                  >
                    {district.name} ({district.provinceName})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination District Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 bg-green-100 px-3 py-1 rounded-md border-l-4 border-green-500">
                🎯 Destination District
              </label>
              <select
                value={selectedDestinationDistrict}
                onChange={(e) => {
                  setSelectedDestinationDistrict(e.target.value);
                  setSelectedDestinationSector("");
                }}
                className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select Destination District</option>
                {allDistricts.map((district) => (
                  <option
                    key={`${district.name}-${district.provinceName}`}
                    value={district.name}
                  >
                    {district.name} ({district.provinceName})
                  </option>
                ))}
              </select>
            </div>

            {/* Origin Sector Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 bg-yellow-100 px-3 py-1 rounded-md border-l-4 border-yellow-500">
                📍 Origin Sector
              </label>
              <select
                value={selectedOriginSector}
                onChange={(e) => handleOriginSectorChange(e.target.value)}
                disabled={!selectedOriginDistrict}
                className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Origin Sector</option>
                {allSectors.map((sector) => (
                  <option
                    key={`${sector.name}-${sector.districtName}`}
                    value={sector.name}
                  >
                    {sector.name} (District: {sector.districtName})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Sector Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 bg-green-100 px-3 py-1 rounded-md border-l-4 border-green-500">
                🎯 Destination Sector
              </label>
              <select
                value={selectedDestinationSector}
                onChange={(e) => handleDestinationSectorChange(e.target.value)}
                disabled={!selectedDestinationDistrict}
                className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Destination Sector</option>
                {selectedDestinationDistrict
                  ? getSectorsForDistrict(selectedDestinationDistrict).map(
                      (sector) => (
                        <option
                          key={`${sector.name}-${sector.districtName}`}
                          value={sector.name}
                        >
                          {sector.name} (District: {sector.districtName})
                        </option>
                      )
                    )
                  : []}
              </select>
            </div>

            {/* Date and Time Picker - Enhanced with past date restriction */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 bg-purple-100 px-3 py-1 rounded-md border-l-4 border-purple-500">
                📅 Move Date and Time
              </label>
              <input
                type="datetime-local"
                value={moveDateTime}
                onChange={(e) => setMoveDateTime(e.target.value)}
                min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>

            {/* Vehicle Dropdown - Enhanced */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 bg-orange-100 px-3 py-1 rounded-md border-l-4 border-orange-500">
                🚛 Vehicle Selection
              </label>
              <select
                name="vehicle"
                defaultValue={vehicleId || ""}
                className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_type} (Weight: {vehicle.total_weight_to_carry} kg)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Status Indicators - Replace coordinates display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-green-800">Origin Location</h3>
                  <p className="text-sm text-green-600">
                    {originCoordinates ? "✅ Location Selected" : "❌ Not Selected"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border-2 border-red-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-red-800">Destination Location</h3>
                  <p className="text-sm text-red-600">
                    {destinationCoordinates ? "✅ Location Selected" : "❌ Not Selected"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Enhanced Map Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800">📍 Map Instructions</h3>
              <p className="text-sm text-blue-700 mt-1">
                Select districts and sectors from the dropdowns above, or click directly on the map to set your 
                <span className="font-semibold text-green-600"> origin (green marker)</span> and 
                <span className="font-semibold text-red-600"> destination (red marker)</span> points.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Map Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            type="button"
            onClick={resetMap}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            🔄 Reset Map View
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            🚀 Submit Route
          </button>
        </div>

        {/* Enhanced Map Container */}
        <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-gray-200">
          <div
            ref={mapContainerRef}
            style={{ height: "600px", width: "100%" }}
            className="relative"
          />
        </div>
      </div>
    </div>

    {/* Recommendation Modal */}
    {isRecommendationModalOpen && <RecommendationModal />}
  </div>
</div>
  );
};

export default Customer_Create_Relocation;

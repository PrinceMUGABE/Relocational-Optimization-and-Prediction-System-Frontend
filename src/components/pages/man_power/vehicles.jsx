/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Man_Power_VehiclesDisplay = () => {
  const [vehicles, setVehicles] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(9);
  const navigate = useNavigate();

  // Fetch vehicles on component mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/vehicle/list_vehicles/');
        setVehicles(response.data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, []);

  const handleOrderClick = (vehicleId) => {
    navigate('/driver/predict', { state: { vehicleId } });
  };

  // Cards per page filter options
  const cardFilterOptions = [9, 15, 30, 50, 100];

  // Pagination logic
  const totalPages = Math.ceil(vehicles.length / cardsPerPage);
  const displayedVehicles = vehicles.slice(
    currentPage * cardsPerPage, 
    (currentPage * cardsPerPage) + cardsPerPage
  );

  // Pagination handlers
  const handleNextPage = () => {
    setCurrentPage((prevPage) => 
      prevPage < totalPages - 1 ? prevPage + 1 : prevPage
    );
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => 
      prevPage > 0 ? prevPage - 1 : prevPage
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-200 p-4">
      {/* Filter and Pagination Controls */}
      <div className="flex justify-between items-center mb-4 max-w-6xl mx-auto">
        {/* Cards per page selector */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-700">Show:</span>
          <select 
            value={cardsPerPage}
            onChange={(e) => {
              setCardsPerPage(Number(e.target.value));
              setCurrentPage(0); // Reset to first page when changing card count
            }}
            className="px-2 py-1 text-black border rounded"
          >
            {cardFilterOptions.map(num => (
              <option key={num} value={num}>{num} cards</option>
            ))}
          </select>
        </div>

        {/* Pagination Controls */}
        <div className="flex space-x-2">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-black rounded disabled:opacity-100"
          >
            Previous
          </button>
          <span className="self-center text-red-800">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button 
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 bg-black rounded disabled:opacity-100"
          >
            Next
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-3 gap-4 max-w-6xl mx-auto">
        <AnimatePresence>
          {displayedVehicles.map((vehicle, index) => (
            <motion.div 
              key={vehicle.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-all hover:scale-105"
            >
              {/* Vehicle Image */}
              <div className="h-40 w-full relative">
                {vehicle.image_base64 ? (
                  <img 
                    src={vehicle.image_base64} 
                    alt={`Vehicle ${vehicle.id}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    No Image Available
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-1 text-sm">
                  {vehicle.vehicle_model || 'Unnamed Vehicle'}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="p-4">
                <div className="text-gray-700 mb-3 space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="font-semibold">Type:</span>
                    <span>{vehicle.type}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold">Weight:</span>
                    <span>{vehicle.total_weight_to_carry} kg</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold">Relocation:</span>
                    <span>{vehicle.relocation_size}</span>
                  </p>
                </div>

                {/* Order Button
                <button 
                  onClick={() => handleOrderClick(vehicle.id)}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-95 shadow-md text-sm"
                >
                  Make order
                </button> */}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Man_Power_VehiclesDisplay;
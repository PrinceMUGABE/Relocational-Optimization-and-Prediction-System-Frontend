/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { 
  FaUserCircle, 
  FaSignOutAlt, 
  FaCommentDots
} from "react-icons/fa";
import { 
  MdDashboard, 
  MdPeople, 
  MdDirectionsCar, 
  MdPersonPin,
  MdCompareArrows, 
  MdInsights, 
  MdFeedback
} from "react-icons/md";
import { X, Menu } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/pictures/logo.png";

function Sidebar() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve user data from local storage
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const userId = userData.id || "";

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Enhanced sidebar links with more appropriate icons
  const Sidebar_Links = [
    { id: 1, name: "Dashboard", path: "/admin", icon: <MdDashboard className="text-xl" /> },
    { id: 2, name: "Users", path: "/admin/users", icon: <MdPeople className="text-xl" /> },
    { id: 3, name: "Vehicles", path: "/admin/vehicles", icon: <MdDirectionsCar className="text-xl" /> },
    { id: 4, name: "Drivers", path: "/admin/drivers", icon: <MdPersonPin className="text-xl" /> },
    { id: 5, name: "Man Powers", path: "/admin/man_powers", icon: <MdPersonPin className="text-xl" /> },

    { id: 6, name: "Relocations", path: "/admin/relocations", icon: <MdCompareArrows className="text-xl" /> },
    { id: 7, name: "Forecast", path: "/admin/forecasts", icon: <MdInsights className="text-xl" /> },
    { id: 8, name: "Feedbacks", path: "/admin/feedbacks", icon: <MdFeedback className="text-xl" /> },
    { id: 9, name: "Profile", path: `/admin/profile/${userId}`, icon: <FaUserCircle className="text-xl" /> },
  ];

  // Check if the current path matches the link path
  const isActiveLink = (path) => {
    return location.pathname === path || 
           (path !== "/admin" && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md shadow-lg hover:bg-gray-700 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col w-64 fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl py-6 z-40">
        <div className="flex justify-center items-center mb-8 px-6">
          <img src={Logo} alt="Logo" className="h-12 w-auto" />
        </div>

        <div className="flex flex-col space-y-1 px-4 flex-grow">
          {Sidebar_Links.map((link) => (
            <Link
              key={link.id}
              to={link.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isActiveLink(link.path)
                  ? "bg-gray-700 text-white font-medium shadow-md"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <span className={`${isActiveLink(link.path) ? "text-red-400" : ""}`}>{link.icon}</span>
              <span>{link.name}</span>
              {isActiveLink(link.path) && (
                <span className="ml-auto w-1.5 h-6 rounded-full bg-red-400"></span>
              )}
            </Link>
          ))}
        </div>
        
        <div className="px-4 mt-auto mb-6">
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-white flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200 w-full text-left group"
          >
            <FaSignOutAlt className="text-xl group-hover:text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-800 to-gray-900 transform transition-all duration-300 ease-in-out z-50 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <img src={Logo} alt="Logo" className="h-12 w-auto" />
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="text-gray-300 hover:text-white focus:outline-none hover:bg-gray-700/50 p-1 rounded-full"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-col h-[calc(100%-76px)]">
          <div className="flex flex-col space-y-1 p-4 flex-grow overflow-y-auto">
            {Sidebar_Links.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  isActiveLink(link.path)
                    ? "bg-gray-700 text-white font-medium shadow-md"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <span className={`${isActiveLink(link.path) ? "text-red-400" : ""}`}>{link.icon}</span>
                <span>{link.name}</span>
                {isActiveLink(link.path) && (
                  <span className="ml-auto w-1.5 h-6 rounded-full bg-red-400"></span>
                )}
              </Link>
            ))}
          </div>
          
          <div className="p-4 mt-auto border-t border-gray-700">
            <button
              onClick={() => {
                handleLogout();
                setIsMobileSidebarOpen(false);
              }}
              className="text-gray-300 hover:text-white flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200 w-full text-left group"
            >
              <FaSignOutAlt className="text-xl group-hover:text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}

export default Sidebar;
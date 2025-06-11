/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { 
  FaUserCircle, 
  FaSignOutAlt, 
  FaComments,
  FaCar, 
  FaTruckMoving
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { X, Menu, LogOut, ChevronDown, Bell } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/pictures/logo.png";

const Man_Power_Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve user data from local storage
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const userId = userData.id || "";
  const userName = userData.name || "User";

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData && userData.phone) {
      setPhone(userData.phone);
    }
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // const toggleNotifications = () => {
  //   setNotificationsOpen(!notificationsOpen);
  // };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const Navbar_Links = [
    // { id: 1, name: "Dashboard", path: "/customer", icon: <MdDashboard className="text-xl" /> },
    { id: 1, name: "Vehicles", path: "/man_power/vehicles", icon: <FaCar className="text-xl" /> },
    { id: 2, name: "Relocations", path: "/man_power/relocations", icon: <FaTruckMoving className="text-xl" /> },
    // { id: 5, name: "Forecast", path: "/customer/forecasts", icon: <MdInsights className="text-xl" /> },
    { id: 3, name: "Feedbacks", path: "/man_power/feedbacks", icon: <FaComments className="text-xl" /> },
    { id: 4, name: "Profile", path: `/man_power/profile`, icon: <FaUserCircle className="text-xl" /> },
  ];

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/man_power/vehicles" className="flex items-center">
              <img src={Logo} alt="Logo" className="h-12 w-auto mr-2" />
              <span className="text-white font-bold text-xl hidden sm:block">VehicleMove</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between space-x-1">
            {Navbar_Links.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                className={`text-white flex items-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-red-600 hover:bg-red-700 text-white font-medium"
                    : "hover:bg-gray-700 hover:text-red-400"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu & Notifications (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              {/* <button 
                className="text-white hover:text-red-400 p-2 rounded-full hover:bg-gray-700 transition-colors"
                onClick={toggleNotifications}
              >
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center">3</span>
              </button> */}
              
              {/* {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm text-gray-800">Your vehicle relocation has been confirmed</p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                    <div className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm text-gray-800">New feedback requested for your recent relocation</p>
                      <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                    </div>
                    <div className="p-3 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm text-gray-800">Special discount available for your next relocation</p>
                      <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                    </div>
                  </div>
                  <div className="p-3 text-center text-sm text-blue-600 border-t border-gray-100 cursor-pointer hover:bg-gray-50">
                    View all notifications
                  </div>
                </div>
              )} */}
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="flex items-center text-white space-x-2 rounded-md px-3 py-2 hover:bg-gray-700 transition-colors"
              >
                <FaUserCircle className="text-xl" />
                <span className="font-medium">{userName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                  <Link 
                    to={`/man_power/profile`}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="flex items-center">
                      <FaUserCircle className="mr-2" />
                      My Profile
                    </div>
                  </Link>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 rounded-b-md"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-red-400 focus:outline-none p-2 rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center">
            <img src={Logo} alt="Logo" className="h-10 w-auto mr-2" />
            <h2 className="text-white text-lg font-semibold">VehicleMove</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-red-400 focus:outline-none p-2 rounded-full hover:bg-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* User Info in Mobile Menu */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-700 rounded-full p-2">
              <FaUserCircle className="text-white text-2xl" />
            </div>
            <div>
              <p className="text-white font-medium">{userName}</p>
              <p className="text-gray-400 text-sm">{phone}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col p-4">
          {Navbar_Links.map((link) => (
            <Link
              key={link.id}
              to={link.path}
              className={`text-white flex items-center space-x-3 p-3 rounded-md transition-colors duration-200 mb-2 ${
                isActive(link.path)
                  ? "bg-red-600 hover:bg-red-700"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          ))}
          
          <div className="border-t border-gray-700 my-4"></div>
          
          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            className="text-white hover:text-red-400 flex items-center space-x-3 p-3 rounded-md hover:bg-gray-700 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </nav>
  );
};


export default Man_Power_Header;
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Calendar, Award, Edit,
  Save, X, AlertCircle, CheckCircle, Loader, FileText,
  Truck, Clock, Shield, ToggleLeft
} from 'lucide-react';

function Man_Power_Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [manPowerData, setManPowerData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    email: '',
    first_name: '',
    last_name: '',
    gender: '',
    residence: '',
    national_id_number: '',
    driving_license_number: '',
    driving_categories: [],
    availability_status: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Available driving categories for checkboxes
  const availableDrivingCategories = ['A', 'B', 'B1', 'C', 'D', 'D1', 'E', 'F'];

  useEffect(() => {
    // Fetch the user and driver data
    fetchManPowerData();
  }, [id]);

  const fetchManPowerData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('userData'));
      if (!storedUser || !storedUser.access_token) {
        console.error('No access token found');
        navigate('/login');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/man_power/man_power/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedUser.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setManPowerData(data);
        setFormData({
          phone_number: data.user.phone_number,
          email: data.user.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          gender: data.gender || '',
          residence: data.residence || '',
          national_id_number: data.national_id_number || '',
          driving_license_number: data.driving_license_number || '',
          driving_categories: data.driving_categories || [],
          availability_status: data.availability_status || 'inactive'
        });
      } else {
        console.error('Failed to fetch man power data');
        const errorData = await response.json();
        console.error(errorData);
      }
    } catch (error) {
      console.error('Error fetching man power data:', error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
    setErrors({});
    setSuccessMessage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleCategoryChange = (category) => {
    const updatedCategories = [...formData.driving_categories];

    if (updatedCategories.includes(category)) {
      // Remove category if already selected
      const index = updatedCategories.indexOf(category);
      updatedCategories.splice(index, 1);
    } else {
      // Add category if not already selected
      updatedCategories.push(category);
    }

    setFormData({
      ...formData,
      driving_categories: updatedCategories
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    const storedUser = JSON.parse(localStorage.getItem('userData'));
    const accessToken = storedUser?.access_token;

    if (!accessToken) {
      console.error('Access token is missing!');
      setErrors({ general: 'Authentication error. Please login again.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/man_power/man_power/update-profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Update local storage with updated user data
        const updatedUserData = {
          ...storedUser,
          phone: responseData.user.phone_number,
          email: responseData.user.email
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        setUserData(responseData.user);
        setManPowerData(responseData);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');

        // Refresh the component data
        fetchManPowerData();
      } else {
        // Handle validation errors
        console.error('Failed to update profile:', responseData);
        if (responseData.error) {
          setErrors({ general: responseData.error });
        } else {
          setErrors(responseData);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData || !manPowerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin text-red-600">
            <Loader size={32} />
          </div>
          <p className="text-white text-lg">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gray-800 min-h-screen flex items-center justify-center px-4 py-8">
      <div className="container mx-auto max-w-4xl z-10">
        <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 bg-red-600 text-white">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              My Profile
            </h2>
            <p className="text-gray-100 mt-1">Manage your personal information</p>
          </div>

          {successMessage && (
            <div className="mx-6 mt-6 p-4 bg-green-800 text-green-100 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {successMessage}
            </div>
          )}

          {errors.general && (
            <div className="mx-6 mt-6 p-4 bg-red-900 text-red-100 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {errors.general}
            </div>
          )}

          <div className="p-6">
            {!isEditing ? (
              <div className="space-y-6">
                <h3 className="text-xl text-white font-medium border-b border-gray-700 pb-2 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <Phone size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Phone Number</h3>
                        <p className="text-white text-lg font-medium">{userData.phone_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <Mail size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Email Address</h3>
                        <p className="text-white text-lg font-medium">{userData.email || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">First Name</h3>
                        <p className="text-white text-lg font-medium">{manPowerData.first_name || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Last Name</h3>
                        <p className="text-white text-lg font-medium">{manPowerData.last_name || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Gender</h3>
                        <p className="text-white text-lg font-medium">
                          {manPowerData.gender === 'male' ? 'Male' :
                            manPowerData.gender === 'female' ? 'Female' :
                              manPowerData.gender === 'other' ? 'Other' : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Residence</h3>
                        <p className="text-white text-lg font-medium">{manPowerData.residence || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <Award size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Role</h3>
                        <p className="text-white text-lg font-medium">{userData.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Created At</h3>
                        <p className="text-white text-lg font-medium">
                          {new Date(userData.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* License Information Section */}
                <h3 className="text-xl text-white font-medium border-b border-gray-700 pb-2 mt-8 mb-4">
                  License Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">National ID Number</h3>
                        <p className="text-white text-lg font-medium">{manPowerData.national_id_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Driving License Number</h3>
                        <p className="text-white text-lg font-medium">{manPowerData.driving_license_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <Truck size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Driving Categories</h3>
                      </div>
                    </div>
                    {manPowerData.driving_categories && manPowerData.driving_categories.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {manPowerData.driving_categories.map(category => (
                          <span key={category} className="bg-red-900 text-white px-3 py-1 rounded-full text-sm inline-block text-center">
                            Category {category}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No driving categories specified</p>
                    )}
                  </div>
                </div>

                {/* Status Section */}
                <h3 className="text-xl text-white font-medium border-b border-gray-700 pb-2 mt-8 mb-4">
                  Status Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <ToggleLeft size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Availability Status</h3>
                        <div className={`mt-1 px-3 py-1 rounded-full inline-flex items-center gap-2 ${manPowerData.availability_status === 'active'
                            ? 'bg-green-700 text-green-100'
                            : 'bg-gray-700 text-gray-300'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${manPowerData.availability_status === 'active' ? 'bg-green-300' : 'bg-gray-400'
                            }`}></span>
                          <span className="font-medium capitalize">{manPowerData.availability_status || 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">Account Status</h3>
                        <div className={`mt-1 px-3 py-1 rounded-full inline-flex items-center gap-2 ${manPowerData.status === 'approved'
                            ? 'bg-green-700 text-green-100'
                            : 'bg-red-700 text-red-100'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${manPowerData.status === 'approved' ? 'bg-green-300' : 'bg-red-300'
                            }`}></span>
                          <span className="font-medium capitalize">{manPowerData.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Uploads Section */}
                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg group hover:border-red-500 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full text-white">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-400 text-sm">National ID Document</h3>
                        {manPowerData.national_id_card ? (
                          <p className="text-green-400 mt-2 flex items-center gap-1">
                            <CheckCircle size={16} />
                            Document Uploaded
                          </p>
                        ) : (
                          <p className="text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle size={16} />
                            No Document Uploaded
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleEditClick}
                    className="px-6 py-3 flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  >
                    <Edit size={18} />
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-xl text-white font-medium border-b border-gray-700 pb-2 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className="block text-white text-sm font-medium"
                      htmlFor="phone_number"
                    >
                      Phone Number*
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className={`w-full p-3 pl-10 bg-gray-800 border ${errors.phone_number ? 'border-red-500' : 'border-gray-700'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600`}
                        required
                      />
                    </div>
                    {errors.phone_number && (
                      <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.phone_number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-white text-sm font-medium"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full p-3 pl-10 bg-gray-800 border ${errors.email ? 'border-red-500' : 'border-gray-700'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-white text-sm font-medium"
                      htmlFor="first_name"
                    >
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`w-full p-3 pl-10 bg-gray-800 border ${errors.first_name ? 'border-red-500' : 'border-gray-700'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600`}
                      />
                    </div>
                    {errors.first_name && (
                      <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.first_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-white text-sm font-medium"
                      htmlFor="last_name"
                    >
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`w-full p-3 pl-10 bg-gray-800 border ${errors.last_name ? 'border-red-500' : 'border-gray-700'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600`}
                      />
                    </div>
                    {errors.last_name && (
                      <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.last_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-white text-sm font-medium"
                      htmlFor="gender"
                    >
                      Gender
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={`w-full p-3 pl-10 bg-gray-800 border ${errors.gender ? 'border-red-500' : 'border-gray-700'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-600`}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {errors.gender && (
                      <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.gender}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-white text-sm font-medium"
                      htmlFor="residence"
                    >
                      Residence
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="residence"
                        name="residence"
                        value={formData.residence}
                        onChange={handleChange}
                        className={`w-full p-3 pl-10 bg-gray-800 border ${errors.residence ? 'border-red-500' : 'border-gray-700'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600`}
                      />
                    </div>
                    {errors.residence && (
                      <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.residence}
                      </p>
                    )}
                  </div>
                </div>

                {/* License Information Edit Section */}
                <h3 className="text-xl text-white font-medium border-b border-gray-700 pb-2 mt-8 mb-4">
                  Nationality Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className="block text-white text-sm font-medium"
                      htmlFor="national_id_number"
                    >
                      National ID Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="national_id_number"
                        name="national_id_number"
                        value={formData.national_id_number}
                        onChange={handleChange}
                        className={`w-full p-3 pl-10 bg-gray-800 border ${errors.national_id_number ? 'border-red-500' : 'border-gray-700'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600`}
                      />
                    </div>
                    {errors.national_id_number && (
                      <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.national_id_number}
                      </p>
                    )}
                  </div>

                </div>

                {/* Availability Status Edit Section */}
                <h3 className="text-xl text-white font-medium border-b border-gray-700 pb-2 mt-8 mb-4">
                  Availability Status
                </h3>
                <div className="space-y-2">
                  <label className="block text-white text-sm font-medium">
                    Set your availability status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      className={`p-3 border rounded-md cursor-pointer transition-all flex items-center gap-3 ${formData.availability_status === 'active' ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
                      onClick={() => setFormData({ ...formData, availability_status: 'active' })}
                    >
                      <div className={`w-5 h-5 rounded-full ${formData.availability_status === 'active' ? 'bg-green-500' : 'bg-gray-700'} flex items-center justify-center`}>
                        {formData.availability_status === 'active' && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">Active</p>
                        <p className="text-gray-400 text-sm">You are available for work</p>
                      </div>
                    </div>

                    <div
                      className={`p-3 border rounded-md cursor-pointer transition-all flex items-center gap-3 ${formData.availability_status === 'inactive' ? 'border-red-500 bg-red-900/30' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
                      onClick={() => setFormData({ ...formData, availability_status: 'inactive' })}
                    >
                      <div className={`w-5 h-5 rounded-full ${formData.availability_status === 'inactive' ? 'bg-red-500' : 'bg-gray-700'} flex items-center justify-center`}>
                        {formData.availability_status === 'inactive' && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">Inactive</p>
                        <p className="text-gray-400 text-sm">You are not available for work</p>
                      </div>
                    </div>
                  </div>
                  {errors.availability_status && (
                    <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.availability_status}
                    </p>
                  )}
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="px-6 py-3 flex items-center gap-2 text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

              </form>

            )},
          </div>
        </div>
       </div>
    </section>
  )
}

export default Man_Power_Profile;

















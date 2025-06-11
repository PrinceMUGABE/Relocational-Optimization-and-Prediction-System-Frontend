// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";



// Imports
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import VerifyPassword from "./components/auth/VerifyPassword.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import ChangePassword from "./components/auth/ChangePassword.jsx";


// Admin imports
import Layout from "./components/admin/Layout.jsx";
import AdminHome from "./components/pages/admin/Home.jsx";
import Users from "./components/pages/admin/Users.jsx";
import CreateUser from "./components/pages/admin/CreateNewUser.jsx";
import EditUsers from "./components/pages/admin/EditUsers.jsx";




import AdminProfile from "./components/pages/admin/AdminProfile.jsx";
import UserProfile from "./components/pages/customer/UserProfile.jsx";
import UserHome from "./components/pages/customer/Home.jsx";
// import Admin_Manage_Inventory from "./components/pages/admin/manage_inventories.jsx";
import Admin_DemandForecast from "./components/pages/admin/manage_demandForecast.jsx";
import Admin_Manage_Vehicles from "./components/pages/admin/manage_vehicles.jsx";
import Admin_Manage_Drivers from "./components/pages/admin/manage_drivers.jsx";
import Customer_Layout from "./components/customer/Layout.jsx";
import Customer_VehiclesDisplay from "./components/pages/customer/vehicles.jsx";
import Customer_Map from "./components/pages/customer/map.jsx";
import Admin_Manage_Relocations from "./components/pages/admin/manage_relocations.jsx";
import Customer_Manage_Relocations from "./components/pages/customer/my_relocations.jsx";
import Admin_Create_Relocation from "./components/pages/admin/create_relocation.jsx";
import Admin_Manage_Feedbacks from "./components/pages/admin/manage_feedbacks.jsx";
import Customer_Manage_Feedbacks from "./components/pages/customer/manage_feedbacks.jsx";
import Driver_Layout from "./components/driver/Layout.jsx";
import Driver_Home from "./components/pages/driver/Home.jsx";
import Driver_VehiclesDisplay from "./components/pages/driver/vehicles.jsx";
import Driver_Map from "./components/pages/driver/map.jsx";
import Driver_Manage_Feedbacks from "./components/pages/driver/manage_feedbacks.jsx";
import DriverProfile from "./components/pages/driver/UserProfile.jsx";
import Driver_Manage_Relocations from "./components/pages/driver/my_relocations.jsx";
import Admin_Manage_Man_Powers from "./components/pages/admin/manage_manPowers.jsx";
import Man_Power_Layout from "./components/man_power/Layout.jsx";
import Man_Power_Home from "./components/pages/man_power/Home.jsx";
import Man_Power_Manage_Relocations from "./components/pages/man_power/my_relocations.jsx";
import Man_Power_Profile from "./components/pages/man_power/UserProfile.jsx";
import Man_Power_Manage_Feedbacks from "./components/pages/man_power/manage_feedbacks.jsx";
import Man_Power_VehiclesDisplay from "./components/pages/man_power/vehicles.jsx";





const App = () => {
  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in",
      delay: 100,
    });

    AOS.refresh();
  }, []);

  return (
    <div className="bg-white dark:bg-black dark:text-white text-black overflow-x-hidden">
      <BrowserRouter>
        <Routes>
          {/* Home view */}
          <Route path="/" element={<MainLayout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/verifypassword" element={<VerifyPassword />} />
          <Route path="/passwordreset" element={<ResetPassword />} />
          <Route path="/changePassword" element={<ChangePassword />} />

          {/* End Home view */}

          {/* Admin */}

          <Route path="/admin" element={<Layout />}>
            <Route index element={<AdminHome />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/edituser/:id" element={<EditUsers />} />
            <Route path="/admin/createUser" element={<CreateUser />} />

            <Route path="/admin/vehicles" element={<Admin_Manage_Vehicles />} />
            <Route path="/admin/relocations" element={<Admin_Manage_Relocations />} />
            <Route path="/admin/createRelocation" element={<Admin_Create_Relocation />} />


            <Route path="/admin/drivers" element={<Admin_Manage_Drivers />} />
            <Route path="/admin/man_powers" element={<Admin_Manage_Man_Powers />} />
            <Route path="/admin/man_powers" element={<Admin_Manage_Man_Powers />} />
            <Route path="/admin/feedbacks" element={<Admin_Manage_Feedbacks />} />
            <Route path="/admin/forecasts" element={<Admin_DemandForecast />} />
            <Route path="/admin/profile/:id" element={<AdminProfile />} />

          </Route>


          {/* user */}

          <Route path="/customer" element={<Customer_Layout />}>
            <Route index element={<UserHome />} />
            <Route path="/customer/vehicles" element={<Customer_VehiclesDisplay />} />
            <Route path="/customer/predict" element={<Customer_Map />} />
            <Route path="/customer/feedbacks" element={<Customer_Manage_Feedbacks />} />

            <Route path="/customer/profile/:id" element={<UserProfile />} />

            <Route path="/customer/relocations" element={<Customer_Manage_Relocations />} />
     
          </Route>



          <Route path="/driver" element={<Driver_Layout />}>
            <Route index element={<Driver_Home />} />
            <Route path="/driver/vehicles" element={<Driver_VehiclesDisplay />} />
            <Route path="/driver/predict" element={<Driver_Map />} />
            <Route path="/driver/feedbacks" element={<Driver_Manage_Feedbacks />} />

            <Route path="/driver/profile" element={<DriverProfile />} />

            <Route path="/driver/relocations" element={<Driver_Manage_Relocations />} />
     
          </Route>


          <Route path="/man_power" element={<Man_Power_Layout />}>
            <Route index element={<Man_Power_Home />} />
            <Route path="/man_power/vehicles" element={<Man_Power_VehiclesDisplay />} />
            <Route path="/man_power/predict" element={<Driver_Map />} />
            <Route path="/man_power/feedbacks" element={<Man_Power_Manage_Feedbacks />} />

            <Route path="/man_power/profile" element={<Man_Power_Profile />} />

            <Route path="/man_power/relocations" element={<Man_Power_Manage_Relocations />} />
     
          </Route>




        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;

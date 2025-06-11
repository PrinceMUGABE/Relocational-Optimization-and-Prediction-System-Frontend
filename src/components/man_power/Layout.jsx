/* eslint-disable no-unused-vars */
import React from 'react';
import { Outlet } from 'react-router-dom';
import DriverHeader from './Header'; // Make sure this path matches your actual file structure

function Man_Power_Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-800 overflow-x-auto">
      <DriverHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}

export default Man_Power_Layout;
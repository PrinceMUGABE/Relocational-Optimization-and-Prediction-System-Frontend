/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import {
  faChartLine,
  faDownload,
  faSearch,
  faCalendarAlt,
  faTruck,
  faExchangeAlt,
  faProjectDiagram,
  faSyncAlt,
  faInfoCircle,
  faMapMarkedAlt,
  faChartPie,
  faArrowUp,
  faArrowDown,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
  Brush,
} from "recharts";
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

function Admin_DemandForecast() {
  const [forecastData, setForecastData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [downloadMenuVisible, setDownloadMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState("forecast"); // forecast, historical, regional
  const [regionalData, setRegionalData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [timeframe, setTimeframe] = useState("monthly");
  const navigate = useNavigate();

  const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#FFD166",
    "#F9F871",
    "#6A0572",
    "#AB83A1",
    "#3A86FF",
    "#8338EC",
  ];
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
    fetchForecastData();
    fetchRegionalData();
  }, [navigate]);

 const fetchForecastData = async () => {
  setLoading(true);
  try {
    // Fetch forecast data
    const res = await axios.get("http://127.0.0.1:8000/demand/forecasts/", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Fetched forecast: ", res.data);

    if (res.data.past_data) {
      // Transform historical data
      const histData = res.data.past_data
        .map((item) => {
          const date = new Date(item.date); // Use item.date instead of item.move_datetime
          return {
            date: date.toLocaleDateString(),
            timestamp: date.getTime(),
            count: item.count,
            month: date.toLocaleString("default", { month: "short" }),
            week: Math.ceil(date.getDate() / 7),
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      setHistoricalData(histData);

      // Process data for comparison chart - use the correct prediction value
      const predictedDemand = res.data.predictions?.monthly_demand || res.data.predicted_demand || 0;
      processComparisonData(histData, predictedDemand);
    }

    // Format forecast data for display - use correct API structure
    const formattedForecasts = res.data.predictions ? [{
      id: res.data.forecast_id || Date.now(),
      predicted_demand: res.data.predictions.monthly_demand || 0, // Fix: use correct path
      forecast_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toLocaleString(),
      accuracy: calculateAccuracy(res.data.predictions.monthly_demand || 0, res.data.past_data || [])
    }] : [];

    setForecastData(formattedForecasts);
    setLoading(false);
  } catch (err) {
    console.error("Error fetching forecast data:", err);
    setMessage("Failed to fetch forecast data. Please try again.");
    setMessageType("error");
    setLoading(false);
  }
};

  const fetchRegionalData = async () => {
    try {
      // Make the actual API call to the backend
      const response = await fetch("http://127.0.0.1:8000/relocation/all/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming you store token in localStorage
          "Content-Type": "application/json",
        },
      });


      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }



      // Parse the response data
      const relocations = await response.json();

      // Process the data to count relocations by region
      // We'll use origin_district as the region
      const regionCounts = {};
      let totalRelocations = 0;

      relocations.forEach((relocation) => {
        const region = relocation.origin_district || "Unknown";

        if (!regionCounts[region]) {
          regionCounts[region] = 0;
        }

        regionCounts[region]++;
        totalRelocations++;
      });

      // Convert the counts to the format expected by your component
      const formattedRegionalData = Object.keys(regionCounts).map((region) => {
        const count = regionCounts[region];
        const percentage = Math.round((count / totalRelocations) * 100);

        return {
          region: region,
          count: count,
          percentage: percentage,
        };
      });

      // Sort by count in descending order
      formattedRegionalData.sort((a, b) => b.count - a.count);

      // Update state with the formatted data
      setRegionalData(formattedRegionalData);
    } catch (error) {
      console.error("Error fetching regional data:", error);
      // You might want to handle the error appropriately here
      // For example, set an error state or display a notification
    }
  };

  const processComparisonData = (histData, predictedDemand) => {
    // Get last 12 months of data
    const lastYearData = [...histData]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 12);

    // Get monthly totals
    const monthlyTotals = lastYearData.reduce((acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = { actual: 0, forecast: 0 };
      }
      acc[item.month].actual += item.count;
      return acc;
    }, {});

    // Add forecast data for next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleString("default", {
      month: "short",
    });
    monthlyTotals[nextMonthName] = { actual: 0, forecast: predictedDemand };

    // Convert to array for chart
    const comparisonArray = Object.keys(monthlyTotals).map((month) => ({
      month,
      actual: monthlyTotals[month].actual,
      forecast: monthlyTotals[month].forecast,
    }));

    setComparisonData(comparisonArray);
  };

  const calculateAccuracy = (predictedDemand, actualDataRaw) => {
  if (!actualDataRaw || !actualDataRaw.length) return null;

  // Convert raw data to the same format as historicalData
  const actualData = actualDataRaw.map((item) => {
    const date = new Date(item.date);
    return {
      date: date.toLocaleDateString(),
      timestamp: date.getTime(),
      count: item.count,
      month: date.toLocaleString("default", { month: "short" }),
    };
  });

  // Get the most recent month's data
  const sortedData = actualData.sort((a, b) => b.timestamp - a.timestamp);
  if (!sortedData.length) return null;

  // Get the latest month
  const latestDate = new Date(sortedData[0].timestamp);
  const latestMonth = latestDate.getMonth();
  const latestYear = latestDate.getFullYear();

  // Sum all relocations from the latest month
  const latestMonthData = sortedData.filter((item) => {
    const itemDate = new Date(item.timestamp);
    return (
      itemDate.getMonth() === latestMonth &&
      itemDate.getFullYear() === latestYear
    );
  });

  const totalActual = latestMonthData.reduce((sum, item) => sum + item.count, 0);
  
  if (totalActual === 0) return null;

  const accuracy = 100 - Math.abs(((totalActual - predictedDemand) / totalActual) * 100);
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10)); // Ensure 0-100 range
};

 const generateNewForecast = async () => {
  setIsGenerating(true);
  try {
    const res = await axios.get("http://127.0.0.1:8000/demand/forecasts/", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.past_data) {
      const histData = res.data.past_data
        .map((item) => {
          const date = new Date(item.date); // Use item.date instead of item.move_datetime
          return {
            date: date.toLocaleDateString(),
            timestamp: date.getTime(),
            count: item.count,
            month: date.toLocaleString("default", { month: "short" }),
            week: Math.ceil(date.getDate() / 7),
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

      setHistoricalData(histData);

      // Process data for comparison chart
      const predictedDemand = res.data.predictions?.monthly_demand || res.data.predicted_demand || 0;
      processComparisonData(histData, predictedDemand);
    }

    // Add the new forecast to the existing forecasts
    const newForecast = {
      id: res.data.forecast_id || Date.now(),
      predicted_demand: res.data.predictions?.monthly_demand || res.data.predicted_demand || 0, // Fix: use correct path
      forecast_date: new Date().toISOString().split("T")[0],
      created_by: { phone_number: "You" },
      created_at: new Date().toLocaleString(),
      accuracy: calculateAccuracy(
        res.data.predictions?.monthly_demand || res.data.predicted_demand || 0, 
        res.data.past_data || []
      ),
    };

    setForecastData((prevForecasts) => [newForecast, ...prevForecasts]);

    setMessage("New demand forecast generated successfully!");
    setMessageType("success");
    setIsGenerating(false);

    // Don't call fetchForecastData again as we already have the new data
  } catch (err) {
    console.error("Error generating forecast:", err);
    setMessage("Failed to generate new forecast. Please try again.");
    setMessageType("error");
    setIsGenerating(false);
  }
};

const getImageBase64 = (imgPath) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => {
      console.warn('Could not load logo image');
      resolve(null);
    };
    img.src = imgPath;
  });
};


const handleDownload = {
  // Helper function to convert image to base64

// Updated PDF download function with logo
PDF: async () => {
  const doc = new jsPDF();
  
  try {
    // Convert logo to base64
    const logoBase64 = await getImageBase64(Logo);
    
    // Add logo if conversion was successful
    if (logoBase64) {
      // Add logo (adjust size and position as needed)
      doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30); // x, y, width, height
      
      // Adjust text positions to accommodate logo
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38); // Red color
      doc.text("RELOCATION MANAGEMENT SYSTEM", 60, 20);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Demand Forecast Report", 60, 30);
      
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 60, 40);
      doc.text(`Report Period: ${new Date().toLocaleDateString()}`, 60, 47);
    } else {
      // Fallback if logo loading fails
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38);
      doc.text("RELOCATION MANAGEMENT SYSTEM", 20, 20);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Demand Forecast Report", 20, 35);
      
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      doc.text(`Report Period: ${new Date().toLocaleDateString()}`, 20, 52);
    }
    
    // Add summary analysis
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Executive Summary", 20, 70);
    
    // Calculate metrics for summary
    const latestPrediction = forecastData.length > 0 ? forecastData[0].predicted_demand : 0;
    const totalHistorical = historicalData.reduce((sum, item) => sum + item.count, 0);
    
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const lastMonthDataPoints = historicalData.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getMonth() === lastMonth &&
        itemDate.getFullYear() === lastMonthYear
      );
    });
    
    const lastMonthTotal = lastMonthDataPoints.reduce((sum, item) => sum + item.count, 0);
    
    const accuracyValues = forecastData
      .filter((item) => item.accuracy !== null && item.accuracy !== undefined)
      .map((item) => item.accuracy);
    const avgAccuracy = accuracyValues.length > 0
      ? (accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length).toFixed(1)
      : "N/A";

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`• Predicted Demand for Next Month: ${latestPrediction} relocations`, 25, 85);
    doc.text(`• Last Month's Actual Relocations: ${lastMonthTotal}`, 25, 92);
    doc.text(`• Total Historical Relocations: ${totalHistorical}`, 25, 99);
    doc.text(`• Average Forecast Accuracy: ${avgAccuracy}%`, 25, 106);
    doc.text(`• Total Forecasts Generated: ${forecastData.length}`, 25, 113);

    // Add some insights based on data
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text("Key Insights", 20, 130);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Generate insights based on data
    const insights = [];
    if (latestPrediction > lastMonthTotal) {
      insights.push(`• Demand is expected to increase by ${((latestPrediction - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)}% next month`);
    } else if (latestPrediction < lastMonthTotal) {
      insights.push(`• Demand is expected to decrease by ${((lastMonthTotal - latestPrediction) / lastMonthTotal * 100).toFixed(1)}% next month`);
    } else {
      insights.push('• Demand is expected to remain stable next month');
    }
    
    if (avgAccuracy !== "N/A" && parseFloat(avgAccuracy) > 85) {
      insights.push('• Forecast accuracy is high, indicating reliable predictions');
    } else if (avgAccuracy !== "N/A" && parseFloat(avgAccuracy) < 70) {
      insights.push('• Forecast accuracy could be improved with more historical data');
    }
    
    insights.forEach((insight, index) => {
      doc.text(insight, 25, 140 + (index * 7));
    });

    // Add forecast table
    if (forecastData.length > 0) {
      const tableData = forecastData.map((item) => [
        new Date(item.forecast_date).toLocaleDateString(),
        item.predicted_demand,
        item.created_by?.phone_number || "System",
        item.accuracy ? `${item.accuracy}%` : "N/A",
      ]);

      doc.autoTable({
        head: [["Forecast Date", "Predicted Demand", "Created By", "Accuracy"]],
        body: tableData,
        startY: 160,
        theme: 'grid',
        headStyles: { 
          fillColor: [220, 38, 38], // Red header
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
    }

    // Add footer with logo on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Add small logo in footer if available
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 20, doc.internal.pageSize.height - 20, 10, 10);
      }
      
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} - Generated by Relocation Management System`, 
        logoBase64 ? 35 : 20, 
        doc.internal.pageSize.height - 10
      );
      
      // Add generation timestamp
      doc.text(
        `Generated: ${new Date().toLocaleString()}`, 
        140, 
        doc.internal.pageSize.height - 10
      );
    }

    doc.save("demand_forecast_report.pdf");
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Fallback PDF generation without logo
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38);
    doc.text("RELOCATION MANAGEMENT SYSTEM", 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Demand Forecast Report", 20, 35);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Add basic table
    if (forecastData.length > 0) {
      const tableData = forecastData.map((item) => [
        new Date(item.forecast_date).toLocaleDateString(),
        item.predicted_demand,
        item.created_by?.phone_number || "System",
        item.accuracy ? `${item.accuracy}%` : "N/A",
      ]);

      doc.autoTable({
        head: [["Forecast Date", "Predicted Demand", "Created By", "Accuracy"]],
        body: tableData,
        startY: 60,
      });
    }
    
    doc.save("demand_forecast_report.pdf");
  }
},

  Excel: () => {
    const workbook = XLSX.utils.book_new();
    
    // Create summary sheet
    const latestPrediction = forecastData.length > 0 ? forecastData[0].predicted_demand : 0;
    const totalHistorical = historicalData.reduce((sum, item) => sum + item.count, 0);
    
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const lastMonthDataPoints = historicalData.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getMonth() === lastMonth &&
        itemDate.getFullYear() === lastMonthYear
      );
    });
    
    const lastMonthTotal = lastMonthDataPoints.reduce((sum, item) => sum + item.count, 0);
    
    const accuracyValues = forecastData
      .filter((item) => item.accuracy !== null && item.accuracy !== undefined)
      .map((item) => item.accuracy);
    const avgAccuracy = accuracyValues.length > 0
      ? (accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length).toFixed(1)
      : "N/A";

    const summaryData = [
      { Metric: "Report Generated", Value: new Date().toLocaleDateString() },
      { Metric: "Predicted Demand (Next Month)", Value: latestPrediction },
      { Metric: "Last Month Relocations", Value: lastMonthTotal },
      { Metric: "Total Historical Relocations", Value: totalHistorical },
      { Metric: "Average Forecast Accuracy", Value: avgAccuracy + "%" },
      { Metric: "Total Forecasts Generated", Value: forecastData.length },
    ];

    // Create forecast data sheet
    const wsData = forecastData.map((item) => ({
      "Forecast Date": new Date(item.forecast_date).toLocaleDateString(),
      "Predicted Demand": item.predicted_demand,
      "Created By": item.created_by?.phone_number || "System",
      "Accuracy": item.accuracy ? `${item.accuracy}%` : "N/A",
      "Creation Time": item.created_at || "N/A",
    }));

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryData), "Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(wsData), "Demand Forecasts");
    
    // Add historical data sheet
    const historicalSheetData = historicalData.map((item) => ({
      "Date": item.date,
      "Relocations": item.count,
      "Month": item.month,
      "Week": item.week,
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(historicalSheetData), "Historical Data");

    XLSX.writeFile(workbook, "demand_forecast_comprehensive_report.xlsx");
  },

  CSV: () => {
    // Calculate summary metrics
    const latestPrediction = forecastData.length > 0 ? forecastData[0].predicted_demand : 0;
    const totalHistorical = historicalData.reduce((sum, item) => sum + item.count, 0);
    
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const lastMonthDataPoints = historicalData.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getMonth() === lastMonth &&
        itemDate.getFullYear() === lastMonthYear
      );
    });
    
    const lastMonthTotal = lastMonthDataPoints.reduce((sum, item) => sum + item.count, 0);
    
    const accuracyValues = forecastData
      .filter((item) => item.accuracy !== null && item.accuracy !== undefined)
      .map((item) => item.accuracy);
    const avgAccuracy = accuracyValues.length > 0
      ? (accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length).toFixed(1)
      : "N/A";

    // Create comprehensive CSV with summary at top
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header and summary
    csvContent += "RELOCATION MANAGEMENT SYSTEM - DEMAND FORECAST REPORT\n";
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += "EXECUTIVE SUMMARY\n";
    csvContent += `Predicted Demand (Next Month),${latestPrediction}\n`;
    csvContent += `Last Month Relocations,${lastMonthTotal}\n`;
    csvContent += `Total Historical Relocations,${totalHistorical}\n`;
    csvContent += `Average Forecast Accuracy,${avgAccuracy}%\n`;
    csvContent += `Total Forecasts Generated,${forecastData.length}\n\n`;
    
    // Add forecast data
    csvContent += "FORECAST HISTORY\n";
    csvContent += "Forecast Date,Predicted Demand,Created By,Accuracy,Creation Time\n";
    
    forecastData.forEach((item) => {
      csvContent += `${new Date(item.forecast_date).toLocaleDateString()},${item.predicted_demand},${item.created_by?.phone_number || "System"},${item.accuracy ? item.accuracy + "%" : "N/A"},${item.created_at || "N/A"}\n`;
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "demand_forecast_comprehensive_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

 const renderMetricsCards = () => {
  // Calculate key metrics with better logic
  const latestPrediction = forecastData.length > 0 ? forecastData[0].predicted_demand : 0;
  const totalHistorical = historicalData.reduce((sum, item) => sum + item.count, 0);

  // Fix last month calculation
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1; // Handle January edge case
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const lastMonthDataPoints = historicalData.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getMonth() === lastMonth &&
      itemDate.getFullYear() === lastMonthYear
    );
  });

  const lastMonthTotal = lastMonthDataPoints.reduce((sum, item) => sum + item.count, 0);

  // Fix two months ago calculation
  const twoMonthsAgo = lastMonth === 0 ? 11 : lastMonth - 1;
  const twoMonthsAgoYear = lastMonth === 0 ? lastMonthYear - 1 : lastMonthYear;

  const twoMonthsAgoDataPoints = historicalData.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getMonth() === twoMonthsAgo &&
      itemDate.getFullYear() === twoMonthsAgoYear
    );
  });

  const twoMonthsAgoTotal = twoMonthsAgoDataPoints.reduce((sum, item) => sum + item.count, 0);

  // Calculate growth rate
  const growthRate = twoMonthsAgoTotal > 0
    ? ((lastMonthTotal - twoMonthsAgoTotal) / twoMonthsAgoTotal * 100).toFixed(1)
    : 0;

  // Average accuracy of forecasts
  const accuracyValues = forecastData
    .filter((item) => item.accuracy !== null && item.accuracy !== undefined)
    .map((item) => item.accuracy);

  const avgAccuracy = accuracyValues.length > 0
    ? (accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length).toFixed(1)
    : "N/A";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-gray-700 text-center">
        <div className="flex items-center justify-center text-red-400 mb-2 text-3xl">
          <FontAwesomeIcon icon={faChartLine} />
        </div>
        <p className="text-gray-400 text-sm mb-1">Predicted Demand</p>
        <h3 className="text-white text-2xl font-bold">{latestPrediction}</h3>
        <p className="text-gray-400 text-xs mt-1">Relocations next month</p>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-gray-700 text-center">
        <div className="flex items-center justify-center text-blue-400 mb-2 text-3xl">
          <FontAwesomeIcon icon={faTruck} />
        </div>
        <p className="text-gray-400 text-sm mb-1">Last Month</p>
        <h3 className="text-white text-2xl font-bold flex items-center justify-center">
          {lastMonthTotal}
          {growthRate > 0 ? (
            <span className="ml-2 text-green-400 text-sm flex items-center">
              <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
              {growthRate}%
            </span>
          ) : growthRate < 0 ? (
            <span className="ml-2 text-red-400 text-sm flex items-center">
              <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
              {Math.abs(growthRate)}%
            </span>
          ) : null}
        </h3>
        <p className="text-gray-400 text-xs mt-1">Compared to previous month</p>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-gray-700 text-center">
        <div className="flex items-center justify-center text-green-400 mb-2 text-3xl">
          <FontAwesomeIcon icon={faProjectDiagram} />
        </div>
        <p className="text-gray-400 text-sm mb-1">Forecast Accuracy</p>
        <h3 className="text-white text-2xl font-bold">
          {avgAccuracy !== "N/A" ? avgAccuracy + "%" : "N/A"}
        </h3>
        <p className="text-gray-400 text-xs mt-1">Average of all forecasts</p>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-gray-700 text-center">
        <div className="flex items-center justify-center text-yellow-400 mb-2 text-3xl">
          <FontAwesomeIcon icon={faCalendarAlt} />
        </div>
        <p className="text-gray-400 text-sm mb-1">Total Relocations</p>
        <h3 className="text-white text-2xl font-bold">{totalHistorical}</h3>
        <p className="text-gray-400 text-xs mt-1">All-time completed moves</p>
      </div>
    </div>
  );
};

  const renderTabs = () => {
    return (
      <div className="flex space-x-1 mb-6 bg-gray-900 p-1 rounded-lg border border-gray-700">
        <button
          onClick={() => setCurrentView("forecast")}
          className={`flex-1 py-2 px-4 rounded-md text-center transition ${currentView === "forecast"
            ? "bg-red-600 text-white"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
        >
          <FontAwesomeIcon icon={faChartLine} className="mr-2" />
          Forecast Analysis
        </button>
        <button
          onClick={() => setCurrentView("historical")}
          className={`flex-1 py-2 px-4 rounded-md text-center transition ${currentView === "historical"
            ? "bg-red-600 text-white"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
        >
          <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
          Historical Trends
        </button>
        <button
          onClick={() => setCurrentView("regional")}
          className={`flex-1 py-2 px-4 rounded-md text-center transition ${currentView === "regional"
            ? "bg-red-600 text-white"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
        >
          <FontAwesomeIcon icon={faMapMarkedAlt} className="mr-2" />
          Regional Analysis
        </button>
      </div>
    );
  };

  const renderForecastView = () => {
    if (loading) {
      return (
        <div className="w-full space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-72 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </div>
      );
    }

    if (!historicalData.length && !forecastData.length) {
      return (
        <div className="w-full space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-72 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FontAwesomeIcon icon={faInfoCircle} className="text-3xl mb-3" />
              <p>
                No forecast data available yet. Generate your first forecast.
              </p>
              <button
                onClick={generateNewForecast}
                disabled={isGenerating}
                className="mt-4 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
              >
                Generate Forecast
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Combine historical and forecast data for trend analysis
    const combinedData = [];

    // Add historical data
    historicalData.forEach((item) => {
      combinedData.push({
        date: item.date,
        actual: item.count,
        forecast: null,
      });
    });

    // Add the latest forecast as a projection
    if (forecastData.length > 0) {
      const latestForecast = forecastData[0];
      const forecastDate = new Date(latestForecast.forecast_date);

      // Add 4 weeks projection
      for (let i = 1; i <= 4; i++) {
        const projDate = new Date(forecastDate);
        projDate.setDate(projDate.getDate() + i * 7);

        combinedData.push({
          date: projDate.toLocaleDateString(),
          actual: null,
          forecast: latestForecast.predicted_demand / 4, // Divide by 4 to show weekly distribution
        });
      }
    }

    // Sort by date
    combinedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <h3 className="text-sm font-semibold mb-4 text-red-400 flex items-center">
              <FontAwesomeIcon icon={faChartLine} className="mr-2" />
              Demand Trend & Forecast
            </h3>
            <ResponsiveContainer>
              <ComposedChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  padding={{ left: 20, right: 20 }}
                  tick={{ fontSize: 10, fill: "#e5e7eb" }}
                  interval="preserveEnd"
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
                  formatter={(value) => (value ? [value, ""] : ["N/A", ""])}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ color: "#e5e7eb" }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual Demand"
                  stroke="#FF6B6B"
                  fill="#FF6B6B"
                  fillOpacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  strokeDasharray="5 5"
                />
                <Brush dataKey="date" height={30} stroke="#8884d8" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <h3 className="text-sm font-semibold mb-4 text-blue-400 flex items-center">
              <FontAwesomeIcon icon={faChartPie} className="mr-2" />
              Forecast vs. Actual Comparison
            </h3>
            <ResponsiveContainer>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#e5e7eb" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#e5e7eb" }} />
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
                <Bar dataKey="actual" name="Actual Demand" fill="#FF6B6B" />
                <Bar dataKey="forecast" name="Forecast" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>
      </div>
    );
  };

  // Completing the renderHistoricalView function
  const renderHistoricalView = () => {
    if (loading || !historicalData.length) {
      return (
        <div className="w-full space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-72 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </div>
      );
    }

    // Group data by month and week
    const monthlyData = {};
    const weeklyData = {};

    historicalData.forEach((item) => {
      // For monthly data
      if (!monthlyData[item.month]) {
        monthlyData[item.month] = 0;
      }
      monthlyData[item.month] += item.count;

      // For weekly data
      const weekKey = `${item.month}-W${item.week}`;
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = 0;
      }
      weeklyData[weekKey] += item.count;
    });

    // Convert to arrays for charts
    const monthlyChartData = Object.keys(monthlyData).map((month) => ({
      month,
      count: monthlyData[month],
    }));

    const weeklyChartData = Object.keys(weeklyData)
  .map((week) => ({
    week,
    count: weeklyData[week],
  }))
  .sort((a, b) => {
    // Extract month and week for proper sorting
    const [monthA, weekNumA] = a.week.split('-W');
    const [monthB, weekNumB] = b.week.split('-W');

    // Map month abbreviations to numbers
    const months = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };

    // Sort first by month, then by week
    if (months[monthA] !== months[monthB]) {
      return months[monthA] - months[monthB];
    }
    return parseInt(weekNumA) - parseInt(weekNumB);
  });

    // Calculate month-over-month growth
    const growthData = [];
    const months = Object.keys(monthlyData).sort();

    for (let i = 1; i < months.length; i++) {
      const prevMonth = months[i - 1];
      const currMonth = months[i];
      const prevCount = monthlyData[prevMonth];
      const currCount = monthlyData[currMonth];

      const growthRate =
        prevCount > 0 ? ((currCount - prevCount) / prevCount) * 100 : 0;

      growthData.push({
        month: currMonth,
        growth: growthRate,
      });
    }

    // Time distribution by day of week
    const dayOfWeekData = historicalData.reduce((acc, item) => {
      const date = new Date(item.date);
      const day = date.toLocaleString("default", { weekday: "short" });

      if (!acc[day]) {
        acc[day] = 0;
      }
      acc[day] += item.count;

      return acc;
    }, {});

    const dayOfWeekChartData = Object.keys(dayOfWeekData).map((day) => ({
      day,
      count: dayOfWeekData[day],
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-red-400 flex items-center">
                <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                Monthly Trend Analysis
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeframe("monthly")}
                  className={`px-3 py-1 rounded text-xs ${timeframe === "monthly"
                    ? "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTimeframe("weekly")}
                  className={`px-3 py-1 rounded text-xs ${timeframe === "weekly"
                    ? "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <ResponsiveContainer>
              {timeframe === "monthly" ? (
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#e5e7eb" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#e5e7eb" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      borderColor: "#374151",
                      color: "#f9fafb",
                    }}
                  />
                  <Bar dataKey="count" name="Relocations" fill="#FF6B6B" />
                </BarChart>
              ) : (
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: "#e5e7eb" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#e5e7eb" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      borderColor: "#374151",
                      color: "#f9fafb",
                    }}
                  />
                  <Bar dataKey="count" name="Relocations" fill="#4ECDC4" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <h3 className="text-sm font-semibold mb-4 text-blue-400 flex items-center">
              <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
              Month-over-Month Growth
            </h3>
            <ResponsiveContainer>
              <ComposedChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#e5e7eb" }}
                  label={{
                    value: "Growth %",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#e5e7eb",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                  }}
                />
                <Bar dataKey="growth" name="Growth %" fill="#FFD166">
                  {growthData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.growth >= 0 ? "#4ECDC4" : "#FF6B6B"}
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="growth"
                  stroke="#F9F871"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <h3 className="text-sm font-semibold mb-4 text-green-400 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
              Day of Week Distribution
            </h3>
            <ResponsiveContainer>
              <BarChart data={dayOfWeekChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#e5e7eb" }} />
                <YAxis tick={{ fontSize: 12, fill: "#e5e7eb" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                  }}
                />
                <Bar dataKey="count" name="Relocations" fill="#6A0572" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <h3 className="text-sm font-semibold mb-4 text-yellow-400 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
              Historical Data Summary
            </h3>
            <div className="overflow-y-auto h-64 scrollbar-thin">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Relocations
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {historicalData
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                        }
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                          {item.date}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                          {item.count}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </ErrorBoundary>
      </div>
    );
  };

  // Adding the missing renderRegionalView function
  const renderRegionalView = () => {
    if (loading || !regionalData.length) {
      return (
        <div className="w-full space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-72 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </div>
      );
    }

    // Calculate total for percentage display
    const totalRelocations = regionalData.reduce(
      (sum, region) => sum + region.count,
      0
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <h3 className="text-sm font-semibold mb-4 text-red-400 flex items-center">
              <FontAwesomeIcon icon={faMapMarkedAlt} className="mr-2" />
              Regional Distribution
            </h3>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={regionalData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="region"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {regionalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload.region,
                  ]}
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
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 h-80">
            <h3 className="text-sm font-semibold mb-4 text-blue-400 flex items-center">
              <FontAwesomeIcon icon={faChartBar} className="mr-2" />
              Regional Comparison
            </h3>
            <ResponsiveContainer>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="region"
                  tick={{ fontSize: 12, fill: "#e5e7eb" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#e5e7eb" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                  }}
                />
                <Bar dataKey="count" name="Relocations" fill="#4ECDC4">
                  {regionalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800 col-span-1 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4 text-green-400 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
              Regional Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Region
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Relocations
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Percentage
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Distribution
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {regionalData.map((region, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                        {region.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {region.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {region.percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${region.percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ErrorBoundary>
      </div>
    );
  };



  // Main component return statement
  return (
    <div className="p-6 bg-gray-800 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Demand Forecast
          </h1>
          <p className="text-gray-400">
            Analyze relocation demand patterns and predictions
          </p>
        </div>

        <div className="flex mt-4 md:mt-0 space-x-2">
          <button
            onClick={generateNewForecast}
            disabled={isGenerating}
            className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
            )}
            Generate Forecast
          </button>

          <div className="relative">
            <button
              onClick={() => setDownloadMenuVisible(!downloadMenuVisible)}
              className="py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200 flex items-center"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export
            </button>

            {downloadMenuVisible && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10">
                <ul className="py-1">
                  <li
                    onClick={() => {
                      handleDownload.PDF();
                      setDownloadMenuVisible(false);
                    }}
                    className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                  >
                    Export as PDF
                  </li>
                  <li
                    onClick={() => {
                      handleDownload.Excel();
                      setDownloadMenuVisible(false);
                    }}
                    className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                  >
                    Export as Excel
                  </li>
                  <li
                    onClick={() => {
                      handleDownload.CSV();
                      setDownloadMenuVisible(false);
                    }}
                    className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                  >
                    Export as CSV
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-xs">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
          </div>
          <input
            type="text"
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Search forecasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md ${messageType === "success"
            ? "bg-green-900 text-green-200"
            : "bg-red-900 text-red-200"
            }`}
        >
          {message}
        </div>
      )}

      {renderMetricsCards()}

      {renderTabs()}

      {currentView === "forecast" && renderForecastView()}
      {currentView === "historical" && renderHistoricalView()}
      {currentView === "regional" && renderRegionalView()}



      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
        {/* <h3 className="text-xl font-semibold mb-4 text-white">
          Demand Forecast History
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Forecast Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Predicted Demand
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Created By
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Accuracy
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Creation Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {forecastData
                .filter(
                  (item) =>
                    item.forecast_date.includes(searchQuery) ||
                    item.predicted_demand.toString().includes(searchQuery) ||
                    (item.created_by?.phone_number &&
                      item.created_by.phone_number.includes(searchQuery))
                )
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((forecast, index) => (
                  <tr
                    key={forecast.id || index}
                    className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                      {forecast.forecast_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {forecast.predicted_demand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {forecast.created_by?.phone_number || "System"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {forecast.accuracy !== null ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            forecast.accuracy > 90
                              ? "bg-green-900 text-green-200"
                              : forecast.accuracy > 80
                              ? "bg-blue-900 text-blue-200"
                              : forecast.accuracy > 70
                              ? "bg-yellow-900 text-yellow-200"
                              : "bg-red-900 text-red-200"
                          }`}
                        >
                          {forecast.accuracy}%
                        </span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {forecast.created_at || "N/A"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div> */}

        {/* Pagination */}
        {/* <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing{" "}
            {Math.min(
              (currentPage - 1) * itemsPerPage + 1,
              forecastData.length
            )}{" "}
            to {Math.min(currentPage * itemsPerPage, forecastData.length)} of{" "}
            {forecastData.length} forecasts
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              Previous
            </button>

            <span className="text-gray-400">
              Page {currentPage} of{" "}
              {Math.ceil(forecastData.length / itemsPerPage)}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(forecastData.length / itemsPerPage)
                  )
                )
              }
              disabled={
                currentPage >= Math.ceil(forecastData.length / itemsPerPage)
              }
              className={`px-3 py-1 rounded ${
                currentPage >= Math.ceil(forecastData.length / itemsPerPage)
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              Next
            </button>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Admin_DemandForecast;

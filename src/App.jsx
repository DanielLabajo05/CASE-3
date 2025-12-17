import React, { useState, useEffect } from "react";
import * as tf from '@tensorflow/tfjs';
import GenderComparisonChart from './services/charts/GenderComparisonChart';
import StackedBarChart from './services/charts/StackedBarChart';
import TotalEmigrantsLineChart from './services/charts/LineChart';
import AgeDistributionHistogram from './services/charts/AgeDistributionHistogram';
import GeographicChoroplethMap from './services/charts/GeographicWorldMap';
import OccupationEducationScatterPlot from './services/charts/ScatterPlot';
import ForecastingComponent from './services/charts/ForecastingComponent';
import CSVUpload from './services/components/CSVupload';

import { 
  getEmigrantsByGender, 
  bulkAddEmigrants,
  deleteEmigrantByGender 
} from './services/emigrantGenderServices';
import { 
  getEmigrantsByEducation, 
  bulkAddEducationEmigrants,
  deleteEmigrantByEducation 
} from './services/emigrantEducationServices';
import { 
  getEmigrantsByTotal, 
  bulkAddTotalEmigrants,
  deleteEmigrantByTotal 
} from './services/emigrantTotalServices';
import { 
  getEmigrantsByAge, 
  bulkAddAgeEmigrants,
  deleteEmigrantByAge 
} from './services/emigrantAgeServices';
import { 
  getEmigrantsByGeography, 
  bulkAddGeographicEmigrants,
  deleteEmigrantByGeography 
} from './services/emigrantGeographicServices';
import { 
  getEmigrantsByOccupation, 
  bulkAddOccupationEmigrants,
  deleteEmigrantByOccupation 
} from './services/emigrantScatterServices';

// Make TensorFlow available globally
window.tf = tf;

function App() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing data from Firebase on mount
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setInitialLoading(true);
      console.log("Starting to load data from Firebase...");
      
      // Load gender data
      console.log("Loading gender data...");
      const genderData = await getEmigrantsByGender();
      console.log("Gender data loaded:", genderData.length, "records");
      if (genderData.length > 0) {
        const genderChart = {
          id: 'firebase-gender-' + Date.now(),
          type: 'gender',
          data: genderData,
          isFromFirebase: true,
          createdAt: new Date()
        };
        setCharts(prev => [...prev, genderChart]);
      }

      // Load education data
      console.log("Loading education data...");
      const educationData = await getEmigrantsByEducation();
      console.log("Education data loaded:", educationData.length, "records");
      if (educationData.length > 0) {
        const educationChart = {
          id: 'firebase-education-' + Date.now(),
          type: 'education',
          data: educationData,
          isFromFirebase: true,
          createdAt: new Date()
        };
        setCharts(prev => [...prev, educationChart]);
      }

      // Load total data
      const totalData = await getEmigrantsByTotal();
      if (totalData.length > 0) {
        const totalChart = {
          id: 'firebase-total-' + Date.now(),
          type: 'total',
          data: totalData,
          isFromFirebase: true,
          createdAt: new Date()
        };
        setCharts(prev => [...prev, totalChart]);
      }

      // Load age distribution data
      const ageData = await getEmigrantsByAge();
      if (ageData.length > 0) {
        const ageChart = {
          id: 'firebase-age-' + Date.now(),
          type: 'age',
          data: ageData,
          isFromFirebase: true,
          createdAt: new Date()
        };
        setCharts(prev => [...prev, ageChart]);
      }

      // Load geographic data
      const geoData = await getEmigrantsByGeography();
      if (geoData.length > 0) {
        const geoChart = {
          id: 'firebase-geo-' + Date.now(),
          type: 'geographic',
          data: geoData,
          isFromFirebase: true,
          createdAt: new Date()
        };
        setCharts(prev => [...prev, geoChart]);
      }

      // Load occupation data
      const occupationData = await getEmigrantsByOccupation();
      console.log("Occupation data loaded:", occupationData.length, "records");
      console.log("Sample occupation data:", occupationData.slice(0, 2));
      if (occupationData.length > 0) {
        const occupationChart = {
          id: 'firebase-occupation-' + Date.now(),
          type: 'occupation',
          data: occupationData,
          isFromFirebase: true,
          createdAt: new Date()
        };
        setCharts(prev => [...prev, occupationChart]);
      }

      // Load forecast chart (uses total historical data for training)
      console.log("Preparing forecast chart with total historical data...");
      if (totalData.length > 0) {
        const forecastChart = {
          id: 'firebase-forecast-' + Date.now(),
          type: 'forecast',
          data: totalData, // ✅ Use historical total data, not forecast data
          isFromFirebase: true,
          createdAt: new Date()
        };
        setCharts(prev => [...prev, forecastChart]);
      }

      // Hide upload if we have data
      if (genderData.length > 0 || educationData.length > 0 || totalData.length > 0 || ageData.length > 0 || geoData.length > 0 || occupationData.length > 0) {
        setShowUpload(false);
      }
    } catch (err) {
      console.error("Error loading data from Firebase:", err);
      setError("Failed to load existing data: " + err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCSVUpload = async (data, chartType) => {
    try {
      setLoading(true);
      setError(null);

      console.log("=== CSV UPLOAD DEBUG ===");
      console.log("Chart type:", chartType);
      console.log("Data array length:", Array.isArray(data) ? data.length : "Not an array");
      console.log("First 3 data items:", data.slice(0, 3));

      // Validate data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("No data to upload. Please check your CSV file.");
      }

      // Save to Firebase based on chart type
      try {
        if (chartType === 'gender') {
          const result = await bulkAddEmigrants(data);
          console.log(`Successfully saved ${result.count} gender records to Firebase`);
        } else if (chartType === 'education') {
          const result = await bulkAddEducationEmigrants(data);
          console.log(`Successfully saved ${result.count} education records to Firebase`);
        } else if (chartType === 'total') {
          const result = await bulkAddTotalEmigrants(data);
          console.log(`Successfully saved ${result.count} total records to Firebase`);
        } else if (chartType === 'age') {
          const result = await bulkAddAgeEmigrants(data);
          console.log(`Successfully saved ${result.count} age distribution records to Firebase`);
        } else if (chartType === 'geographic') {
          const result = await bulkAddGeographicEmigrants(data);
          console.log(`Successfully saved ${result.count} geographic records to Firebase`);
        } else if (chartType === 'occupation' || chartType === 'occupation-education') {
          console.log("Saving occupation data to Firebase...");
          console.log("Sample data being saved:", data[0]);
          const result = await bulkAddOccupationEmigrants(data);
          console.log(`Successfully saved ${result.count} occupation records to Firebase`);
        }
        // Note: 'forecast' type is not saved separately - it uses historical total data
      } catch (firebaseError) {
        console.error("Firebase save error:", firebaseError);
        console.error("Error code:", firebaseError.code);
        console.error("Error message:", firebaseError.message);
        throw new Error(`Firebase Error: ${firebaseError.message}`);
      }

      // Create new chart object
      const newChart = {
        id: 'chart-' + Date.now(),
        type: chartType,
        data: data,
        isFromFirebase: false,
        createdAt: new Date()
      };

      console.log("New chart created:", {
        id: newChart.id,
        type: newChart.type,
        dataLength: newChart.data.length
      });

      // Add to charts array
      setCharts(prevCharts => {
        const updated = [...prevCharts, newChart];
        console.log("Charts array updated. Total charts:", updated.length);
        return updated;
      });
      
      setShowUpload(false);
      alert(`✅ Chart added and saved to Firebase!\nChart type: ${chartType}\nData points: ${data.length}\nTotal charts: ${charts.length + 1}`);
    } catch (err) {
      console.error("Error adding chart:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      setError("Failed to add chart: " + err.message);
      alert("❌ Error adding chart: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChart = async (chartId) => {
    if (!window.confirm("Remove this chart? This will also delete the data from Firebase.")) {
      return;
    }

    try {
      setLoading(true);
      
      const chartToRemove = charts.find(chart => chart.id === chartId);
      
      if (chartToRemove && chartToRemove.data) {
        const deletePromises = chartToRemove.data.map(record => {
          if (chartToRemove.type === 'gender') {
            return deleteEmigrantByGender(record.id);
          } else if (chartToRemove.type === 'education') {
            return deleteEmigrantByEducation(record.id);
          } else if (chartToRemove.type === 'total') {
            return deleteEmigrantByTotal(record.id);
          } else if (chartToRemove.type === 'age') {
            return deleteEmigrantByAge(record.id);
          } else if (chartToRemove.type === 'geographic') {
            return deleteEmigrantByGeography(record.id);
          } else if (chartToRemove.type === 'occupation' || chartToRemove.type === 'occupation-education') {
            return deleteEmigrantByOccupation(record.id);
          } else if (chartToRemove.type === 'forecast') {
            // Don't delete historical data when removing forecast chart
            return Promise.resolve();
          }
          return Promise.resolve();
        });

        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} records from Firebase`);
      }

      setCharts(prevCharts => prevCharts.filter(chart => chart.id !== chartId));
      
      alert("✅ Chart and data removed successfully!");
    } catch (err) {
      console.error("Error removing chart:", err);
      alert("❌ Error removing chart: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("⚠️ WARNING: Remove ALL charts and delete ALL data from Firebase? This cannot be undone!")) {
      return;
    }

    try {
      setLoading(true);

      for (const chart of charts) {
        if (chart.data) {
          const deletePromises = chart.data.map(record => {
            if (chart.type === 'gender') {
              return deleteEmigrantByGender(record.id);
            } else if (chart.type === 'education') {
              return deleteEmigrantByEducation(record.id);
            } else if (chart.type === 'total') {
              return deleteEmigrantByTotal(record.id);
            } else if (chart.type === 'age') {
              return deleteEmigrantByAge(record.id);
            } else if (chart.type === 'geographic') {
              return deleteEmigrantByGeography(record.id);
            } else if (chart.type === 'occupation' || chart.type === 'occupation-education') {
              return deleteEmigrantByOccupation(record.id);
            } else if (chart.type === 'forecast') {
              // Don't delete historical data when clearing forecast chart
              return Promise.resolve();
            }
            return Promise.resolve();
          });
          await Promise.all(deletePromises);
        }
      }

      setCharts([]);
      setShowUpload(true);
      alert("✅ All charts and data cleared successfully!");
    } catch (err) {
      console.error("Error clearing all:", err);
      alert("❌ Error clearing data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    setShowUpload(true);
  };

  if (initialLoading) {
    return (
      <div style={{ 
        padding: 40, 
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
          <h2>Loading data from Firebase...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 40, 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: 1600, 
      margin: '0 auto',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: 30, 
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20
        }}>
          <div>
            <h1 style={{ color: '#333', marginBottom: 10 }}>
              Filipino Emigrants Dashboard
            </h1>
            <p style={{ color: '#666', marginBottom: 5 }}>
              Upload CSV files to create multiple visualization charts
            </p>
            <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
              <p style={{ color: '#999', fontSize: 14, marginBottom: 0 }}>
                ☁️ Data is automatically saved to Firebase Cloud Storage
              </p>
            </div>
          </div>
          {charts.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#999' : '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Processing...' : 'Clear All Charts'}
            </button>
          )}
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: 15, 
            borderRadius: 5, 
            marginBottom: 20,
            border: '1px solid #ef5350'
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            color: '#1976d2', 
            padding: 15, 
            borderRadius: 5, 
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 20,
              height: 20,
              border: '3px solid #1976d2',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Syncing with Firebase...
          </div>
        )}

        {showUpload && (
          <CSVUpload onUploadComplete={handleCSVUpload} />
        )}

        {!showUpload && charts.length > 0 && (
          <div style={{
            marginBottom: 30,
            padding: 15,
            backgroundColor: '#e8f5e9',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong style={{ color: '#2e7d32' }}>
                {charts.length} chart{charts.length !== 1 ? 's' : ''} active
              </strong>
              <p style={{ margin: '5px 0 0 0', fontSize: 14, color: '#558b2f' }}>
                Add more charts to compare different datasets
              </p>
            </div>
            <button
              onClick={handleAddAnother}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#999' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              + Add Another Chart
            </button>
          </div>
        )}

        {charts.length === 0 && !showUpload && (
          <div style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            marginTop: 20
          }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
            <h3 style={{ color: '#666', marginBottom: 10 }}>No Charts Yet</h3>
            <p style={{ color: '#999', marginBottom: 20 }}>
              Upload a CSV file to create your first visualization
            </p>
            <button
              onClick={handleAddAnother}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 'bold'
              }}
            >
              Upload CSV File
            </button>
          </div>
        )}

        {/* Render all charts */}
        <div style={{ marginTop: 20 }}>
          {charts.map((chart) => {
            console.log("Rendering chart:", chart.id, "Type:", chart.type, "Data length:", chart.data?.length);
            
            return (
              <div key={chart.id} style={{ marginBottom: 30 }}>
                {chart.type === 'gender' ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 20
                    }}>
                      <div>
                        <h2 style={{ margin: 0, color: '#333' }}>
                          Gender Comparison Chart
                        </h2>
                        {chart.isFromFirebase && (
                          <span style={{ 
                            fontSize: 12, 
                            color: '#666',
                            display: 'inline-block',
                            marginTop: 5
                          }}>
                            ☁️ Loaded from Firebase
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveChart(chart.id)}
                        disabled={loading}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: loading ? '#999' : '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: 13
                        }}
                      >
                        Remove Chart
                      </button>
                    </div>
                    <GenderComparisonChart data={chart.data} />
                  </div>
                ) : chart.type === 'education' ? (
                  <div style={{ position: 'relative' }}>
                    {chart.isFromFirebase && (
                      <div style={{ 
                        position: 'absolute',
                        top: 50,
                        right: 150,
                        fontSize: 12,
                        color: '#666',
                        zIndex: 10
                      }}>
                        ☁️ Loaded from Firebase
                      </div>
                    )}
                    <StackedBarChart 
                      data={chart.data} 
                      onRemove={handleRemoveChart}
                      chartId={chart.id}
                    />
                  </div>
                ) : chart.type === 'occupation' || chart.type === 'occupation-education' ? (
                  <div style={{ position: 'relative' }}>
                    {chart.isFromFirebase && (
                      <div style={{ 
                        position: 'absolute',
                        top: 10,
                        right: 150,
                        fontSize: 12,
                        color: '#666',
                        zIndex: 10
                      }}>
                        ☁️ Loaded from Firebase
                      </div>
                    )}
                    <OccupationEducationScatterPlot 
                      data={chart.data} 
                      onRemove={handleRemoveChart}
                      chartId={chart.id}
                    />
                  </div>
                ) : chart.type === 'total' ? (
                  <div style={{ position: 'relative' }}>
                    {chart.isFromFirebase && (
                      <div style={{ 
                        position: 'absolute',
                        top: 30,
                        right: 150,
                        fontSize: 12,
                        color: '#666',
                        zIndex: 10,
                        backgroundColor: 'white',
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px solid #e0e0e0'
                      }}>
                        ☁️ Loaded from Firebase
                      </div>
                    )}
                    <TotalEmigrantsLineChart 
                      data={chart.data} 
                      onRemove={handleRemoveChart}
                      chartId={chart.id}
                    />
                  </div>
                ) : chart.type === 'age' ? (
                  <div style={{ position: 'relative' }}>
                    {chart.isFromFirebase && (
                      <div style={{ 
                        position: 'absolute',
                        top: 10,
                        right: 150,
                        fontSize: 12,
                        color: '#666',
                        zIndex: 10
                      }}>
                        ☁️ Loaded from Firebase
                      </div>
                    )}
                    <AgeDistributionHistogram 
                      data={chart.data} 
                      onRemove={handleRemoveChart}
                      chartId={chart.id}
                    />
                  </div>
                ) : chart.type === 'geographic' ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 15
                    }}>
                      <div>
                        {chart.isFromFirebase && (
                          <span style={{ 
                            fontSize: 12,
                            color: '#666',
                            display: 'block',
                            marginBottom: 5
                          }}>
                            ☁️ Loaded from Firebase
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveChart(chart.id)}
                        disabled={loading}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: loading ? '#999' : '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 'bold'
                        }}
                      >
                        Remove Chart
                      </button>
                    </div>
                    <GeographicChoroplethMap 
                      data={chart.data} 
                      onRemove={handleRemoveChart}
                      chartId={chart.id}
                    />
                  </div>
                ) : chart.type === 'forecast' ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                    {chart.isFromFirebase && (
                      <div style={{ 
                        fontSize: 12,
                        color: '#666',
                        marginBottom: 10
                      }}>
                        ☁️ Using Historical Data from Firebase
                      </div>
                    )}
                    <ForecastingComponent 
                      historicalData={chart.data}
                      onRemove={handleRemoveChart}
                      chartId={chart.id}
                    />
                  </div>
                ) : (
                  <div style={{
                    padding: 20,
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: 8,
                    color: '#856404'
                  }}>
                    <strong>Unknown chart type: {chart.type}</strong>
                    <br />
                    Data points: {chart.data?.length || 0}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
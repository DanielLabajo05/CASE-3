import React, { useState, useEffect } from 'react';

const GeographicWorldMap = ({ data, onRemove, chartId }) => {
  const [selectedYear, setSelectedYear] = useState(null);

  // Get unique years from data and sort them
  const availableYears = [...new Set(data.map(item => item.year))].sort((a, b) => a - b);
  
  // Set initial year to most recent if not selected
  useEffect(() => {
    if (!selectedYear && availableYears.length > 0) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  // Filter data for selected year
  const yearData = data.filter(item => item.year === selectedYear);

  // Aggregate countries data
  const countryTotals = yearData.reduce((acc, item) => {
    const existing = acc.find(c => c.country === item.country);
    if (existing) {
      existing.count += item.count;
    } else {
      acc.push({ country: item.country, count: item.count });
    }
    return acc;
  }, []);

  const sortedCountries = [...countryTotals].sort((a, b) => b.count - a.count);
  const totalEmigrants = sortedCountries.reduce((sum, item) => sum + item.count, 0);
  const maxCount = sortedCountries.length > 0 ? sortedCountries[0].count : 0;

  // Country coordinates for markers
  const countryCoordinates = {
    'USA': { lat: 38, lng: -95, name: 'USA' },
    'CANADA': { lat: 56, lng: -95, name: 'Canada' },
    'JAPAN': { lat: 37, lng: 138, name: 'Japan' },
    'AUSTRALIA': { lat: -25, lng: 133, name: 'Australia' },
    'ITALY': { lat: 43, lng: 12, name: 'Italy' },
    'NEW ZEALAND': { lat: -40, lng: 174, name: 'New Zealand' },
    'UNITED KINGDOM': { lat: 54, lng: -2, name: 'UK' },
    'GERMANY': { lat: 51, lng: 10, name: 'Germany' },
    'SOUTH KOREA': { lat: 37, lng: 127, name: 'S. Korea' },
    'SPAIN': { lat: 40, lng: -4, name: 'Spain' },
    'OTHERS': { lat: 25, lng: 20, name: 'Others' }
  };

  // Get color based on percentage of total
  const getColor = (count, total) => {
    const percentage = (count / total) * 100;
    if (percentage >= 50) return { bg: '#b71c1c', text: '#ffffff' }; // Dark red
    if (percentage >= 30) return { bg: '#d32f2f', text: '#ffffff' }; // Red
    if (percentage >= 15) return { bg: '#f57c00', text: '#ffffff' }; // Orange
    if (percentage >= 8) return { bg: '#fbc02d', text: '#000000' }; // Amber
    if (percentage >= 3) return { bg: '#ffeb3b', text: '#000000' }; // Yellow
    return { bg: '#c5e1a5', text: '#000000' }; // Light green
  };

  const WorldMapSVG = () => {
    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '600px',
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #ddd'
      }}>
        {/* World map background */}
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg"
          alt="World Map"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.25,
            filter: 'grayscale(100%)'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        
        {/* Overlay for better contrast */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(173, 216, 230, 0.3) 0%, rgba(135, 206, 250, 0.2) 100%)'
        }} />

        {/* Country markers */}
        {sortedCountries.map((country, index) => {
          const coords = countryCoordinates[country.country.toUpperCase()] || 
                        countryCoordinates[country.country] || 
                        countryCoordinates['OTHERS'];
          const colors = getColor(country.count, totalEmigrants);
          const percentage = ((country.count / totalEmigrants) * 100).toFixed(1);
          
          // Convert lat/lng to percentage coordinates
          const x = ((coords.lng + 180) / 360) * 100;
          const y = ((90 - coords.lat) / 180) * 100;
          
          // Size based on count
          const baseSize = 50;
          const sizeMultiplier = Math.sqrt(country.count / maxCount);
          const size = Math.max(35, baseSize + (sizeMultiplier * 120));
          
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                zIndex: 100 - index
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                e.currentTarget.style.zIndex = 1000;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                e.currentTarget.style.zIndex = 100 - index;
              }}
              title={`${coords.name}: ${country.count.toLocaleString()} (${percentage}%)`}
            >
              {/* Circle marker */}
              <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: colors.bg,
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8
              }}>
                <div style={{ 
                  fontSize: Math.max(9, size / 8), 
                  fontWeight: 'bold', 
                  color: colors.text,
                  textAlign: 'center',
                  lineHeight: 1.1,
                  marginBottom: 2
                }}>
                  {coords.name}
                </div>
                <div style={{ 
                  fontSize: Math.max(14, size / 4.5), 
                  fontWeight: 'bold', 
                  color: colors.text 
                }}>
                  {country.count.toLocaleString()}
                </div>
                <div style={{ 
                  fontSize: Math.max(8, size / 9), 
                  color: colors.text,
                  opacity: 0.95
                }}>
                  {percentage}%
                </div>
              </div>
            </div>
          );
        })}

        {/* Legend - Horizontal at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255,255,255,0.98)',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, color: '#333' }}>
            Share of Total:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 14, backgroundColor: '#b71c1c', borderRadius: 2 }} />
              <span style={{ fontSize: 11 }}>≥50%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 14, backgroundColor: '#d32f2f', borderRadius: 2 }} />
              <span style={{ fontSize: 11 }}>30-50%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 14, backgroundColor: '#f57c00', borderRadius: 2 }} />
              <span style={{ fontSize: 11 }}>15-30%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 14, backgroundColor: '#fbc02d', borderRadius: 2 }} />
              <span style={{ fontSize: 11 }}>8-15%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 14, backgroundColor: '#ffeb3b', borderRadius: 2 }} />
              <span style={{ fontSize: 11 }}>3-8%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 14, backgroundColor: '#c5e1a5', borderRadius: 2 }} />
              <span style={{ fontSize: 11 }}>&lt;3%</span>
            </div>
          </div>
          <div style={{ 
            fontSize: 10, 
            color: '#666',
            fontStyle: 'italic',
            borderLeft: '1px solid #e0e0e0',
            paddingLeft: 15
          }}>
            Size = volume
          </div>
        </div>

        {/* Year indicator */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(255,255,255,0.98)',
          padding: '10px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontWeight: 'bold',
          fontSize: 24,
          color: '#1976d2',
          zIndex: 2000
        }}>
          {selectedYear}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: 30
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>
            🌏 Geographic Distribution of Emigrants (1981-2020)
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 14 }}>
            Interactive world map showing emigrant distribution by destination
          </p>
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(chartId)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 'bold'
            }}
          >
            Remove Chart
          </button>
        )}
      </div>

      {/* Year Selection */}
      <div style={{
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 15
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontWeight: 'bold', color: '#333' }}>
            Select Year:
          </label>
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              fontSize: 14,
              borderRadius: 4,
              border: '1px solid #ccc',
              cursor: 'pointer',
              minWidth: 120
            }}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 13, color: '#666' }}>
          Showing data for {availableYears.length} years ({availableYears[0]} - {availableYears[availableYears.length - 1]})
        </div>
      </div>

      {/* World Map */}
      <WorldMapSVG />

      {/* Statistics Panel */}
      <div style={{
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 5
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
          Statistics for {selectedYear}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Total Emigrants</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 20, fontWeight: 'bold', color: '#2196F3' }}>
              {totalEmigrants.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Top Destination</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>
              {sortedCountries.length > 0 ? sortedCountries[0].country : 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Countries</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 20, fontWeight: 'bold', color: '#333' }}>
              {sortedCountries.length}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Top Country Share</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 20, fontWeight: 'bold', color: '#ff9800' }}>
              {sortedCountries.length > 0 
                ? ((sortedCountries[0].count / totalEmigrants) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Top 10 Countries Table */}
      <div style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 10, color: '#333' }}>Top 10 Destination Countries</h4>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: 14
        }}>
          <thead>
            <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Rank</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Country</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Emigrants</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {sortedCountries.slice(0, 10).map((country, index) => (
              <tr key={index} style={{ 
                backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <td style={{ padding: 10 }}>#{index + 1}</td>
                <td style={{ padding: 10, fontWeight: 'bold' }}>{country.country}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>
                  {country.count.toLocaleString()}
                </td>
                <td style={{ padding: 10, textAlign: 'right' }}>
                  {((country.count / totalEmigrants) * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeographicWorldMap;
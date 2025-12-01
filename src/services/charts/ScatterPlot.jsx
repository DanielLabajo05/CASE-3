import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const OccupationEducationScatterPlot = ({ data, onRemove, chartId }) => {
  // Get unique years from data
  const allYears = useMemo(() => {
    return [...new Set(data.map(item => item.year))].sort((a, b) => a - b);
  }, [data]);

  const minYear = allYears[0] || 1988;
  const maxYear = allYears[allYears.length - 1] || 2020;

  const [yearFrom, setYearFrom] = useState(minYear);
  const [yearTo, setYearTo] = useState(maxYear);

  // Filter data by year range
  const filteredData = useMemo(() => {
    return data.filter(item => item.year >= yearFrom && item.year <= yearTo);
  }, [data, yearFrom, yearTo]);

  // Define colors for different occupation categories
  const occupationColors = {
    'Prof Tech Related': '#2196F3',
    'Managerial Executive Admin': '#4CAF50',
    'Clerical': '#FF9800',
    'Sales': '#9C27B0',
    'Service': '#F44336',
    'Agriculture Husbandry Forestry Fis': '#00BCD4',
    'Production Transport Laborers': '#795548',
    'Armed Forces': '#607D8B',
    'Housewives': '#E91E63',
    'Retirees': '#3F51B5',
    'Students': '#FFC107',
    'Minors': '#8BC34A',
    'Out of School Youth': '#FF5722',
    'Refugees': '#9E9E9E',
    'No Occupation Reported': '#CDDC39'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          maxWidth: '300px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>
            {data.occupation}
          </p>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>
            Year: {data.year}
          </p>
          <p style={{ margin: '4px 0', color: '#2196F3', fontSize: '13px' }}>
            Total Education: {data.totalEducation.toLocaleString()}
          </p>
          <p style={{ margin: '4px 0', color: '#4CAF50', fontSize: '13px' }}>
            Total Occupation: {data.totalOccupation.toLocaleString()}
          </p>
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
            <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
              Elementary: {data.elementary?.toLocaleString() || 0}
            </p>
            <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
              High School: {data.highSchool?.toLocaleString() || 0}
            </p>
            <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
              College: {data.college?.toLocaleString() || 0}
            </p>
            <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
              Postgraduate: {data.postgraduate?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    totalPoints: filteredData.length,
    avgEducation: Math.round(
      filteredData.reduce((sum, item) => sum + item.totalEducation, 0) / filteredData.length
    ),
    avgOccupation: Math.round(
      filteredData.reduce((sum, item) => sum + item.totalOccupation, 0) / filteredData.length
    ),
    maxEducation: Math.max(...filteredData.map(item => item.totalEducation)),
    maxOccupation: Math.max(...filteredData.map(item => item.totalOccupation))
  }), [filteredData]);

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
            Occupation vs Education Relationship
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 14 }}>
            Scatter plot showing correlation between education levels and occupations
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

      {/* Year Range Filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 4
      }}>
        <span style={{ fontWeight: 600, color: '#333' }}>Year Range:</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 14, color: '#666' }}>From:</label>
          <select
            value={yearFrom}
            onChange={(e) => setYearFrom(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {allYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 14, color: '#666' }}>To:</label>
          <select
            value={yearTo}
            onChange={(e) => setYearTo(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {allYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{
          padding: '6px 16px',
          backgroundColor: '#e3f2fd',
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 600,
          color: '#1976d2'
        }}>
          {yearFrom} - {yearTo}
        </div>

        <span style={{ marginLeft: 'auto', color: '#666', fontSize: 14 }}>
          Showing {filteredData.length} data points
        </span>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey="totalEducation"
            name="Total Education"
            label={{
              value: 'Total Education Level',
              position: 'insideBottom',
              offset: -15,
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <YAxis
            type="number"
            dataKey="totalOccupation"
            name="Total Occupation"
            label={{
              value: 'Total Occupation Count',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontSize: 12 }}
            iconType="circle"
          />
          <Scatter
            name="Occupation vs Education"
            data={filteredData}
            fill="#8884d8"
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={occupationColors[entry.occupation] || '#999'}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Statistics */}
      <div style={{
        marginTop: 30,
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 8
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Summary Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Data Points</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              {stats.totalPoints}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Avg Education</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#2196F3' }}>
              {stats.avgEducation.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Avg Occupation</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#4CAF50' }}>
              {stats.avgOccupation.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Max Education</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#FF9800' }}>
              {stats.maxEducation.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Max Occupation</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#9C27B0' }}>
              {stats.maxOccupation.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Legend for Occupation Colors */}
      <div style={{
        marginTop: 20,
        padding: 20,
        backgroundColor: '#fafafa',
        borderRadius: 8,
        border: '1px solid #eee'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Occupation Categories</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px'
        }}>
          {Object.entries(occupationColors).map(([occupation, color]) => (
            <div key={occupation} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: color
              }} />
              <span style={{ fontSize: 12, color: '#666' }}>{occupation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OccupationEducationScatterPlot;
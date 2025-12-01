import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TotalEmigrantsLineChart = ({ data, onRemove, chartId }) => {
  // Get min and max years from data
  const years = data.map(item => item.year).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  // State for year range selection
  const [fromYear, setFromYear] = useState(minYear);
  const [toYear, setToYear] = useState(maxYear);

  // Filter data based on selected year range
  const filteredData = useMemo(() => {
    return data
      .filter(item => item.year >= fromYear && item.year <= toYear)
      .map(item => ({
        year: item.year,
        total: item.total
      }));
  }, [data, fromYear, toYear]);

  // Guard against empty or invalid data
  const hasData = Array.isArray(filteredData) && filteredData.length > 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Year: {payload[0].payload.year}</p>
          <p style={{ margin: '5px 0 0 0', color: '#2196F3' }}>
            Total Emigrants: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
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
            Total Emigrants Over Time
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 14 }}>
            Total emigrant count aggregated across selected years for each age group
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

      {/* Year Range Selector */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <span style={{ fontWeight: 'bold', color: '#333' }}>Year Range:</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: 14, color: '#666' }}>From:</label>
          <select
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: 14, color: '#666' }}>To:</label>
          <select
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <span style={{
          padding: '6px 12px',
          backgroundColor: '#2196F3',
          color: 'white',
          borderRadius: '4px',
          fontSize: 13,
          fontWeight: 'bold'
        }}>
          {fromYear} - {toYear}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={hasData ? filteredData : []}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: 'Number of Emigrants', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#2196F3"
            strokeWidth={3}
            dot={{ fill: '#2196F3', r: 4 }}
            activeDot={{ r: 6 }}
            name="Total Emigrants"
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={{
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 5
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Summary Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Total Years</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              {hasData ? filteredData.length : 0}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Total Emigrants</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#2196F3' }}>
              {hasData ? filteredData.reduce((sum, item) => sum + (Number(item.total) || 0), 0).toLocaleString() : '0'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Average per Year</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              {hasData ? Math.round(filteredData.reduce((sum, item) => sum + (Number(item.total) || 0), 0) / filteredData.length).toLocaleString() : '0'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Peak Year</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#4CAF50' }}>
              {hasData ? filteredData.reduce((max, item) => (Number(item.total) > Number(max.total) ? item : max), filteredData[0]).year : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalEmigrantsLineChart;
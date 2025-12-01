import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';

const GenderComparisonChart = ({ data, onRemove, chartId }) => {
  // Get all unique years and sort them
  const allYears = useMemo(() => {
    return [...new Set(data.map(item => item.year))].sort((a, b) => a - b);
  }, [data]);

  const minYear = allYears[0] || 1981;
  const maxYear = allYears[allYears.length - 1] || 2021;

  const [yearFrom, setYearFrom] = useState(minYear);
  const [yearTo, setYearTo] = useState(maxYear);

  // Filter data based on year range
  const filteredData = useMemo(() => {
    return data
      .filter(item => item.year >= yearFrom && item.year <= yearTo)
      .sort((a, b) => a.year - b.year)
      .map(item => ({
        year: item.year,
        Male: item.male || 0,
        Female: item.female || 0
      }));
  }, [data, yearFrom, yearTo]);

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
        <h2 style={{ margin: 0, color: '#333' }}>
          Gender Comparison of Filipino Emigrants
        </h2>
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
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <BarChart 
          data={filteredData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="year" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Number of Emigrants', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            formatter={(value) => value.toLocaleString()}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="square"
          />
          <Bar dataKey="Male" fill="#5DADE2" name="Male" />
          <Bar dataKey="Female" fill="#EC7BC5" name="Female" />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div style={{
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 4
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Summary Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Total Male</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#5DADE2' }}>
              {filteredData.reduce((sum, item) => sum + item.Male, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Total Female</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#EC7BC5' }}>
              {filteredData.reduce((sum, item) => sum + item.Female, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Total Emigrants</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              {filteredData.reduce((sum, item) => sum + item.Male + item.Female, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Years Shown</p>
            <p style={{ margin: '5px 0 0 0', fontSize: 18, fontWeight: 'bold', color: '#333' }}>
              {filteredData.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenderComparisonChart;
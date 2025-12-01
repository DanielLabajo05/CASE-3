import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const AgeDistributionHistogram = ({ data, onRemove, chartId }) => {
  // Get all unique years and sort them
  const allYears = useMemo(() => {
    return [...new Set(data.map(item => item.year))].sort((a, b) => a - b);
  }, [data]);

  const minYear = allYears[0] || 1981;
  const maxYear = allYears[allYears.length - 1] || 2021;

  const [yearFrom, setYearFrom] = useState(minYear);
  const [yearTo, setYearTo] = useState(maxYear);

  // Filter data by year range, then aggregate
  const aggregatedData = useMemo(() => {
    const filteredData = data.filter(item => item.year >= yearFrom && item.year <= yearTo);
    const ageGroupTotals = {};

    // Sum up counts for each age group
    filteredData.forEach(item => {
      const ageGroup = item.ageGroup;
      const count = Number(item.count) || 0;

      if (ageGroupTotals[ageGroup]) {
        ageGroupTotals[ageGroup] += count;
      } else {
        ageGroupTotals[ageGroup] = count;
      }
    });

    // Convert to array format for recharts
    const chartData = Object.keys(ageGroupTotals).map(ageGroup => ({
      ageGroup: ageGroup,
      totalCount: ageGroupTotals[ageGroup]
    }));

    // Sort by age group (assuming format like "0-14", "15-24", etc.)
    chartData.sort((a, b) => {
      const getFirstNumber = (str) => parseInt(str.split('-')[0]);
      return getFirstNumber(a.ageGroup) - getFirstNumber(b.ageGroup);
    });

    return chartData;
  }, [data, yearFrom, yearTo]);

  // Color palette for bars
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  return (
    <div style={{
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>
            Histogram of Emigrant Counts per Age Group
          </h2>
          <p style={{ margin: '5px 0 0 0', fontSize: 14, color: '#666' }}>
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

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={aggregatedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="ageGroup"
            label={{
              value: 'Age Group',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
            tick={{ fontSize: 12 }}
            angle={0}
          />
          <YAxis
            label={{
              value: 'Frequency (Total Emigrant Count)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            formatter={(value) => value.toLocaleString()}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            payload={[
              {
                value: 'Total Emigrant Count',
                type: 'rect',
                color: '#8884d8'
              }
            ]}
          />
          <Bar
            dataKey="totalCount"
            name="Total Emigrant Count"
            radius={[4, 4, 0, 0]}
          >
            {aggregatedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div style={{
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 4
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#333' }}>
          Summary Statistics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <div>
            <strong>Total Age Groups:</strong> {aggregatedData.length}
          </div>
          <div>
            <strong>Total Emigrants:</strong>{' '}
            {aggregatedData.reduce((sum, item) => sum + item.totalCount, 0).toLocaleString()}
          </div>
          <div>
            <strong>Highest Count:</strong>{' '}
            {aggregatedData.length > 0
              ? `${Math.max(...aggregatedData.map(d => d.totalCount)).toLocaleString()} (${
                  aggregatedData.find(d => d.totalCount === Math.max(...aggregatedData.map(d => d.totalCount)))?.ageGroup
                })`
              : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeDistributionHistogram;
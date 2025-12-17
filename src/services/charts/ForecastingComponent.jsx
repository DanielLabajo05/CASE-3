import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as tf from '@tensorflow/tfjs';

const ForecastingComponent = ({ historicalData, onRemove, chartId }) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecastYears, setForecastYears] = useState(5);
  const [selectedAttribute, setSelectedAttribute] = useState('value');
  const [forecasts, setForecasts] = useState([]);
  const [isForecasting, setIsForecasting] = useState(false);
  const [chartData, setChartData] = useState([]);
  
  // Year range selection
  const [trainStartYear, setTrainStartYear] = useState(null);
  const [trainEndYear, setTrainEndYear] = useState(null);
  const [useYearRange, setUseYearRange] = useState(false);
  
  // Model training parameters
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelAccuracy, setModelAccuracy] = useState(null);

  const attributes = [
    { value: 'value', label: 'Value (Forecast Data)', dataKey: 'value' },
    { value: 'total', label: 'Total Emigrants', dataKey: 'total' },
    { value: 'totalEmigrants', label: 'Total Emigrants (Alt)', dataKey: 'totalEmigrants' },
    { value: 'male', label: 'Male Emigrants', dataKey: 'male' },
    { value: 'female', label: 'Female Emigrants', dataKey: 'female' }
  ];

  // Get available years from data
  const availableYears = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return [];
    return historicalData.map(d => d.year).sort((a, b) => a - b);
  }, [historicalData]);

  // Initialize year range
  useEffect(() => {
    if (availableYears.length > 0 && !trainStartYear) {
      setTrainStartYear(availableYears[0]);
      setTrainEndYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears]);

  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      prepareChartData();
    }
  }, [historicalData, forecasts, selectedAttribute, trainEndYear]);

  const prepareChartData = () => {
    if (!historicalData || historicalData.length === 0) return;

    const combined = historicalData.map(item => {
      // Try multiple field names for the value
      const actualValue = item[selectedAttribute] || item.value || item.totalEmigrants || item.total || 0;
      
      return {
        year: item.year,
        actual: actualValue,
        forecast: null,
        type: item.year <= trainEndYear ? 'Training' : 'Actual'
      };
    });

    if (forecasts.length > 0) {
      forecasts.forEach(f => {
        const existingIdx = combined.findIndex(c => c.year === f.year);
        if (existingIdx >= 0) {
          combined[existingIdx].forecast = f.value;
          combined[existingIdx].type = 'Validation';
        } else {
          combined.push({
            year: f.year,
            actual: null,
            forecast: f.value,
            type: 'Forecast'
          });
        }
      });
    }

    setChartData(combined.sort((a, b) => a.year - b.year));
  };

  const normalizeData = (data, min, max) => {
    const range = max - min;
    return data.map(val => (val - min) / range);
  };

  const denormalizeData = (data, min, max) => {
    const range = max - min;
    return data.map(val => val * range + min);
  };

  const createSequences = (data, lookback) => {
    const X = [];
    const y = [];
    for (let i = lookback; i < data.length; i++) {
      X.push(data.slice(i - lookback, i));
      y.push(data[i]);
    }
    return { X, y };
  };

  const buildLSTMModel = (lookback) => {
    const model = tf.sequential();
    
    // Smaller, faster architecture
    model.add(tf.layers.lstm({
      units: 32,
      returnSequences: false,
      inputShape: [lookback, 1]
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({ units: 16 }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  };

  const trainModelOnData = async () => {
    if (!historicalData || historicalData.length === 0) {
      setError('No historical data available');
      return;
    }

    if (!trainStartYear || !trainEndYear) {
      setError('Please select year range');
      return;
    }

    try {
      setIsTraining(true);
      setError(null);
      setTrainingProgress(0);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter data by year range
      const filteredData = historicalData
        .filter(d => d.year >= trainStartYear && d.year <= trainEndYear)
        .sort((a, b) => a.year - b.year);

      if (filteredData.length < 7) {
        throw new Error('Need at least 7 years of data for training. Please select a wider year range.');
      }

      // Extract values - try multiple field names
      const values = filteredData.map(d => {
        const value = d[selectedAttribute] || d.value || d.totalEmigrants || d.total || 0;
        return value;
      });
      
      // Debug: Log the values
      console.log('Extracted values:', values);
      console.log('Sample data point:', filteredData[0]);
      
      // Check if all values are 0
      if (values.every(v => v === 0)) {
        throw new Error(`All values are 0. Check your data field names. Available fields: ${Object.keys(filteredData[0] || {}).join(', ')}`);
      }
      
      const min = Math.min(...values);
      const max = Math.max(...values);

      // Normalize
      const normalizedValues = normalizeData(values, min, max);

      // Create sequences
      const lookback = 5;
      const { X, y } = createSequences(normalizedValues, lookback);

      if (X.length < 5) {
        throw new Error('Insufficient data after creating sequences');
      }

      // Convert to tensors
      const X_tensor = tf.tensor3d(X.map(seq => seq.map(v => [v])));
      const y_tensor = tf.tensor2d(y.map(v => [v]));

      // Build model
      const trainedModel = buildLSTMModel(lookback);

      console.log('Training model...');
      
      // Train with fewer epochs and yield to browser
      await trainedModel.fit(X_tensor, y_tensor, {
        epochs: 30,
        batchSize: 16,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            setTrainingProgress(((epoch + 1) / 30) * 100);
            if (epoch % 5 === 0) {
              await tf.nextFrame();
            }
          }
        }
      });

      // Calculate accuracy
      const predictions = trainedModel.predict(X_tensor);
      const predArray = await predictions.array();
      const yArray = await y_tensor.array();

      let sumSquaredError = 0;
      for (let i = 0; i < predArray.length; i++) {
        const error = yArray[i][0] - predArray[i][0];
        sumSquaredError += error * error;
      }
      const rmse = Math.sqrt(sumSquaredError / predArray.length);
      const accuracy = Math.max(0, (1 - rmse) * 100);

      setModelAccuracy(accuracy.toFixed(2));
      setModel({ 
        model: trainedModel, 
        lookback, 
        min, 
        max,
        trainYears: filteredData.map(d => d.year)
      });

      // Cleanup
      X_tensor.dispose();
      y_tensor.dispose();
      predictions.dispose();

      setIsTraining(false);
      console.log('Model trained successfully! RMSE:', rmse.toFixed(4));
    } catch (err) {
      console.error('Error training model:', err);
      setError('Failed to train model: ' + err.message);
      setIsTraining(false);
    }
  };

  const generateForecasts = async () => {
    if (!model) {
      setError('Please train the model first');
      return;
    }

    if (!historicalData || historicalData.length === 0) {
      setError('No historical data available');
      return;
    }

    try {
      setIsForecasting(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 100));

      const { model: trainedModel, lookback, min, max, trainYears } = model;

      // Get the last lookback values from training data
      const trainData = historicalData
        .filter(d => d.year >= trainStartYear && d.year <= trainEndYear)
        .sort((a, b) => a.year - b.year);

      const recentValues = trainData
        .slice(-lookback)
        .map(d => d[selectedAttribute] || d.value || d.totalEmigrants || d.total || 0);

      if (recentValues.length < lookback) {
        throw new Error(`Insufficient data. Need at least ${lookback} data points.`);
      }

      // Normalize
      let sequence = normalizeData(recentValues, min, max);
      const predictions = [];
      const lastTrainYear = trainEndYear;

      // Generate forecasts
      for (let i = 0; i < forecastYears; i++) {
        const inputTensor = tf.tensor3d([sequence.map(v => [v])], [1, lookback, 1]);
        const prediction = await trainedModel.predict(inputTensor);
        const predictedValue = await prediction.data();

        const denormalized = denormalizeData([predictedValue[0]], min, max);
        const forecastYear = lastTrainYear + i + 1;

        predictions.push({
          year: forecastYear,
          value: Math.round(denormalized[0]),
          normalizedValue: predictedValue[0]
        });

        // Update sequence (sliding window)
        sequence = [...sequence.slice(1), predictedValue[0]];

        // Cleanup
        inputTensor.dispose();
        prediction.dispose();

        if (i % 2 === 0) {
          await tf.nextFrame();
        }
      }

      setForecasts(predictions);
      setIsForecasting(false);

      // Calculate accuracy if we have actual data
      calculateForecastAccuracy(predictions);

      console.log('Forecasts generated:', predictions);
    } catch (err) {
      console.error('Error generating forecasts:', err);
      setError('Failed to generate forecasts: ' + err.message);
      setIsForecasting(false);
    }
  };

  const calculateForecastAccuracy = (predictions) => {
    if (!historicalData || predictions.length === 0) return;

    const comparisons = predictions
      .map(pred => {
        const actual = historicalData.find(d => d.year === pred.year);
        if (actual) {
          const actualValue = actual[selectedAttribute] || actual.value || actual.totalEmigrants || actual.total;
          if (actualValue) {
            const predictedValue = pred.value;
            const error = Math.abs(actualValue - predictedValue);
            const percentError = (error / actualValue) * 100;
            return { year: pred.year, actual: actualValue, predicted: predictedValue, error, percentError };
          }
        }
        return null;
      })
      .filter(Boolean);

    if (comparisons.length > 0) {
      const avgError = comparisons.reduce((sum, c) => sum + c.percentError, 0) / comparisons.length;
      console.log('Forecast Accuracy:', comparisons);
      console.log('Average Error:', avgError.toFixed(2) + '%');
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Year: {data.year}</p>
          {data.actual !== null && data.actual !== undefined && (
            <p style={{ margin: '5px 0 0 0', color: '#2196F3' }}>
              Actual: {Number(data.actual).toLocaleString()}
            </p>
          )}
          {data.forecast !== null && data.forecast !== undefined && (
            <p style={{ margin: '5px 0 0 0', color: '#FF9800' }}>
              Forecast: {Number(data.forecast).toLocaleString()}
            </p>
          )}
          <p style={{ margin: '5px 0 0 0', fontSize: 12, color: '#666' }}>
            ({data.type})
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: 40,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🤖</div>
        <h3>Loading Forecasting System...</h3>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: 30
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>
            🤖 Emigration Forecasting
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 14 }}>
            Predict future emigration trends based on historical data using LSTM
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

      {/* Data Info */}
      {availableYears.length > 0 && (
        <div style={{
          padding: 15,
          backgroundColor: '#e3f2fd',
          borderRadius: 4,
          marginBottom: 20
        }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Data Points:</strong> {availableYears.length} | 
            <strong> Year Range:</strong> {availableYears[0]} - {availableYears[availableYears.length - 1]} | 
            <strong> Accuracy:</strong> {modelAccuracy ? `${modelAccuracy}%` : 'Not trained'}
          </p>
          {/* Debug: Show sample data */}
          {historicalData && historicalData.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#666', backgroundColor: '#fff', padding: 10, borderRadius: 4 }}>
              <strong>Debug - Sample Data Point:</strong>
              <pre style={{ margin: '5px 0 0 0', overflow: 'auto', maxHeight: 150 }}>
                {JSON.stringify(historicalData[0], null, 2)}
              </pre>
              <div style={{ marginTop: 5 }}>
                <strong>Detected Value for "{selectedAttribute}":</strong> {historicalData[0][selectedAttribute] || historicalData[0].value || historicalData[0].totalEmigrants || historicalData[0].total || 'NOT FOUND'}
              </div>
            </div>
          )}
          {availableYears.length < 10 && (
            <p style={{ margin: '10px 0 0 0', fontSize: 13, color: '#d32f2f', fontWeight: 'bold' }}>
              ⚠️ Warning: Less than 10 years of data may result in poor predictions
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        marginBottom: 20
      }}>
        {/* Attribute Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 600,
            color: '#333'
          }}>
            Select Attribute to Forecast:
          </label>
          <select
            value={selectedAttribute}
            onChange={(e) => {
              setSelectedAttribute(e.target.value);
              setForecasts([]);
              setModel(null);
              setModelAccuracy(null);
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14
            }}
          >
            {attributes.map(attr => (
              <option key={attr.value} value={attr.value}>
                {attr.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Range Selection */}
        <div style={{
          padding: 15,
          backgroundColor: '#fff3e0',
          borderRadius: 4,
          marginBottom: 15,
          border: '1px solid #FFB74D'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={useYearRange}
              onChange={(e) => setUseYearRange(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <label style={{ fontWeight: 600, color: '#E65100' }}>
              Train on specific year range (for validation)
            </label>
          </div>

          {useYearRange && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 15
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13 }}>
                  Train Start Year:
                </label>
                <select
                  value={trainStartYear}
                  onChange={(e) => setTrainStartYear(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13 }}>
                  Train End Year:
                </label>
                <select
                  value={trainEndYear}
                  onChange={(e) => setTrainEndYear(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                >
                  {availableYears.filter(y => y >= trainStartYear).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {useYearRange && trainStartYear && trainEndYear && (
            <p style={{ margin: '10px 0 0 0', fontSize: 13, color: '#666' }}>
              Will train on {trainEndYear - trainStartYear + 1} years ({trainStartYear}-{trainEndYear}) 
              and can predict {availableYears[availableYears.length - 1] - trainEndYear} years ahead 
              for validation
            </p>
          )}
        </div>

        {/* Forecast Years */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 600,
            color: '#333'
          }}>
            Years to Forecast:
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={forecastYears}
            onChange={(e) => setForecastYears(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10
        }}>
          <button
            onClick={trainModelOnData}
            disabled={isTraining || !historicalData || historicalData.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: isTraining ? '#999' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: isTraining ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            {isTraining ? `⏳ Training... ${trainingProgress.toFixed(0)}%` : '🎓 Train Model'}
          </button>

          <button
            onClick={generateForecasts}
            disabled={isForecasting || !model}
            style={{
              padding: '10px 20px',
              backgroundColor: isForecasting ? '#999' : model ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: isForecasting || !model ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            {isForecasting ? '⏳ Forecasting...' : '🚀 Generate Forecast'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          padding: 15,
          borderRadius: 4,
          color: '#c62828',
          marginBottom: 20
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
              label={{ 
                value: attributes.find(a => a.value === selectedAttribute)?.label || 'Value', 
                angle: -90, 
                position: 'insideLeft' 
              }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#2196F3"
              strokeWidth={2}
              dot={{ fill: '#2196F3', r: 4 }}
              name="Historical Data"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#FF9800"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#FF9800', r: 5 }}
              name="Forecast"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Forecast Results */}
      {forecasts.length > 0 && (
        <div style={{
          marginTop: 30,
          padding: 20,
          backgroundColor: '#fff3e0',
          borderRadius: 8,
          border: '2px solid #FF9800'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#E65100' }}>
            📈 Forecast Results
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 15
          }}>
            {forecasts.map((forecast, index) => {
              const actualData = historicalData.find(d => d.year === forecast.year);
              const actualValue = actualData ? (actualData[selectedAttribute] || actualData.value || actualData.totalEmigrants || actualData.total) : null;
              const hasActual = actualValue !== null && actualValue !== undefined;
              const accuracy = hasActual 
                ? (100 - Math.abs((actualValue - forecast.value) / actualValue) * 100).toFixed(1)
                : null;

              return (
                <div
                  key={index}
                  style={{
                    padding: 15,
                    backgroundColor: hasActual ? '#e8f5e9' : 'white',
                    borderRadius: 4,
                    textAlign: 'center',
                    border: hasActual ? '2px solid #4CAF50' : '1px solid #FFB74D'
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#E65100' }}>
                    {forecast.year}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#FF9800', marginTop: 5 }}>
                    {forecast.value.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
                    predicted
                  </div>
                  {hasActual && (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2196F3', marginTop: 8 }}>
                        {actualValue.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        actual
                      </div>
                      <div style={{ 
                        fontSize: 13, 
                        fontWeight: 'bold', 
                        color: accuracy > 90 ? '#4CAF50' : accuracy > 80 ? '#FF9800' : '#f44336',
                        marginTop: 5 
                      }}>
                        {accuracy}% accurate
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastingComponent;
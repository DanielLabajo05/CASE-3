import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';

export default function ModelTrainer() {
  const [status, setStatus] = useState('ready');
  const [progress, setProgress] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  // Sample historical data - replace with your actual data
  const historicalData = [
    { year: 2000, value: 120000 },
    { year: 2001, value: 125000 },
    { year: 2002, value: 130000 },
    { year: 2003, value: 135000 },
    { year: 2004, value: 142000 },
    { year: 2005, value: 150000 },
    { year: 2006, value: 158000 },
    { year: 2007, value: 165000 },
    { year: 2008, value: 172000 },
    { year: 2009, value: 168000 },
    { year: 2010, value: 175000 },
    { year: 2011, value: 182000 },
    { year: 2012, value: 190000 },
    { year: 2013, value: 198000 },
    { year: 2014, value: 205000 },
    { year: 2015, value: 212000 },
    { year: 2016, value: 220000 },
    { year: 2017, value: 228000 },
    { year: 2018, value: 235000 },
    { year: 2019, value: 242000 },
    { year: 2020, value: 230000 },
    { year: 2021, value: 245000 },
    { year: 2022, value: 255000 },
    { year: 2023, value: 265000 },
  ];

  const normalizeData = (data) => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const normalized = data.map(d => ({
      year: d.year,
      normalizedValue: (d.value - min) / (max - min)
    }));
    
    return { normalized, min, max };
  };

  const createSequences = (data, sequenceLength = 3) => {
    const sequences = [];
    const targets = [];
    
    for (let i = 0; i < data.length - sequenceLength; i++) {
      const sequence = data.slice(i, i + sequenceLength).map(d => d.normalizedValue);
      const target = data[i + sequenceLength].normalizedValue;
      sequences.push(sequence);
      targets.push(target);
    }
    
    return { sequences, targets };
  };

  const createModel = (sequenceLength) => {
    const model = tf.sequential();
    
    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: false,
      inputShape: [sequenceLength, 1]
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 25, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  };

  const trainModel = async () => {
    setStatus('training');
    setLogs([]);
    setProgress('Initializing...');
    addLog('Starting model training...', 'success');

    try {
      // Normalize data
      const { normalized, min, max } = normalizeData(historicalData);
      addLog(`Normalized ${historicalData.length} data points`);
      
      // Create sequences
      const sequenceLength = 3;
      const { sequences, targets } = createSequences(normalized, sequenceLength);
      addLog(`Created ${sequences.length} training sequences`);
      
      // Convert to tensors
      const xs = tf.tensor3d(sequences.map(seq => seq.map(val => [val])));
      const ys = tf.tensor2d(targets, [targets.length, 1]);
      
      // Create model
      const model = createModel(sequenceLength);
      addLog('Model architecture created');
      
      // Train model
      setProgress('Training model (this may take 1-2 minutes)...');
      addLog('Training started with 100 epochs...', 'info');
      
      await model.fit(xs, ys, {
        epochs: 100,
        batchSize: 4,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              setProgress(`Training: Epoch ${epoch}/100 - Loss: ${logs.loss.toFixed(4)}`);
              addLog(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}`);
            }
          }
        }
      });
      
      addLog('Model training complete!', 'success');
      
      // Save model to downloads
      setProgress('Saving model...');
      await model.save('downloads://filipino-emigrant-model');
      addLog('Model saved to Downloads folder!', 'success');
      
      // Create metadata
      const meta = {
        sequenceLength,
        min,
        max,
        trainedOn: new Date().toISOString(),
        epochs: 100,
        dataPoints: historicalData.length
      };
      
      setMetadata(meta);
      addLog('Training complete! Check Downloads folder for model files.', 'success');
      
      // Test prediction
      const lastData = historicalData.slice(-3);
      const normalizedInput = lastData.map(d => 
        (d.value - min) / (max - min)
      );
      const inputTensor = tf.tensor3d([normalizedInput.map(val => [val])]);
      const prediction = model.predict(inputTensor);
      const normalizedPrediction = await prediction.data();
      const predictedValue = normalizedPrediction[0] * (max - min) + min;
      
      addLog(`Test prediction for 2024: ${Math.round(predictedValue).toLocaleString()}`, 'success');
      
      // Clean up
      xs.dispose();
      ys.dispose();
      inputTensor.dispose();
      prediction.dispose();
      
      setStatus('complete');
      setProgress('✅ Training complete!');
      
    } catch (error) {
      console.error('Error:', error);
      addLog(`Error: ${error.message}`, 'error');
      setStatus('error');
      setProgress('Training failed');
    }
  };

  const downloadMetadata = () => {
    if (!metadata) return;
    
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'model-metadata.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              🧠 TensorFlow.js Model Trainer
            </h1>
            <div className="text-sm text-gray-500">
              Filipino Emigrants Forecasting
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Status</p>
                <p className="text-2xl font-bold capitalize">{status}</p>
              </div>
              <div className="text-5xl opacity-80">
                {status === 'ready' && '🎯'}
                {status === 'training' && '⚡'}
                {status === 'complete' && '✅'}
                {status === 'error' && '❌'}
              </div>
            </div>
            {progress && (
              <p className="mt-3 text-sm opacity-90">{progress}</p>
            )}
          </div>

          {/* Data Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">📊 Training Data</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{historicalData.length}</p>
                <p className="text-sm text-gray-600">Data Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {historicalData[0].year}-{historicalData[historicalData.length-1].year}
                </p>
                <p className="text-sm text-gray-600">Year Range</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">LSTM</p>
                <p className="text-sm text-gray-600">Model Type</p>
              </div>
            </div>
          </div>

          {/* Train Button */}
          <button
            onClick={trainModel}
            disabled={status === 'training'}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg mb-6"
          >
            {status === 'training' ? '🏋️ Training in Progress...' : '🚀 Start Training'}
          </button>

          {/* Metadata Download */}
          {metadata && (
            <button
              onClick={downloadMetadata}
              className="w-full bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-all duration-200 mb-6"
            >
              📥 Download model-metadata.json
            </button>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">📝 After Training:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
              <li>Check your Downloads folder for these files:
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• filipino-emigrant-model.json</li>
                  <li>• filipino-emigrant-model.weights.bin</li>
                </ul>
              </li>
              <li>Create folder: <code className="bg-yellow-100 px-1 rounded">public/models/</code> in your project</li>
              <li>Move both model files to <code className="bg-yellow-100 px-1 rounded">public/models/</code></li>
              <li>Download and save model-metadata.json to <code className="bg-yellow-100 px-1 rounded">public/models/</code></li>
              <li>Restart your app to load the model</li>
            </ol>
          </div>

          {/* Logs */}
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-3 text-green-400">📋 Training Logs</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs yet. Click "Start Training" to begin.</p>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, idx) => (
                  <div key={idx} className={`${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
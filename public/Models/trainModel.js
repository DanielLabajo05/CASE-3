import * as tf from '@tensorflow/tfjs';

/**
 * Train a TensorFlow.js model for Filipino Emigrant Forecasting
 * This script trains a simple LSTM model and saves it to public/models/
 */

// Sample training data - Replace with your actual historical data
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
  { year: 2020, value: 230000 }, // COVID impact
  { year: 2021, value: 245000 },
  { year: 2022, value: 255000 },
  { year: 2023, value: 265000 },
];

// Normalize data
function normalizeData(data) {
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  const normalized = data.map(d => ({
    year: d.year,
    normalizedValue: (d.value - min) / (max - min)
  }));
  
  return { normalized, min, max };
}

// Create sequences for time series prediction
function createSequences(data, sequenceLength = 3) {
  const sequences = [];
  const targets = [];
  
  for (let i = 0; i < data.length - sequenceLength; i++) {
    const sequence = data.slice(i, i + sequenceLength).map(d => d.normalizedValue);
    const target = data[i + sequenceLength].normalizedValue;
    sequences.push(sequence);
    targets.push(target);
  }
  
  return { sequences, targets };
}

// Create and compile the model
function createModel(sequenceLength) {
  const model = tf.sequential();
  
  // LSTM layer
  model.add(tf.layers.lstm({
    units: 50,
    returnSequences: false,
    inputShape: [sequenceLength, 1]
  }));
  
  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Dense layer
  model.add(tf.layers.dense({ units: 25, activation: 'relu' }));
  
  // Output layer
  model.add(tf.layers.dense({ units: 1 }));
  
  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  
  return model;
}

// Train the model
async function trainModel() {
  console.log('🚀 Starting model training...');
  
  try {
    // Normalize data
    const { normalized, min, max } = normalizeData(historicalData);
    console.log('✅ Data normalized');
    
    // Create sequences
    const sequenceLength = 3;
    const { sequences, targets } = createSequences(normalized, sequenceLength);
    console.log(`✅ Created ${sequences.length} training sequences`);
    
    // Convert to tensors
    const xs = tf.tensor3d(
      sequences.map(seq => seq.map(val => [val]))
    );
    const ys = tf.tensor2d(targets, [targets.length, 1]);
    
    // Create model
    const model = createModel(sequenceLength);
    console.log('✅ Model created');
    
    // Display model summary
    model.summary();
    
    // Train model
    console.log('🏋️ Training model...');
    const history = await model.fit(xs, ys, {
      epochs: 100,
      batchSize: 4,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
          }
        }
      }
    });
    
    console.log('✅ Model training complete!');
    
    // Save model
    const savePath = 'downloads://filipino-emigrant-model';
    await model.save(savePath);
    console.log('💾 Model saved! Check your Downloads folder');
    console.log('📁 Move the files to: public/models/');
    
    // Save metadata
    const metadata = {
      sequenceLength,
      min,
      max,
      trainedOn: new Date().toISOString(),
      epochs: 100,
      finalLoss: history.history.loss[history.history.loss.length - 1],
      dataPoints: historicalData.length
    };
    
    console.log('📊 Model Metadata:', metadata);
    console.log('💡 Save this metadata as: public/models/model-metadata.json');
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return { model, metadata };
  } catch (error) {
    console.error('❌ Error training model:', error);
    throw error;
  }
}

// Make prediction
async function testPrediction(model, metadata) {
  console.log('\n🔮 Testing prediction...');
  
  try {
    // Get last 3 data points
    const lastData = historicalData.slice(-3);
    const normalized = lastData.map(d => 
      (d.value - metadata.min) / (metadata.max - metadata.min)
    );
    
    // Create input tensor
    const inputTensor = tf.tensor3d([normalized.map(val => [val])]);
    
    // Make prediction
    const prediction = model.predict(inputTensor);
    const normalizedPrediction = await prediction.data();
    
    // Denormalize
    const predictedValue = normalizedPrediction[0] * (metadata.max - metadata.min) + metadata.min;
    
    console.log('📊 Input years:', lastData.map(d => d.year));
    console.log('📊 Input values:', lastData.map(d => d.value));
    console.log('🎯 Predicted value for 2024:', Math.round(predictedValue));
    
    // Clean up
    inputTensor.dispose();
    prediction.dispose();
    
  } catch (error) {
    console.error('❌ Error making prediction:', error);
  }
}

// Main execution
export async function runTraining() {
  console.log('🎓 Filipino Emigrant Forecasting Model Training');
  console.log('================================================\n');
  
  const { model, metadata } = await trainModel();
  await testPrediction(model, metadata);
  
  console.log('\n✅ Training complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Check your Downloads folder for model files');
  console.log('2. Create folder: public/models/');
  console.log('3. Move these files to public/models/:');
  console.log('   - filipino-emigrant-model.json');
  console.log('   - filipino-emigrant-model.weights.bin');
  console.log('4. Create public/models/model-metadata.json with the metadata shown above');
}

// Auto-run if this is the main module
if (typeof window !== 'undefined') {
  window.trainEmigrantModel = runTraining;
  console.log('💡 Run: window.trainEmigrantModel() in browser console to train model');
}
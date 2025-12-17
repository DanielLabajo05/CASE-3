/**
 * Filipino Emigrant Forecasting Model Training Script (Node.js)
 * Run this with: node trainModel.js
 * 
 * Requirements:
 * npm install @tensorflow/tfjs-node csv-parser fs
 */

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const csv = require('csv-parser');

// Configuration
const CONFIG = {
  csvFile: 'emigrant_data.csv',
  attribute: 'total',  // 'total', 'male', or 'female'
  lookback: 5,
  trainTestSplit: 0.8,
  epochs: 100,
  batchSize: 16,
  patience: 20,
  outputModelPath: './public/models/filipino_emigrant_model',
  outputConfigPath: './public/models/filipino_emigrant_config.json'
};

class EmigrantForecaster {
  constructor(config) {
    this.config = config;
    this.scaler = { min: 0, max: 0, range: 0 };
    this.bestModel = null;
    this.bestModelType = null;
    this.bestScore = Infinity;
  }

  // Load CSV data
  async loadData() {
    return new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(this.config.csvFile)
        .pipe(csv())
        .on('data', (row) => {
          const year = parseInt(row.year);
          const value = parseFloat(row[this.config.attribute]);
          if (!isNaN(year) && !isNaN(value)) {
            data.push({ year, value });
          }
        })
        .on('end', () => {
          data.sort((a, b) => a.year - b.year);
          console.log(`✓ Loaded ${data.length} records from CSV`);
          console.log(`  Year range: ${data[0].year} - ${data[data.length - 1].year}`);
          console.log(`  Value range: ${Math.min(...data.map(d => d.value))} - ${Math.max(...data.map(d => d.value))}`);
          resolve(data);
        })
        .on('error', reject);
    });
  }

  // Normalize data to [0, 1]
  normalize(values) {
    this.scaler.min = Math.min(...values);
    this.scaler.max = Math.max(...values);
    this.scaler.range = this.scaler.max - this.scaler.min;
    
    return values.map(v => (v - this.scaler.min) / this.scaler.range);
  }

  // Denormalize data back to original scale
  denormalize(normalizedValues) {
    return normalizedValues.map(v => v * this.scaler.range + this.scaler.min);
  }

  // Create sequences for time series
  createSequences(data, lookback) {
    const X = [];
    const y = [];
    
    for (let i = lookback; i < data.length; i++) {
      X.push(data.slice(i - lookback, i));
      y.push(data[i]);
    }
    
    return { X, y };
  }

  // Build LSTM model
  buildLSTMModel(inputShape, units = 100, dropout = 0.2, learningRate = 0.001) {
    const model = tf.sequential();
    
    model.add(tf.layers.lstm({
      units: units,
      returnSequences: true,
      inputShape: inputShape
    }));
    model.add(tf.layers.dropout({ rate: dropout }));
    
    model.add(tf.layers.lstm({
      units: units,
      returnSequences: false
    }));
    model.add(tf.layers.dropout({ rate: dropout }));
    
    model.add(tf.layers.dense({ units: 50, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  // Build MLP model
  buildMLPModel(inputShape, units = 128, dropout = 0.2, learningRate = 0.001) {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: units,
      activation: 'relu',
      inputShape: [inputShape]
    }));
    model.add(tf.layers.dropout({ rate: dropout }));
    
    model.add(tf.layers.dense({ units: units, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: dropout }));
    
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  // Train model with early stopping
  async trainModel(model, X_train, y_train, X_val, y_val, modelType) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Training ${modelType} Model`);
    console.log('='.repeat(60));
    
    let bestValLoss = Infinity;
    let patience = this.config.patience;
    let patienceCount = 0;
    
    const history = {
      loss: [],
      valLoss: [],
      mae: [],
      valMae: []
    };
    
    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      const h = await model.fit(X_train, y_train, {
        validationData: [X_val, y_val],
        epochs: 1,
        batchSize: this.config.batchSize,
        verbose: 0
      });
      
      const loss = h.history.loss[0];
      const valLoss = h.history.val_loss[0];
      const mae = h.history.mae[0];
      const valMae = h.history.val_mae[0];
      
      history.loss.push(loss);
      history.valLoss.push(valLoss);
      history.mae.push(mae);
      history.valMae.push(valMae);
      
      if ((epoch + 1) % 10 === 0) {
        console.log(`Epoch ${epoch + 1}/${this.config.epochs} - Loss: ${loss.toFixed(6)} - Val Loss: ${valLoss.toFixed(6)}`);
      }
      
      // Early stopping logic
      if (valLoss < bestValLoss) {
        bestValLoss = valLoss;
        patienceCount = 0;
      } else {
        patienceCount++;
        if (patienceCount >= patience) {
          console.log(`Early stopping at epoch ${epoch + 1}`);
          break;
        }
      }
    }
    
    // Evaluate
    const predictions = model.predict(X_val);
    const predArray = await predictions.array();
    const yValArray = await y_val.array();
    
    // Calculate RMSE
    let sumSquaredError = 0;
    for (let i = 0; i < predArray.length; i++) {
      const error = yValArray[i][0] - predArray[i][0];
      sumSquaredError += error * error;
    }
    const rmse = Math.sqrt(sumSquaredError / predArray.length);
    
    console.log(`\n${modelType} Model Performance:`);
    console.log(`  RMSE: ${rmse.toFixed(6)}`);
    console.log(`  Final Val Loss: ${history.valLoss[history.valLoss.length - 1].toFixed(6)}`);
    
    // Cleanup
    predictions.dispose();
    
    return { model, rmse, history };
  }

  // Hyperparameter tuning
  async performHyperparameterTuning(X_train, y_train, X_val, y_val) {
    console.log('\n' + '='.repeat(60));
    console.log('HYPERPARAMETER TUNING');
    console.log('='.repeat(60));
    
    const lstmConfigs = [
      { units: 50, dropout: 0.2, learningRate: 0.001 },
      { units: 100, dropout: 0.2, learningRate: 0.001 },
      { units: 100, dropout: 0.3, learningRate: 0.0005 }
    ];
    
    const mlpConfigs = [
      { units: 64, dropout: 0.2, learningRate: 0.001 },
      { units: 128, dropout: 0.2, learningRate: 0.001 },
      { units: 128, dropout: 0.3, learningRate: 0.0005 }
    ];
    
    let bestLSTM = null;
    let bestLSTMScore = Infinity;
    
    // Train LSTM models
    console.log('\nTraining LSTM Models...');
    for (let i = 0; i < lstmConfigs.length; i++) {
      const config = lstmConfigs[i];
      console.log(`\nLSTM Config ${i + 1}: units=${config.units}, dropout=${config.dropout}, lr=${config.learningRate}`);
      
      const model = this.buildLSTMModel(
        [this.config.lookback, 1],
        config.units,
        config.dropout,
        config.learningRate
      );
      
      const result = await this.trainModel(model, X_train, y_train, X_val, y_val, 'LSTM');
      
      if (result.rmse < bestLSTMScore) {
        if (bestLSTM) bestLSTM.dispose();
        bestLSTM = result.model;
        bestLSTMScore = result.rmse;
      } else {
        result.model.dispose();
      }
    }
    
    let bestMLP = null;
    let bestMLPScore = Infinity;
    
    // Train MLP models
    console.log('\nTraining MLP Models...');
    for (let i = 0; i < mlpConfigs.length; i++) {
      const config = mlpConfigs[i];
      console.log(`\nMLP Config ${i + 1}: units=${config.units}, dropout=${config.dropout}, lr=${config.learningRate}`);
      
      const model = this.buildMLPModel(
        this.config.lookback,
        config.units,
        config.dropout,
        config.learningRate
      );
      
      // Reshape X for MLP (flatten)
      const X_train_flat = tf.reshape(X_train, [X_train.shape[0], this.config.lookback]);
      const X_val_flat = tf.reshape(X_val, [X_val.shape[0], this.config.lookback]);
      
      const result = await this.trainModel(model, X_train_flat, y_train, X_val_flat, y_val, 'MLP');
      
      X_train_flat.dispose();
      X_val_flat.dispose();
      
      if (result.rmse < bestMLPScore) {
        if (bestMLP) bestMLP.dispose();
        bestMLP = result.model;
        bestMLPScore = result.rmse;
      } else {
        result.model.dispose();
      }
    }
    
    // Select best model
    console.log('\n' + '='.repeat(60));
    console.log('BEST MODEL SELECTION');
    console.log('='.repeat(60));
    console.log(`Best LSTM RMSE: ${bestLSTMScore.toFixed(6)}`);
    console.log(`Best MLP RMSE:  ${bestMLPScore.toFixed(6)}`);
    
    if (bestLSTMScore < bestMLPScore) {
      this.bestModel = bestLSTM;
      this.bestModelType = 'LSTM';
      this.bestScore = bestLSTMScore;
      if (bestMLP) bestMLP.dispose();
    } else {
      this.bestModel = bestMLP;
      this.bestModelType = 'MLP';
      this.bestScore = bestMLPScore;
      if (bestLSTM) bestLSTM.dispose();
    }
    
    console.log(`\n✓ Selected: ${this.bestModelType} with RMSE ${this.bestScore.toFixed(6)}`);
  }

  // Save model and configuration
  async saveModel(data) {
    console.log('\n' + '='.repeat(60));
    console.log('SAVING MODEL');
    console.log('='.repeat(60));
    
    // Create models directory if it doesn't exist
    const dir = './public/models';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save model
    await this.bestModel.save(`file://${this.config.outputModelPath}`);
    console.log(`✓ Model saved to ${this.config.outputModelPath}`);
    
    // Save configuration
    const config = {
      model_type: this.bestModelType,
      lookback: this.config.lookback,
      attribute_name: this.config.attribute,
      best_score: this.bestScore,
      scaler_min: this.scaler.min,
      scaler_max: this.scaler.max,
      scaler_scale: this.scaler.range,
      years: data.map(d => d.year),
      values: data.map(d => d.value),
      trained_at: new Date().toISOString()
    };
    
    fs.writeFileSync(this.config.outputConfigPath, JSON.stringify(config, null, 2));
    console.log(`✓ Configuration saved to ${this.config.outputConfigPath}`);
  }

  async train() {
    console.log('='.repeat(60));
    console.log('FILIPINO EMIGRANT FORECASTING - MODEL TRAINING');
    console.log('='.repeat(60));
    
    // Load data
    const data = await this.loadData();
    const values = data.map(d => d.value);
    
    // Normalize
    console.log('\n📊 Normalizing data...');
    const normalizedValues = this.normalize(values);
    
    // Create sequences
    console.log('🔄 Creating sequences...');
    const { X, y } = this.createSequences(normalizedValues, this.config.lookback);
    console.log(`✓ Created ${X.length} sequences`);
    
    // Split train/test
    const splitIdx = Math.floor(X.length * this.config.trainTestSplit);
    const X_train_data = X.slice(0, splitIdx);
    const X_val_data = X.slice(splitIdx);
    const y_train_data = y.slice(0, splitIdx);
    const y_val_data = y.slice(splitIdx);
    
    console.log(`✓ Training samples: ${X_train_data.length}`);
    console.log(`✓ Validation samples: ${X_val_data.length}`);
    
    // Convert to tensors (LSTM format: [samples, timesteps, features])
    const X_train = tf.tensor3d(X_train_data.map(seq => seq.map(v => [v])));
    const X_val = tf.tensor3d(X_val_data.map(seq => seq.map(v => [v])));
    const y_train = tf.tensor2d(y_train_data.map(v => [v]));
    const y_val = tf.tensor2d(y_val_data.map(v => [v]));
    
    // Perform hyperparameter tuning
    await this.performHyperparameterTuning(X_train, y_train, X_val, y_val);
    
    // Save model
    await this.saveModel(data);
    
    // Cleanup
    X_train.dispose();
    X_val.dispose();
    y_train.dispose();
    y_val.dispose();
    
    console.log('\n' + '='.repeat(60));
    console.log('TRAINING COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nModel files created:');
    console.log(`  1. ${this.config.outputModelPath}/`);
    console.log(`  2. ${this.config.outputConfigPath}`);
    console.log('\n✓ Ready to use in your React app!');
  }
}

// Run training
async function main() {
  try {
    const forecaster = new EmigrantForecaster(CONFIG);
    await forecaster.train();
    process.exit(0);
  } catch (error) {
    console.error('Error during training:', error);
    process.exit(1);
  }
}

main();
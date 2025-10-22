// Configuration
const CONFIG = {
    apiEndpoint: 'http://127.0.0.1:5000/predict', // Update this to your Flask API endpoint
    imageSize: 224,
    numClasses: 38,
    soilFeatures: 6,
    weatherFeatures: 11,
    weatherShortSteps: 48,
    weatherFullSteps: 168,
    // Add your class labels here
    classLabels: [
        'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
        'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 
        'Cherry_(including_sour)___healthy', 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
        'Corn_(maize)___Common_rust_', 'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
        'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
        'Grape___healthy', 'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot',
        'Peach___healthy', 'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy',
        'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
        'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew',
        'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot',
        'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold',
        'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite',
        'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
        'Tomato___healthy'
    ]
};

// Global state
let currentImageFile = null;
let currentImageDataUrl = null;

// DOM Elements
const elements = {
    status: document.getElementById('status'),
    mainContent: document.getElementById('mainContent'),
    imageInput: document.getElementById('imageInput'),
    uploadArea: document.getElementById('uploadArea'),
    imageCanvas: document.getElementById('imageCanvas'),
    predictBtn: document.getElementById('predictBtn'),
    results: document.getElementById('results'),
    topDisease: document.getElementById('topDisease'),
    topConfidence: document.getElementById('topConfidence'),
    allPredictions: document.getElementById('allPredictions'),
    generateWeather: document.getElementById('generateWeather'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    weatherShort: document.getElementById('weatherShort'),
    weatherFull: document.getElementById('weatherFull')
};

// Initialize app
async function init() {
    updateStatus('Checking API connection...', false);
    
    // Test API connection with retry logic
    let connected = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!connected && attempts < maxAttempts) {
        attempts++;
        try {
            console.log(`Attempting to connect to API (attempt ${attempts}/${maxAttempts})...`);
            console.log(`API URL: ${CONFIG.apiEndpoint.replace('/predict', '/health')}`);
            
            const response = await fetch(CONFIG.apiEndpoint.replace('/predict', '/health'), {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);
                updateStatus('✓ API connected successfully!', true);
                connected = true;
            } else {
                console.error('API returned error:', response.status, response.statusText);
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error(`Connection attempt ${attempts} failed:`, error);
            if (attempts < maxAttempts) {
                updateStatus(`Retrying connection (${attempts}/${maxAttempts})...`, false);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    if (!connected) {
        updateStatus('⚠️ Could not connect to API. Make sure Flask server is running at ' + CONFIG.apiEndpoint, false, true);
        console.error('Failed to connect after', maxAttempts, 'attempts');
        console.error('Please ensure:');
        console.error('1. Flask server is running (python app.py)');
        console.error('2. Server is accessible at:', CONFIG.apiEndpoint);
        console.error('3. CORS is properly configured');
    }
    
    setTimeout(() => {
        elements.mainContent.style.display = 'block';
    }, connected ? 1500 : 3000);
    
    setupEventListeners();
}

function updateStatus(message, success = false, error = false) {
    elements.status.innerHTML = success || error ? 
        `<span style="color: ${error ? '#d32f2f' : '#4caf50'}">${message}</span>` :
        `<div class="loader"></div><span>${message}</span>`;
}

function setupEventListeners() {
    // Image upload
    elements.imageInput.addEventListener('change', handleImageUpload);
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.style.background = '#f0f4ff';
    });
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.style.background = 'white';
    });
    elements.uploadArea.addEventListener('drop', handleImageDrop);
    
    // Weather tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchWeatherTab(btn.dataset.tab));
    });
    
    // Generate sample weather data
    elements.generateWeather.addEventListener('click', generateSampleWeather);
    
    // Predict button
    elements.predictBtn.addEventListener('click', predict);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) loadImage(file);
}

function handleImageDrop(e) {
    e.preventDefault();
    elements.uploadArea.style.background = 'white';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function loadImage(file) {
    currentImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageDataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
            displayImage(img);
            elements.uploadArea.style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayImage(img) {
    const canvas = elements.imageCanvas;
    const ctx = canvas.getContext('2d');
    
    const maxWidth = 600;
    const scale = Math.min(1, maxWidth / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.style.display = 'block';
}

function switchWeatherTab(tab) {
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    elements.weatherShort.style.display = tab === 'short' ? 'block' : 'none';
    elements.weatherFull.style.display = tab === 'full' ? 'block' : 'none';
}

function generateSampleWeather() {
    // Generate sample data for both short and full windows
    // Short window (48 timesteps)
    const airTempShort = generateRandomArray(CONFIG.weatherShortSteps, 15, 30);
    const relHumidShort = generateRandomArray(CONFIG.weatherShortSteps, 40, 90);
    const leafWetnessShort = generateRandomArray(CONFIG.weatherShortSteps, 0, 24, 0);
    const precipShort = generateRandomArray(CONFIG.weatherShortSteps, 0, 5);
    const soilMoistureShort = generateRandomArray(CONFIG.weatherShortSteps, 0.15, 0.35);
    const dewPointShort = generateRandomArray(CONFIG.weatherShortSteps, 10, 20);
    const vpdShort = generateRandomArray(CONFIG.weatherShortSteps, 0.5, 2.5);
    const windSpeedShort = generateRandomArray(CONFIG.weatherShortSteps, 0, 8);
    const solarShort = generateRandomArray(CONFIG.weatherShortSteps, 0, 1000, 0);
    const soilTempShort = generateRandomArray(CONFIG.weatherShortSteps, 15, 25);
    const frostFlagShort = generateRandomArray(CONFIG.weatherShortSteps, 0, 1, 0).map(v => Math.round(v));
    
    // Full window (168 timesteps)
    const airTempFull = generateRandomArray(CONFIG.weatherFullSteps, 15, 30);
    const relHumidFull = generateRandomArray(CONFIG.weatherFullSteps, 40, 90);
    const leafWetnessFull = generateRandomArray(CONFIG.weatherFullSteps, 0, 24, 0);
    const precipFull = generateRandomArray(CONFIG.weatherFullSteps, 0, 5);
    const soilMoistureFull = generateRandomArray(CONFIG.weatherFullSteps, 0.15, 0.35);
    const dewPointFull = generateRandomArray(CONFIG.weatherFullSteps, 10, 20);
    const vpdFull = generateRandomArray(CONFIG.weatherFullSteps, 0.5, 2.5);
    const windSpeedFull = generateRandomArray(CONFIG.weatherFullSteps, 0, 8);
    const solarFull = generateRandomArray(CONFIG.weatherFullSteps, 0, 1000, 0);
    const soilTempFull = generateRandomArray(CONFIG.weatherFullSteps, 15, 25);
    const frostFlagFull = generateRandomArray(CONFIG.weatherFullSteps, 0, 1, 0).map(v => Math.round(v));
    
    // Populate short window fields
    document.getElementById('air_temp_short').value = airTempShort.join(',');
    document.getElementById('rel_humidity_short').value = relHumidShort.join(',');
    document.getElementById('leaf_wetness_short').value = leafWetnessShort.join(',');
    document.getElementById('precip_short').value = precipShort.join(',');
    document.getElementById('soil_moisture_short').value = soilMoistureShort.join(',');
    document.getElementById('dew_point_short').value = dewPointShort.join(',');
    document.getElementById('vpd_short').value = vpdShort.join(',');
    document.getElementById('wind_speed_short').value = windSpeedShort.join(',');
    document.getElementById('solar_short').value = solarShort.join(',');
    document.getElementById('soil_temp_short').value = soilTempShort.join(',');
    document.getElementById('frost_flag_short').value = frostFlagShort.join(',');
    
    // Populate full window fields
    document.getElementById('air_temp_full').value = airTempFull.join(',');
    document.getElementById('rel_humidity_full').value = relHumidFull.join(',');
    document.getElementById('leaf_wetness_full').value = leafWetnessFull.join(',');
    document.getElementById('precip_full').value = precipFull.join(',');
    document.getElementById('soil_moisture_full').value = soilMoistureFull.join(',');
    document.getElementById('dew_point_full').value = dewPointFull.join(',');
    document.getElementById('vpd_full').value = vpdFull.join(',');
    document.getElementById('wind_speed_full').value = windSpeedFull.join(',');
    document.getElementById('solar_full').value = solarFull.join(',');
    document.getElementById('soil_temp_full').value = soilTempFull.join(',');
    document.getElementById('frost_flag_full').value = frostFlagFull.join(',');
}

function generateRandomArray(length, min, max, decimals = 2) {
    return Array.from({length}, () => 
        (Math.random() * (max - min) + min).toFixed(decimals)
    );
}

function getSoilData() {
    // Order: pH, nitrogen, phosphorus, potassium, temperature, humidity
    return [
        parseFloat(document.getElementById('soil_ph').value) || 0,
        parseFloat(document.getElementById('soil_nitrogen').value) || 0,
        parseFloat(document.getElementById('soil_phosphorus').value) || 0,
        parseFloat(document.getElementById('soil_potassium').value) || 0,
        parseFloat(document.getElementById('soil_temperature').value) || 0,
        parseFloat(document.getElementById('soil_humidity').value) || 0
    ];
}

function getWeatherData(isShort = true) {
    const prefix = isShort ? 'short' : 'full';
    const steps = isShort ? CONFIG.weatherShortSteps : CONFIG.weatherFullSteps;
    
    // Read all 11 weather features
    const airTempStr = document.getElementById(`air_temp_${prefix}`).value;
    const relHumidStr = document.getElementById(`rel_humidity_${prefix}`).value;
    const leafWetnessStr = document.getElementById(`leaf_wetness_${prefix}`).value;
    const precipStr = document.getElementById(`precip_${prefix}`).value;
    const soilMoistureStr = document.getElementById(`soil_moisture_${prefix}`).value;
    const dewPointStr = document.getElementById(`dew_point_${prefix}`).value;
    const vpdStr = document.getElementById(`vpd_${prefix}`).value;
    const windSpeedStr = document.getElementById(`wind_speed_${prefix}`).value;
    const solarStr = document.getElementById(`solar_${prefix}`).value;
    const soilTempStr = document.getElementById(`soil_temp_${prefix}`).value;
    const frostFlagStr = document.getElementById(`frost_flag_${prefix}`).value;
    
    // Parse each feature
    const airTemp = parseArray(airTempStr, steps);
    const relHumid = parseArray(relHumidStr, steps);
    const leafWetness = parseArray(leafWetnessStr, steps);
    const precip = parseArray(precipStr, steps);
    const soilMoisture = parseArray(soilMoistureStr, steps);
    const dewPoint = parseArray(dewPointStr, steps);
    const vpd = parseArray(vpdStr, steps);
    const windSpeed = parseArray(windSpeedStr, steps);
    const solar = parseArray(solarStr, steps);
    const soilTemp = parseArray(soilTempStr, steps);
    const frostFlag = parseArray(frostFlagStr, steps);
    
    // Combine into shape [timesteps, features]
    // Order: air_temp, rel_humidity, leaf_wetness, precip, soil_moisture, 
    //        dew_point, vpd, wind_speed, solar, soil_temp, frost_flag
    const weatherData = [];
    for (let i = 0; i < steps; i++) {
        weatherData.push([
            airTemp[i],
            relHumid[i],
            leafWetness[i],
            precip[i],
            soilMoisture[i],
            dewPoint[i],
            vpd[i],
            windSpeed[i],
            solar[i],
            soilTemp[i],
            frostFlag[i]
        ]);
    }
    
    return weatherData;
}

function parseArray(str, expectedLength) {
    const arr = str.split(',').map(v => parseFloat(v.trim()) || 0);
    
    // Pad or truncate to expected length
    if (arr.length < expectedLength) {
        return [...arr, ...Array(expectedLength - arr.length).fill(0)];
    }
    return arr.slice(0, expectedLength);
}

async function predict() {
    if (!currentImageFile) {
        alert('Please upload an image first!');
        return;
    }
    
    elements.predictBtn.disabled = true;
    elements.predictBtn.textContent = '🔄 Processing...';
    
    try {
        console.log('Starting prediction...');
        
        // Prepare data payload
        const formData = new FormData();
        formData.append('image', currentImageFile);
        
        // Add soil data
        const soilData = getSoilData();
        console.log('Soil data:', soilData);
        formData.append('soil_data', JSON.stringify(soilData));
        
        // Add weather data
        const weatherShort = getWeatherData(true);
        const weatherFull = getWeatherData(false);
        console.log('Weather short shape:', weatherShort.length, 'x', weatherShort[0].length);
        console.log('Weather full shape:', weatherFull.length, 'x', weatherFull[0].length);
        formData.append('weather_short', JSON.stringify(weatherShort));
        formData.append('weather_full', JSON.stringify(weatherFull));
        
        console.log('Sending request to:', CONFIG.apiEndpoint);
        
        // Make API request
        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }
        
        const result = await response.json();
        console.log('Prediction result:', result);
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        if (!result.predictions || !Array.isArray(result.predictions)) {
            throw new Error('Invalid response format from API');
        }
        
        // Display results
        displayResults(result.predictions);
        
    } catch (error) {
        console.error('Prediction error:', error);
        let errorMessage = 'Error during prediction: ' + error.message;
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += '\n\nPossible causes:\n' +
                '1. Flask server is not running\n' +
                '2. CORS is not properly configured\n' +
                '3. Wrong API endpoint URL\n\n' +
                'Current endpoint: ' + CONFIG.apiEndpoint;
        }
        
        alert(errorMessage);
    } finally {
        elements.predictBtn.disabled = false;
        elements.predictBtn.textContent = '🔍 Classify Disease';
    }
}

function displayResults(probabilities) {
    // Sort predictions by confidence
    const predictions = probabilities
        .map((prob, idx) => ({
            label: CONFIG.classLabels[idx] || `Class ${idx}`,
            probability: prob
        }))
        .sort((a, b) => b.probability - a.probability);
    
    // Display top prediction
    const top = predictions[0];
    elements.topDisease.textContent = top.label.replace(/_/g, ' ');
    elements.topConfidence.textContent = `${(top.probability * 100).toFixed(1)}%`;
    
    // Display all predictions
    elements.allPredictions.innerHTML = predictions
        .filter(p => p.probability > 0.01) // Only show > 1%
        .slice(0, 10) // Top 10
        .map(p => `
            <div class="prediction-item">
                <span class="prediction-label">${p.label.replace(/_/g, ' ')}</span>
                <div class="prediction-bar-container">
                    <div class="prediction-bar" style="width: ${p.probability * 100}%"></div>
                </div>
                <span class="prediction-value">${(p.probability * 100).toFixed(1)}%</span>
            </div>
        `).join('');
    
    elements.results.style.display = 'block';
    elements.results.scrollIntoView({ behavior: 'smooth' });
}

// Start the app
init();
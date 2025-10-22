from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import keras
import numpy as np
from PIL import Image
import io
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
MODEL_PATH = r'C:\Users\omgha\OneDrive\Documents\GitHub\MMTL-Plant_disease_detection\project\Backend\fusion_model_4in_f.h5'  # Update this path
IMAGE_SIZE = 224
NUM_CLASSES = 38

# Load model at startup
print("Loading model...")
model = keras.models.load_model(MODEL_PATH)
print("Model loaded successfully!")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'API is running'})

@app.route('/predict', methods=['POST'])
def predict():
    """
    Prediction endpoint
    Expects:
    - image: image file
    - soil_data: JSON string with 6 soil parameters
    - weather_short: JSON string with 48 timesteps x 11 features
    - weather_full: JSON string with 168 timesteps x 11 features
    """
    try:
        # Check if image is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        
        # Get other data
        soil_data = json.loads(request.form.get('soil_data', '[]'))
        weather_short = json.loads(request.form.get('weather_short', '[]'))
        weather_full = json.loads(request.form.get('weather_full', '[]'))
        
        # Validate data
        if len(soil_data) != 6:
            return jsonify({'error': 'Soil data must have 6 features'}), 400
        if len(weather_short) != 48:
            return jsonify({'error': 'Weather short must have 48 timesteps'}), 400
        if len(weather_full) != 168:
            return jsonify({'error': 'Weather full must have 168 timesteps'}), 400
        
        # Preprocess image
        image = Image.open(io.BytesIO(image_file.read()))
        image = image.convert('RGB')
        image = image.resize((IMAGE_SIZE, IMAGE_SIZE))
        image_array = np.array(image)
        image_array = image_array / 127.5 - 1  # Normalize to [-1, 1] for MobileNet
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension
        
        # Prepare soil data
        soil_array = np.array([soil_data], dtype=np.float32)
        
        # Prepare weather data
        weather_short_array = np.array([weather_short], dtype=np.float32)
        weather_full_array = np.array([weather_full], dtype=np.float32)
        
        # Make prediction
        predictions = model.predict([
            image_array,
            soil_array,
            weather_short_array,
            weather_full_array
        ])
        
        # Convert predictions to list
        predictions_list = predictions[0].tolist()
        
        return jsonify({
            'success': True,
            'predictions': predictions_list
        })
        
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
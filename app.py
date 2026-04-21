from flask import Flask, render_template, request, jsonify
import os
import time
from werkzeug.utils import secure_filename
from utils.ai_service import analyze_food_image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    if '.' not in filename:
        return False
    return filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'food_image' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['food_image']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload JPG, PNG, JPEG, GIF, WEBP, BMP, or TIFF.'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    if not os.path.exists(filepath):
        return jsonify({'error': 'Failed to save image'}), 500

    try:
        start_time = time.time()
        ai_results = analyze_food_image(filepath)

        if ai_results is None:
            return jsonify({'error': 'AI analysis failed. Please check your Groq API key.'}), 500

        results = []
        total_calories = total_protein = total_fat = total_carbs = 0

        for item in ai_results:
            results.append({
                'food_name': item.get('name', 'Unknown'),
                'quantity': item.get('quantity', '1 portion'),
                'calories': item.get('calories', 0),
                'protein': item.get('protein', 0),
                'fat': item.get('fat', 0),
                'carbs': item.get('carbs', 0),
                'source': 'Groq AI'
            })
            total_calories += item.get('calories', 0)
            total_protein += item.get('protein', 0)
            total_fat += item.get('fat', 0)
            total_carbs += item.get('carbs', 0)

        processing_time = round(time.time() - start_time, 2)

        return render_template('result.html',
                               results=results,
                               total_calories=round(total_calories, 2),
                               total_protein=round(total_protein, 2),
                               total_fat=round(total_fat, 2),
                               total_carbs=round(total_carbs, 2),
                               image_url=filename,
                               processing_time=processing_time,
                               data_sources=['Groq AI'])

    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500



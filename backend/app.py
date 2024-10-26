from flask import Flask, jsonify,request
from flask_cors import CORS
import requests
import mysql.connector
from datetime import datetime, timedelta
import time
import threading
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
cors = CORS(app,origins=["*"])

# OpenWeatherMap API configuration
API_KEY = os.getenv('OPENWEATHERMAP_API_KEY')
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "http://api.openweathermap.org/data/2.5/forecast"


# MySQL configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': 'weather_monitoring'
}

# Cities to monitor
CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad']

def kelvin_to_celsius(kelvin):
    return kelvin - 273.15

def fetch_weather_data(city):
    params = {
        'q': city,
        'appid': API_KEY,
        'units': 'metric'
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    
    if response.status_code != 200:
        print(f"Error fetching weather data for {city}: {data.get('message', 'Unknown error')}")
        return None

    # Convert UNIX timestamp to datetime
    dt = datetime.fromtimestamp(data['dt']).strftime('%Y-%m-%d %H:%M:%S')
    
    return {
        'city': city,
        'main': data['weather'][0]['main'],
        'temp': data['main']['temp'],
        'feels_like': data['main']['feels_like'],
        'humidity': data['main']['humidity'],  # New parameter
        'wind_speed': data['wind']['speed'],    # New parameter
        'dt': dt  
    }

def fetch_weather_forecast(city):
    params = {
        'q': city,
        'appid': API_KEY,
        'units': 'metric'
    }
    response = requests.get(FORECAST_URL, params=params)
    data = response.json()

    if response.status_code != 200:
        print(f"Error fetching weather forecast for {city}: {data.get('message', 'Unknown error')}")
        return None

    forecasts = []
    for item in data['list']:
        forecast = {
            'dt': datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d %H:%M:%S'),
            'temp': item['main']['temp'],
            'feels_like': item['main']['feels_like'],
            'humidity': item['main']['humidity'],
            'wind_speed': item['wind']['speed'],
            'weather': item['weather'][0]['description']
        }
        forecasts.append(forecast)

    return forecasts

def store_weather_data(data):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if the entry already exists
        check_query = """
        SELECT COUNT(*) FROM weather_data 
        WHERE city = %s AND dt = %s
        """
        cursor.execute(check_query, (data['city'], data['dt']))
        exists = cursor.fetchone()[0]
        
        if exists == 0:
            query = """
            INSERT INTO weather_data (city, main, temp, feels_like, humidity, wind_speed, dt)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (data['city'], data['main'], data['temp'], data['feels_like'], data['humidity'], data['wind_speed'], data['dt'])
            cursor.execute(query, values)
            conn.commit()
    except mysql.connector.Error as err:
        print(f"Error storing weather data: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


def calculate_daily_summary():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        yesterday = datetime.now() - timedelta(days=1)
        yesterday_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        for city in CITIES:
            query = """
            SELECT AVG(temp) as avg_temp, MAX(temp) as max_temp, MIN(temp) as min_temp, 
                   GROUP_CONCAT(main) as weather_conditions
            FROM weather_data
            WHERE city = %s AND dt BETWEEN %s AND %s
            """
            cursor.execute(query, (city, yesterday_start.timestamp(), yesterday_end.timestamp()))
            result = cursor.fetchone()
            
            if result:
                avg_temp, max_temp, min_temp, weather_conditions = result
                
                # Check if avg_temp is None
                if avg_temp is not None and max_temp is not None and min_temp is not None:
                    # Only process if valid data is found
                    if weather_conditions:
                        conditions_list = weather_conditions.split(',')
                        dominant_condition = max(set(conditions_list), key=conditions_list.count)
                    else:
                        dominant_condition = None  # or a default value
                    
                    summary_query = """
                    INSERT INTO daily_summaries (city, date, avg_temp, max_temp, min_temp, dominant_condition)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """
                    summary_values = (city, yesterday.date(), avg_temp, max_temp, min_temp, dominant_condition)
                    cursor.execute(summary_query, summary_values)
        
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error calculating daily summary: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()



def check_alerts():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        for city in CITIES:
            query = """
            SELECT temp
            FROM weather_data
            WHERE city = %s
            ORDER BY dt DESC
            LIMIT 2
            """
            cursor.execute(query, (city,))
            results = cursor.fetchall()
            
            if len(results) == 2 and all(temp > 35 for temp, in results):
                alert_query = """
                INSERT INTO alerts (city, message, timestamp)
                VALUES (%s, %s, %s)
                """
                alert_message = f"Temperature exceeded 35°C for two consecutive updates"
                cursor.execute(alert_query, (city, alert_message, datetime.now()))
        
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error checking alerts: {err}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def update_weather_data():
    while True:
        try:
            for city in CITIES:
                data = fetch_weather_data(city)
                if data:  # Only store data if it's not None
                    store_weather_data(data)
            
            calculate_daily_summary()
            check_alerts()
        except Exception as e:
            print(f"Error in update_weather_data: {e}")
        
        time.sleep(300)  # Wait for 5 minutes

@app.route('/api/weather')
def get_weather(*args, **kwargs):
    city = request.args.get('city')  # Get the 'city' parameter from the request query
    duration = request.args.get('duration')  # Get the 'duration' parameter
    print(city, duration)
    
    # Calculate the timestamp cutoff based on the duration
    cutoff_dt = None
    if duration == '1':
        cutoff_dt = datetime.now() - timedelta(hours=1)
    elif duration == '6':
        cutoff_dt = datetime.now() - timedelta(hours=6)
    elif duration == '12':
        cutoff_dt = datetime.now() - timedelta(hours=12)
    elif duration == '24':
        cutoff_dt = datetime.now() - timedelta(days=1)
    else:
        cutoff_dt = datetime.now() - timedelta(days=5)  # Default to the last 5 days if no valid duration is provided

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        if city:
            # Query for a specific city within the specified duration
            query = """
            SELECT *
            FROM weather_data
            WHERE city = %s AND dt >= %s
            ORDER BY dt
            """
            cursor.execute(query, (city, cutoff_dt))
        else:
            # Query for all cities within the specified duration
            query = """
            SELECT *
            FROM weather_data
            WHERE dt >= %s
            ORDER BY dt
            """
            cursor.execute(query, (cutoff_dt,))

        results = cursor.fetchall()
        return jsonify(results)

    except mysql.connector.Error as err:
        print(f"Error fetching weather data: {err}")
        return jsonify({"error": "Internal Server Error"}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


@app.route('/api/alerts')
def get_alerts():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT *
        FROM alerts
        ORDER BY timestamp DESC
        LIMIT 100
        """
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"Fetched alerts: {results}")  # Log the fetched alerts
        
        return jsonify(results)
    except mysql.connector.Error as err:
        print(f"Error fetching alerts: {err}")
        return jsonify({"error": "Internal Server Error"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/forecast')
def get_forecast():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    forecast_data = fetch_weather_forecast(city)
    if forecast_data is None:
        return jsonify({"error": "Unable to fetch forecast data"}), 500

    return jsonify(forecast_data)

if __name__ == '__main__':
    update_thread = threading.Thread(target=update_weather_data)
    update_thread.start()
    
    app.run(debug=True, port=5001)
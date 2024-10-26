# Weather Monitoring System

This project is a real-time weather monitoring system that retrieves data from the OpenWeatherMap API, processes it, and displays it through a web interface. The system uses React for the frontend, Flask for the backend, and MySQL for data storage.

## Features

- Real-time weather data for 6 major Indian cities
- Daily weather summaries with aggregates
- Temperature trend visualization
- Weather alerts based on configurable thresholds

## Prerequisites

- Node.js (v14 or later)
- Python (v3.7 or later)
- MySQL

## Setup Instructions

### Frontend Setup

1. Navigate to the project root directory.
2. Install dependencies:
   ```
   npm install --force
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup

1. Navigate to the `backend` directory.
2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Set up the MySQL database:
   - Create a database named `weather_monitoring`
   - Create the following tables:
     ```sql
     CREATE TABLE weather_data (
       id INT AUTO_INCREMENT PRIMARY KEY,
       city VARCHAR(50),
       main VARCHAR(50),
       temp FLOAT,
       feels_like FLOAT,
       dt INT
     );

     CREATE TABLE daily_summaries (
       id INT AUTO_INCREMENT PRIMARY KEY,
       city VARCHAR(50),
       date DATE,
       avg_temp FLOAT,
       max_temp FLOAT,
       min_temp FLOAT,
       dominant_condition VARCHAR(50)
     );

     CREATE TABLE alerts (
       id INT AUTO_INCREMENT PRIMARY KEY,
       city VARCHAR(50),
       message TEXT,
       timestamp DATETIME
     );

     for more refer mysqldatabase.db file in backend folder
     ```
5. Create a `.env` file in the `backend` directory with the following content:
   ```
   OPENWEATHERMAP_API_KEY=1e4c9483855d99123bb34dfc55bb15b3
   MYSQL_PASSWORD=Password
   ```
6. Start the Flask server:
   ```
   python app.py
   ```

## Design Choices

1. **Frontend**: React was chosen for its component-based architecture and efficient rendering. The use of React Query simplifies data fetching and caching.

2. **Backend**: Flask was selected for its simplicity and flexibility. It provides a lightweight framework for creating RESTful APIs.

3. **Database**: MySQL was chosen for its reliability and ability to handle structured data efficiently. It's well-suited for storing time-series data like weather records.

4. **Real-time Updates**: The frontend uses React Query's `refetchInterval` to periodically fetch new data, while the backend uses a separate thread to update weather data every 5 minutes.

5. **Visualization**: Recharts library is used for creating interactive and responsive charts to display temperature trends.

6. **Alerting System**: A simple threshold-based alerting system is implemented, which can be easily extended for more complex conditions.

## Dependencies

### Frontend
- React
- React Query
- Axios
- Recharts
- Lucide React (for icons)
- Tailwind CSS (for styling)

### Backend
- Flask
- Flask-CORS
- mysql-connector-python
- requests
- python-dotenv

## Running in Production

For production deployment:

1. Build the frontend:
   ```
   npm run build
   ```
2. Serve the built files using a production-ready web server like Nginx.
3. Run the Flask backend using a production WSGI server like Gunicorn:
   ```
   gunicorn app:app
   ```
4. Set up a reverse proxy to forward API requests to the Flask backend.

## Application Images
![image](https://github.com/user-attachments/assets/e50af2af-7516-48bd-9a07-6a5c103f063b)
![image](https://github.com/user-attachments/assets/2a18430d-f0ab-447d-91c9-13f3bb95afb2)





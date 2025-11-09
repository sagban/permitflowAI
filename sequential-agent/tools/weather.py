"""Tool for weather snapshot using Google Maps Platform Weather API."""

from typing import Dict, Any
from datetime import datetime
import requests
import os
from ..config.settings import WEATHER_API_KEY
from ..schemas.weather_schema import WeatherSnapshot, Coordinates


def _extract_weather_data(data: Dict[str, Any], lat: float, lon: float) -> WeatherSnapshot:
    """
    Extract and normalize weather data from Google Weather API response.
    
    Args:
        data: Raw API response JSON
        lat: Latitude
        lon: Longitude
    
    Returns:
        WeatherSnapshot model instance
    """
    current_conditions = data.get("currentConditions", {})
    
    if not current_conditions:
        raise ValueError("No current conditions in API response")
    
    # Extract temperature (in Celsius if units=METRIC)
    temperature = current_conditions.get("temperature", {})
    temp_c = temperature.get("value", 0) if isinstance(temperature, dict) else temperature
    
    # Extract wind speed (in km/h if units=METRIC)
    wind_speed = current_conditions.get("windSpeed", {})
    if isinstance(wind_speed, dict):
        wind_kph = wind_speed.get("value", 0)
        # Convert from m/s to km/h if needed (check unit)
        wind_unit = wind_speed.get("unit", "").upper()
        if wind_unit == "M_S" or wind_unit == "M/S":
            wind_kph = wind_kph * 3.6
    else:
        wind_kph = wind_speed if isinstance(wind_speed, (int, float)) else 0
    
    # Extract precipitation probability
    precipitation = current_conditions.get("precipitation", {})
    if isinstance(precipitation, dict):
        precip_prob = precipitation.get("probability", {})
        if isinstance(precip_prob, dict):
            precip_chance = precip_prob.get("value", 0)
        else:
            precip_chance = 0
        
        # If no probability, check intensity
        if precip_chance == 0:
            precip_intensity = precipitation.get("intensity", {})
            if isinstance(precip_intensity, dict) and precip_intensity.get("value", 0) > 0:
                precip_chance = 50  # If there's intensity, estimate chance
    else:
        precip_chance = 0
    
    # Extract condition description
    condition = current_conditions.get("condition", "UNKNOWN")
    if isinstance(condition, dict):
        condition_text = condition.get("text", "Unknown")
    else:
        condition_text = str(condition)
    
    # Extract humidity (percentage)
    humidity = current_conditions.get("humidity", 0)
    if isinstance(humidity, dict):
        humidity = humidity.get("value", 0)
    
    # Extract pressure if available
    pressure = current_conditions.get("pressure", {})
    if isinstance(pressure, dict):
        pressure_value = pressure.get("value", 0)
    else:
        pressure_value = pressure if isinstance(pressure, (int, float)) else None
    
    # Extract visibility if available
    visibility = current_conditions.get("visibility", {})
    if isinstance(visibility, dict):
        visibility_value = visibility.get("value", 0)
        visibility_unit = visibility.get("unit", "").upper()
        # Convert to km if needed
        if visibility_unit == "M" or visibility_unit == "METERS":
            visibility_value = visibility_value / 1000
        elif visibility_unit == "MI" or visibility_unit == "MILES":
            visibility_value = visibility_value * 1.60934
    else:
        visibility_value = visibility if isinstance(visibility, (int, float)) else None
    
    # If precipitation chance is still 0, estimate from condition
    if precip_chance == 0:
        condition_lower = condition_text.lower()
        if "rain" in condition_lower or "drizzle" in condition_lower:
            precip_chance = 80
        elif "thunderstorm" in condition_lower or "storm" in condition_lower:
            precip_chance = 90
        elif "snow" in condition_lower:
            precip_chance = 70
        elif "cloud" in condition_lower:
            precip_chance = 30
        else:
            # Use humidity as rough indicator
            precip_chance = max(0, min(100, humidity - 30))
    
    # Build and return WeatherSnapshot model
    return WeatherSnapshot(
        windKph=round(wind_kph, 1),
        tempC=round(temp_c, 1),
        precipChance=round(precip_chance, 0),
        conditions=condition_text.title(),
        humidity=round(humidity, 0) if isinstance(humidity, (int, float)) else humidity,
        pressure=round(pressure_value, 1) if pressure_value else None,
        visibility=round(visibility_value, 2) if visibility_value else None,
        coordinates=Coordinates(lat=lat, lon=lon),
        timestamp=datetime.utcnow().isoformat() + "Z"
    )


def get_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get weather snapshot for a location using Google Maps Platform Weather API.
    
    Args:
        lat: Latitude of the location
        lon: Longitude of the location
    
    Returns:
        Weather data dictionary with windKph, tempC, precipChance, conditions, humidity
    """
    # Use Google Maps API key (can be same as GCP project API key)
    api_key = WEATHER_API_KEY or os.getenv("GOOGLE_MAPS_API_KEY")
    
    # Check if API key is available
    if not api_key:
        # Return default WeatherSnapshot if API key not configured
        return WeatherSnapshot(
            windKph=30.0,
            tempC=30.0,
            precipChance=15.0,
            conditions="Clear",
            humidity=60.0,
            coordinates=Coordinates(lat=lat, lon=lon),
            timestamp=datetime.utcnow().isoformat() + "Z",
            note="Google Maps Weather API key not configured, using default values"
        ).model_dump()
    
    try:
        # Google Maps Platform Weather API endpoint for current conditions
        # Format: https://weather.googleapis.com/v1/currentConditions:lookup
        base_url = "https://weather.googleapis.com/v1/currentConditions:lookup"
        
        # API parameters - Google Weather API uses nested location parameters
        params = {
            "location.latitude": lat,
            "location.longitude": lon,
            "key": api_key,
            "units": "METRIC"  # Get temperature in Celsius, wind in km/h
        }
        
        # Make API request
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract and normalize weather data using Pydantic model
        weather_snapshot = _extract_weather_data(data, lat, lon)
        
        # Return as dictionary (for ADK tool compatibility)
        return weather_snapshot.model_dump()
        
    except requests.exceptions.RequestException as e:
        # If API call fails, return fallback WeatherSnapshot with error
        return WeatherSnapshot(
            windKph=30.0,
            tempC=30.0,
            precipChance=15.0,
            conditions="Unknown",
            humidity=60.0,
            coordinates=Coordinates(lat=lat, lon=lon),
            timestamp=datetime.utcnow().isoformat() + "Z",
            error=f"Google Maps Weather API error: {str(e)}",
            note="Using default values due to API error"
        ).model_dump()
    except Exception as e:
        # Handle any other errors
        return WeatherSnapshot(
            windKph=30.0,
            tempC=30.0,
            precipChance=15.0,
            conditions="Unknown",
            humidity=60.0,
            coordinates=Coordinates(lat=lat, lon=lon),
            timestamp=datetime.utcnow().isoformat() + "Z",
            error=f"Unexpected error: {str(e)}",
            note="Using default values due to error"
        ).model_dump()

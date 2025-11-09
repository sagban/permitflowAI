"""Schema for weather data from Google Maps Platform Weather API."""

from typing import Optional
from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    """Geographic coordinates."""
    lat: float = Field(description="Latitude")
    lon: float = Field(description="Longitude")


class WeatherSnapshot(BaseModel):
    """Weather snapshot data."""
    windKph: float = Field(description="Wind speed in kilometers per hour")
    tempC: float = Field(description="Temperature in Celsius")
    precipChance: float = Field(ge=0, le=100, description="Precipitation chance percentage (0-100)")
    conditions: str = Field(description="Weather conditions description")
    humidity: float = Field(ge=0, le=100, description="Humidity percentage (0-100)")
    pressure: Optional[float] = Field(default=None, description="Atmospheric pressure in hPa")
    visibility: Optional[float] = Field(default=None, description="Visibility in kilometers")
    coordinates: Coordinates = Field(description="Location coordinates")
    timestamp: str = Field(description="ISO timestamp of the weather data")
    note: Optional[str] = Field(default=None, description="Optional note or warning")
    error: Optional[str] = Field(default=None, description="Error message if API call failed")


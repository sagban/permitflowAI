"""Utilities for converting Pydantic schemas to JSON schemas for ADK."""

from typing import Dict, Any
from pydantic import BaseModel
import json


def pydantic_to_json_schema(model: type[BaseModel]) -> Dict[str, Any]:
    """Convert Pydantic model to JSON schema."""
    return model.model_json_schema()


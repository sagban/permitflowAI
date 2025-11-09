"""Tool for generating unique permit IDs."""

from typing import Dict
import random
import string


# In-memory counter for demo (in production, use database sequence)
_permit_counters = {}


def new_permit_id(permit_type: str) -> str:
    """
    Generate a unique permit ID in format PERM-<TYPE>-NNNN.
    
    Args:
        permit_type: Permit type (e.g., "Hot Work", "Confined Space Entry")
    
    Returns:
        Unique permit ID (e.g., "PERM-HW-0001")
    """
    # Map permit type to abbreviation
    type_abbrev = {
        "Hot Work": "HW",
        "Confined Space Entry": "CSE",
        "Excavation": "EXC",
        "Electrical/LOTO": "ELEC",
        "Working at Height": "WAH"
    }
    
    abbrev = type_abbrev.get(permit_type, "PERM")
    
    # Get or initialize counter for this type
    if abbrev not in _permit_counters:
        _permit_counters[abbrev] = 0
    
    _permit_counters[abbrev] += 1
    counter = _permit_counters[abbrev]
    
    # Format as PERM-<TYPE>-NNNN
    permit_id = f"PERM-{abbrev}-{counter:04d}"
    
    return permit_id


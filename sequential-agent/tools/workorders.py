"""Tool for retrieving work order information."""

from typing import Dict, Any
import json
import os
from pathlib import Path


def _load_work_orders() -> Dict[str, Dict[str, Any]]:
    """
    Load work orders from workOrders.json file.
    
    Returns:
        Dictionary mapping workOrderId to work order data
    """
    # Get assets path
    assets_path = os.getenv("ASSETS_PATH", "/app/assets")
    if not os.path.exists(assets_path):
        # Fallback to relative path
        current_dir = Path(__file__).parent.parent
        assets_path = current_dir / "assets"
    
    work_orders_file = Path(assets_path) / "workOrders.json"
    
    if not work_orders_file.exists():
        return {}
    
    with open(work_orders_file, 'r') as f:
        data = json.load(f)
    
    # Convert list to dictionary keyed by workOrderId
    work_orders = {}
    for wo in data.get("workOrders", []):
        work_order_id = wo.get("workOrderId")
        if work_order_id:
            work_orders[work_order_id] = wo
    
    return work_orders


def get_workorder_by_id(id: str) -> Dict[str, Any]:
    """
    Retrieve work order by ID.
    
    Args:
        id: Work order ID (e.g., "WO-87231")
    
    Returns:
        Work order data from JSON file
    """
    # Load work orders from JSON file
    work_orders = _load_work_orders()
    
    # Find and return the work order directly
    wo = work_orders.get(id)
    
    if not wo:
        # Return minimal structure if not found
        return {
            "workOrderId": id,
            "description": "Work order not found",
            "location": "Unknown",
            "equipment": "",
            "latitude": None,
            "longitude": None
        }
    
    # Return work order as-is from JSON
    return wo

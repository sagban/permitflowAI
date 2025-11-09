"""Tool for loading permit policy templates and rules."""

from typing import Dict, Any
import json
import yaml
import os
from pathlib import Path


def load(permitType: str) -> Dict[str, Any]:
    """
    Load permit template and rule block for a permit type.
    
    Args:
        permitType: Permit type (e.g., "Hot Work", "Confined Space Entry")
    
    Returns:
        Template and rule block with controls, PPE, signoffs, validity max
    """
    # Get assets path
    assets_path = os.getenv("ASSETS_PATH", "/app/assets")
    if not os.path.exists(assets_path):
        # Fallback to relative path
        current_dir = Path(__file__).parent.parent
        assets_path = current_dir / "assets"
    
    # Load compliance rules
    rules_path = Path(assets_path) / "compliance_rules.json"
    rules_data = {}
    if rules_path.exists():
        with open(rules_path, 'r') as f:
            rules_data = json.load(f)
    
    # Load permit template
    template_name = permitType.lower().replace(" ", "_").replace("/", "_")
    template_path = Path(assets_path) / "permit_templates" / f"{template_name}.yaml"
    
    template_data = {}
    if template_path.exists():
        with open(template_path, 'r') as f:
            template_data = yaml.safe_load(f)
    
    # Get rules for this permit type
    permit_rules = {}
    if rules_data and "permitTypes" in rules_data:
        permit_rules = rules_data["permitTypes"].get(permitType, {})
    
    # Combine template and rules
    result = {
        "permitType": permitType,
        "template": template_data,
        "rules": {
            "required_controls": permit_rules.get("required_controls", []),
            "required_ppe": permit_rules.get("required_ppe", []),
            "required_signoffs": permit_rules.get("required_signoffs", []),
            "validity_hours_max": permit_rules.get("validity_hours_max", 24),
            "environment_rules": permit_rules.get("environment_rules", {})
        }
    }
    
    return result


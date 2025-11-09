"""Tool for deterministic rule evaluation."""

from typing import Dict, Any, List
import json
import os
from pathlib import Path


def evaluate(permit: Dict[str, Any], rulesetVersion: str = "v1.0") -> Dict[str, Any]:
    """
    Evaluate permit against compliance rules.
    
    Args:
        permit: Permit object to validate
        rulesetVersion: Version of ruleset to use (default: "v1.0")
    
    Returns:
        Evaluation result with errors, warnings, checks
    """
    # Load compliance rules
    assets_path = os.getenv("ASSETS_PATH", "/app/assets")
    if not os.path.exists(assets_path):
        current_dir = Path(__file__).parent.parent
        assets_path = current_dir / "assets"
    
    rules_path = Path(assets_path) / "compliance_rules.json"
    if not rules_path.exists():
        return {
            "errors": ["Compliance rules file not found"],
            "warnings": [],
            "checks": []
        }
    
    with open(rules_path, 'r') as f:
        rules_data = json.load(f)
    
    # Get rules for this permit type
    permit_type = permit.get("type", "")
    if not permit_type or permit_type not in rules_data.get("permitTypes", {}):
        return {
            "errors": [f"Unknown permit type: {permit_type}"],
            "warnings": [],
            "checks": []
        }
    
    permit_rules = rules_data["permitTypes"][permit_type]
    errors = []
    warnings = []
    checks = []
    
    # Check required controls
    required_controls = permit_rules.get("required_controls", [])
    permit_controls = permit.get("controls", [])
    for req_control in required_controls:
        check_result = {
            "check": f"Required control: {req_control}",
            "result": "ok" if any(req_control.lower() in ctrl.lower() for ctrl in permit_controls) else "error",
            "details": f"Control '{req_control}' is required"
        }
        checks.append(check_result)
        if check_result["result"] == "error":
            errors.append(f"Missing required control: {req_control}")
    
    # Check required PPE
    required_ppe = permit_rules.get("required_ppe", [])
    permit_ppe = permit.get("ppe", [])
    for req_ppe_item in required_ppe:
        check_result = {
            "check": f"Required PPE: {req_ppe_item}",
            "result": "ok" if any(req_ppe_item.lower() in ppe.lower() for ppe in permit_ppe) else "warn",
            "details": f"PPE '{req_ppe_item}' is recommended"
        }
        checks.append(check_result)
        if check_result["result"] == "warn":
            warnings.append(f"Missing recommended PPE: {req_ppe_item}")
    
    # Check required signoffs
    required_signoffs = permit_rules.get("required_signoffs", [])
    permit_signoffs = permit.get("signOffRoles", [])
    for req_signoff in required_signoffs:
        check_result = {
            "check": f"Required sign-off: {req_signoff}",
            "result": "ok" if req_signoff in permit_signoffs else "error",
            "details": f"Sign-off from '{req_signoff}' is required"
        }
        checks.append(check_result)
        if check_result["result"] == "error":
            errors.append(f"Missing required sign-off: {req_signoff}")
    
    # Check validity hours
    max_validity = permit_rules.get("validity_hours_max", 24)
    permit_validity = permit.get("validityHours", 0)
    check_result = {
        "check": f"Validity hours within limit ({max_validity}h max)",
        "result": "ok" if permit_validity <= max_validity else "error",
        "details": f"Permit validity is {permit_validity}h, maximum is {max_validity}h"
    }
    checks.append(check_result)
    if check_result["result"] == "error":
        errors.append(f"Validity hours ({permit_validity}h) exceeds maximum ({max_validity}h)")
    
    return {
        "errors": errors,
        "warnings": warnings,
        "checks": checks
    }


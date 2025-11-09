"""Schema for A3 Permit Validator Agent output."""

from typing import List, Literal
from pydantic import BaseModel, Field


class CheckResult(BaseModel):
    """Individual validation check result."""
    check: str = Field(description="Check name/description")
    result: Literal["ok", "warn", "error"] = Field(description="Check result status")
    details: str = Field(description="Detailed check information")


class PermitValidationOutput(BaseModel):
    """A3 Agent output schema for a single permit."""
    permitId: str = Field(description="Permit ID being validated")
    validationStatus: Literal["Pass", "PassWithWarnings", "Fail"] = Field(description="Overall validation status")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for improvement")
    checks: List[CheckResult] = Field(default_factory=list, description="Detailed check results")


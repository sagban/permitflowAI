"""Schema for A2 Permit Generator Agent output."""

from typing import List
from pydantic import BaseModel, Field


class Permit(BaseModel):
    """Individual permit generated."""
    permitId: str = Field(description="Unique permit ID (PERM-<TYPE>-NNNN)")
    type: str = Field(description="Permit type (Hot Work, Confined Space Entry, etc.)")
    hazardsLinked: List[str] = Field(default_factory=list, description="Hazard names this permit addresses")
    controls: List[str] = Field(description="Control measures required")
    ppe: List[str] = Field(default_factory=list, description="Required PPE")
    signOffRoles: List[str] = Field(description="Roles required to sign off")
    validityHours: int = Field(gt=0, description="Permit validity in hours")
    attachmentsRequired: List[str] = Field(default_factory=list, description="Required attachments/certificates")


class PermitGeneratorOutput(BaseModel):
    """A2 Agent output schema."""
    permits: List[Permit] = Field(description="List of generated permits")


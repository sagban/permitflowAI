"""Schema for A1 Hazard Identification Agent output."""

from typing import List, Optional
from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    """Evidence item from RAG search."""
    sourceId: str = Field(description="Source document ID")
    snippet: str = Field(description="Relevant text snippet")


class Hazard(BaseModel):
    """Individual hazard identified."""
    name: str = Field(description="Hazard name/type")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    rationale: Optional[str] = Field(default=None, description="Reasoning for this hazard")
    suggestedControls: Optional[List[str]] = Field(default=None, description="Suggested control measures")


class HazardIdentificationOutput(BaseModel):
    """A1 Agent output schema."""
    hazards: List[Hazard] = Field(description="List of identified hazards")
    evidence: Optional[List[EvidenceItem]] = Field(default=None, description="Supporting evidence from RAG")


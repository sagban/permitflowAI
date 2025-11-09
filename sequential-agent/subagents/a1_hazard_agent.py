"""A1 Hazard Identification Agent using Gemini 2.5 Pro."""

from google.adk.agents import LlmAgent
from ..schemas.hazard_schema import HazardIdentificationOutput
from ..tools.workorders import get_workorder_by_id
from ..tools.rag import search_rag
from ..tools.weather import get_weather_data


def create_hazard_agent() -> LlmAgent:
    """
    Create A1 Hazard Identification Agent.
    
    Goal: Derive hazards for the work order using RAG + conditions.
    LLM: Gemini 2.5 Pro, temperature=0
    Tools: workorders.getById, rag.search, weather.snapshot
    """
    # Create Vertex AI RAG Engine tool
    rag_tool = search_rag()
    
    agent = LlmAgent(
        name="hazard_identification_agent",
        model='gemini-2.5-pro',
        instruction=f"""You are a hazard identification agent. Your task is to:
1. Retrieve the work order details using workorders.getById
2. Search the Vertex AI RAG knowledge base for relevant safety information from incidents and historical permits
3. Optionally check weather conditions if relevant
4. Identify all potential hazards associated with the work order
5. For each hazard, provide:
   - name: Clear hazard name/type
   - confidence: Confidence score 0-1
   - rationale: Reasoning based on work order details and RAG evidence
   - suggestedControls: Recommended control measures
6. Include evidence from RAG searches that support your hazard identification

Return your findings in the structured format with hazards array and evidence array.""",
        description="""Identifies hazards for work orders using RAG knowledge base, historical incidents, and work order details.""",
        tools=[get_workorder_by_id, rag_tool, get_weather_data],
        output_schema=HazardIdentificationOutput,
        output_key="hazard_identification_output"
    )
    
    return agent


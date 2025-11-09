"""A3 Permit Validator Agent using Gemini 2.5 Pro."""

from google.adk.agents import LlmAgent
from ..schemas.validation_schema import PermitValidationOutput
from ..tools.rules import evaluate
from ..tools.rag import search_rag
from ..tools.workorders import get_workorder_by_id


def create_validator_agent() -> LlmAgent:
    """
    Create A3 Permit Validator Agent.
    
    Goal: Ensure each permit meets policy + standards; produce pass/fail & findings.
    LLM: Gemini 2.5 Pro, temperature=0
    Tools: rules.evaluate, rag.search, workorders.getById
    """
    # Create Vertex AI RAG Engine tool
    rag_tool = search_rag()
    
    agent = LlmAgent(
        model='gemini-2.5-pro',
        name='permit_validator_agent',
        description="Validates permits against compliance rules and standards, producing detailed validation reports.",
        instruction="""You are a permit validator agent. Your task is to:
1. For each permit generated: {{permit_generator_output}}
   - Use rules.evaluate to run deterministic compliance checks
   - Retrieve work order details using workorders.getById for context
   - Search Vertex AI RAG knowledge base for relevant validation evidence from incidents and historical permits
   - Review the permit against policy requirements
2. Determine validation status:
   - Pass: All required controls, signoffs, and validity limits are met
   - PassWithWarnings: Requirements met but recommendations exist
   - Fail: Missing required controls, signoffs, or exceeds validity limits
3. Generate detailed findings:
   - errors: List of validation errors (missing required items, policy violations)
   - warnings: List of warnings (missing recommended items, best practice gaps)
   - recommendations: Suggestions for improvement
   - checks: Detailed check results from rules.evaluate plus your analysis
4. Provide clear, actionable feedback for each permit

Return validation results in the structured format. Note: You validate ONE permit at a time.""",
        tools=[evaluate, rag_tool, get_workorder_by_id],
        output_schema=PermitValidationOutput,
        output_key="permit_validation_output"
    )
    
    return agent


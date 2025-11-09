"""A3 Permit Validator Agent using Gemini 2.5 Pro."""

from google.adk.agents import LlmAgent
from ..schemas.permit_schema import PermitGeneratorOutput
from ..tools.workorders import get_workorder_by_id


def create_refiner_agent() -> LlmAgent:
    """
    Create A4 Permit Refiner Agent.
    
    Goal: Ensure each permit meets policy + standards; produce pass/fail & findings.
    LLM: Gemini 2.5 Flash, temperature=0
    Tools: rules.evaluate, rag.search, workorders.getById
    """
    
    agent = LlmAgent(
        model='gemini-2.5-flash',
        name='permit_refiner_agent',
        description="Refines the permits based on validations and recommendations, or calls exit_loop if critique indicates completion.",
        instruction="""You are a permit refiner agent. Your task is to:
1. For each permit generated: {{permit_generator_output}}
2. Review the validation results and recommendations from the permit validator agent: {{permit_validation_output}}
3. Refine the permit based on the validation results and recommendations
4. If the critique indicates completion, call exit_loop

Update the permit generator output with the validation results and recommendations in the structured format. Note: You refine ONE permit at a time.""",
        tools=[get_workorder_by_id],
        output_schema=PermitGeneratorOutput,
        output_key="permit_generator_output"
    )
    
    return agent


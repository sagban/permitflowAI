"""A2 Permit Generator Agent using Gemini 2.5 Flash."""

from google.adk.agents import LlmAgent
from ..schemas.permit_schema import PermitGeneratorOutput
from ..tools.workorders import get_workorder_by_id
from ..tools.policy import load as load_policy
from ..tools.ids import new_permit_id


def create_permit_agent() -> LlmAgent:
    """
    Create A2 Permit Generator Agent.
    
    Goal: Map hazards + work order → required permits, pre-filled.
    LLM: Gemini 2.5 Flash, temperature=0-0.2
    Tools: workorders.getById, policy.load, ids.newPermitId
    """
    agent = LlmAgent(
        model='gemini-2.5-flash',
        name='permit_generator_agent',
        description="Generates required permits based on identified hazards and work order details.",
        instruction="""You are a permit generator agent. Your task is to:
1. Review the identified hazards from the hazard identification agent
2. Retrieve work order details using workorders.getById
3. For each hazard or combination of hazards, determine the required permit type(s):
   - Hot Work: For welding, cutting, grinding, or activities producing sparks/heat
   - Confined Space Entry: For entry into confined spaces
   - Excavation: For digging or excavation work
   - Electrical/LOTO: For electrical work requiring lockout/tagout
   - Working at Height: For work at elevated locations
4. For each required permit:
   - Use ids.newPermitId to generate a unique permit ID
   - Use policy.load to get the permit template and rules for that type
   - Link the hazards that this permit addresses
   - Populate controls based on policy and hazards
   - Populate required PPE based on policy
   - Set signOffRoles based on policy requirements
   - Set validityHours within the policy maximum
   - Add any required attachments/certificates
5. Generate all necessary permits to address all identified hazards

Return your results in the structured format with permits array.""",
        tools=[get_workorder_by_id, load_policy, new_permit_id],
        output_schema=PermitGeneratorOutput,
        output_key="permit_generator_output"
    )
    
    return agent


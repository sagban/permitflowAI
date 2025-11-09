"""Root agent for ADK - placed in agent/ subdirectory for ADK discovery."""
from google.adk.agents import SequentialAgent, LoopAgent
from .subagents.a1_hazard_agent import create_hazard_agent
from .subagents.a2_permit_agent import create_permit_agent
from .subagents.a3_validator_agent import create_validator_agent
from .subagents.a4_refiner_agent import create_refiner_agent
"""
Create root agent that orchestrates A1 → A2 → A3 sequential workflow.

Uses ADK's SequentialAgent to coordinate the sequential execution.
"""
# Create sub-agents
initial_hazard_agent = create_hazard_agent()
permit_generation_agent = create_permit_agent()
permit_validation_agent = create_validator_agent()
permit_refiner_agent = create_refiner_agent()

permit_refinement_loop = LoopAgent(
    name="permit_refinement_loop",
    sub_agents=[permit_validation_agent,permit_refiner_agent],
    max_iterations=2,
)


# Create root agent with sub-agents
root_agent = SequentialAgent(
    name='sequential_permit_agent',
    description="Orchestrates sequential permit generation pipeline: hazard identification → permit generation → permit validation",
    sub_agents=[initial_hazard_agent, permit_generation_agent, permit_refinement_loop],
)


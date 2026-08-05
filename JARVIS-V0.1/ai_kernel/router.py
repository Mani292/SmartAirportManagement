from typing import Literal
from ai_kernel.state import AgentState

def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
    """Determine if the agent should continue to use tools or end."""
    messages = state["messages"]
    if not messages:
        return "__end__"

    last_message = messages[-1]

    # If the LLM makes a tool call, then we route to the "tools" node
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    # Otherwise, we end and reply to the user
    return "__end__"

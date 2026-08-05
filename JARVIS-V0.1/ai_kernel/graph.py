from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage, HumanMessage

from ai_kernel.state import AgentState
from ai_kernel.router import should_continue

# We will inject the llm and tools later in llm/gemini.py
def create_graph(llm_with_tools, tools, memory_engine=None):

    def retrieve_memory(state: AgentState):
        """Node to retrieve relevant semantic memory."""
        messages = state.get("messages", [])
        if not messages or not memory_engine:
            return {"memory_context": ""}

        last_human_msg = next((msg.content for msg in reversed(messages) if isinstance(msg, HumanMessage)), "")
        if last_human_msg:
            context = memory_engine.search(last_human_msg)
            return {"memory_context": context}
        return {"memory_context": ""}

    def planner_agent(state: AgentState):
        """Node to decide the plan and execute."""
        messages = state.get("messages", [])
        memory_context = state.get("memory_context", "")

        # Inject memory context into the system message if not already present
        if memory_context and not any("Found the following relevant memories:" in str(msg.content) for msg in messages):
            system_msg = SystemMessage(content=f"You are JARVIS. Use this long-term memory context if relevant:\n{memory_context}")
            messages = [system_msg] + list(messages)

        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    tool_node = ToolNode(tools)

    workflow = StateGraph(AgentState)

    workflow.add_node("memory", retrieve_memory)
    workflow.add_node("planner", planner_agent)
    workflow.add_node("tools", tool_node)

    workflow.add_edge(START, "memory")
    workflow.add_edge("memory", "planner")
    workflow.add_conditional_edges(
        "planner",
        should_continue,
    )
    workflow.add_edge("tools", "planner")

    app = workflow.compile()
    return app

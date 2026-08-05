import os
import importlib
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from llm.prompts import SYSTEM_PROMPT

# 1. Import Obsidian Memory
from skill_marketplace.memory_tools import save_memory, read_memory

# 2. BRING BACK YOUR OLD TOOLS!
from skill_marketplace.system_tools import open_website, play_on_youtube, get_weather, get_news, shutdown_system

# Replace Gemini with a local model running on Ollama
llm = ChatOllama(model="qwen2.5:7b-instruct", temperature=0.7)

# 3. Add them ALL back to Jarvis's Brain
jarvis_tools = [
    save_memory, read_memory,
    open_website, play_on_youtube, get_weather, get_news, shutdown_system
]

# Map the tools so the executor knows what function to run
tool_map = {
    "save_memory": save_memory,
    "read_memory": read_memory,
    "open_website": open_website,
    "play_on_youtube": play_on_youtube,
    "get_weather": get_weather,
    "get_news": get_news,
    "shutdown_system": shutdown_system
}

# --- FABLE 5 OS: DYNAMIC SKILL LOADER (For future expansion) ---
skills_dir = os.path.join(os.path.dirname(__file__), '..', 'skill_marketplace')
if os.path.exists(skills_dir):
    for branch in os.listdir(skills_dir):
        branch_path = os.path.join(skills_dir, branch)
        if os.path.isdir(branch_path) and "SKILL.md" in os.listdir(branch_path):
            try:
                module = importlib.import_module(f"skill_marketplace.{branch}.run")
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if hasattr(attr, "invoke"):
                        jarvis_tools.append(attr)
                        tool_map[attr.name] = attr
            except Exception as e:
                pass

llm_with_tools = llm.bind_tools(jarvis_tools)

# Import AI OS Graph and Memory Engine
from ai_kernel.graph import create_graph
from memory_engine.long_term import MemoryEngine
import os

# Initialize Memory Engine
vault_path = os.getenv("OBSIDIAN_VAULT_PATH", "vault")
memory_engine = MemoryEngine(vault_path)

# Create the LangGraph orchestrator
agent_orchestrator = create_graph(llm_with_tools, jarvis_tools, memory_engine)

def ask_gemini(user_input: str) -> str:
    """Entry point for the AI OS Kernel"""
    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_input)]

    # Run the graph
    inputs = {"messages": messages}

    final_response = ""
    for output in agent_orchestrator.stream(inputs):
        for key, value in output.items():
            if key == "planner":
                # Check for shutdown command executed
                last_msg = value["messages"][-1]
                if hasattr(last_msg, "tool_calls"):
                    for tc in last_msg.tool_calls:
                        if tc["name"] == "shutdown_system":
                            print("[*] Terminating V.A.U.L.T. OS...")
                            os._exit(0)

                if isinstance(last_msg.content, list):
                    final_response = " ".join([b.get("text", "") for b in last_msg.content if isinstance(b, dict) and "text" in b]).strip()
                elif last_msg.content:
                    final_response = last_msg.content

            elif key == "tools":
                # Tools executed, update memory if save_memory was called
                messages = value.get("messages", [])
                if messages:
                    last_msg = messages[-1]
                    if last_msg.name == "save_memory":
                        memory_engine.refresh()
                        final_response = "Memory saved successfully."
                    elif last_msg.content:
                         # Append tool output to final response if we want it spoken/displayed
                         final_response = str(last_msg.content)

    return final_response
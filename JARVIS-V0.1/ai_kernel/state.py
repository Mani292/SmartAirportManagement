from typing import Annotated, Sequence, TypedDict
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    plan: str
    memory_context: str
    status: str

import chainlit as cl
from langgraph.graph import StateGraph, END
from typing import TypedDict
import asyncio

class State(TypedDict):
    messages: list[str]

workflow = StateGraph(State)

async def triage_node(state: State):
    user_message = state["messages"][-1].lower()
    if "hi" in user_message or "hello" in user_message:
        return {"messages": state["messages"] + ["👋 Hello! I’m MedPass AI Doctor. How can I help you today?"]}
    else:
        return {"messages": state["messages"]}

workflow.add_node("triage", triage_node)

async def doctor_node(state: State):
    user_message = state["messages"][-1]
    ai_response = f"DoctorBot: I see you said '{user_message}'. Can you tell me more about your symptoms?"
    return {"messages": state["messages"] + [ai_response]}

workflow.add_node("doctor", doctor_node)

workflow.set_entry_point("triage")
workflow.add_edge("triage", "doctor")
workflow.add_edge("doctor", END)

app = workflow.compile()

@cl.on_message
async def main(message: cl.Message):
    result = await app.ainvoke({"messages": [message.content]})
    ai_reply = result["messages"][-1]
    await cl.Message(content=ai_reply).send()

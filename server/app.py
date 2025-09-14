import chainlit as cl
from langgraph.graph import StateGraph, END
from typing import TypedDict
from pipelines.RAGPipeline import rag_query
import asyncio

class State(TypedDict):
    messages: list[str]
    context: str 

workflow = StateGraph(State)

async def rag_node(state: State):
    user_message = state["messages"][-1]
    result = rag_query(user_message)

    return {
        "messages": state["messages"] + [result["answer"]],
        "context": result["context"]
    }

workflow.add_node("doctor", rag_node)


workflow.set_entry_point("doctor")
workflow.add_edge("doctor", END)

app = workflow.compile()

@cl.on_message
async def main(message: cl.Message):
    result = await app.ainvoke({
        "messages": [message.content],
        "context": ""
    })
    ai_reply = result["messages"][-1]
    await cl.Message(content=ai_reply).send()
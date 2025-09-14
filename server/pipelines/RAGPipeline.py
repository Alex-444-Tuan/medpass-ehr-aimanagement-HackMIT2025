# RAGPipeline.py
from getpass import getpass
from langchain_chroma import Chroma
from langchain_mistralai import MistralAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.chat_models import init_chat_model

import os
from dotenv import load_dotenv

load_dotenv()

#-------------anthro
if not os.environ.get("ANTHROPIC_API_KEY"):
    anthropic_api_key = os.getenv("MISTRAL_API_KEY")
    if anthropic_api_key is not None:
        os.environ["ANTHROPIC_API_KEY"] = anthropic_api_key

llm = init_chat_model("claude-opus-4-1-20250805", model_provider="anthropic")

#-------------mistral
if not os.environ.get("MISTRAL_API_KEY"):
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if mistral_api_key is not None:
        os.environ["MISTRAL_API_KEY"] = mistral_api_key
# Khởi tạo embeddings & vectorstore
embeddings = MistralAIEmbeddings(model="mistral-embed")

#-------------chroma
vector_store = Chroma(
    collection_name="pdf_collection",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db"
)

from typing import Optional

def add_text_to_vectorstore(text: str, metadata: Optional[dict] = None):
    """Chunk + add text to vector store."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    docs = splitter.split_documents([Document(page_content=text, metadata=metadata or {})])
    vector_store.add_documents(docs)
    vector_store.persist()
    return True

def rag_query(query: str) -> dict:
    """Run RAG: retrieve docs + ask LLM, return both answer and context."""
    retrieved_docs = vector_store.similarity_search(query, k=3)
    context = "\n\n".join([doc.page_content for doc in retrieved_docs])

    prompt = f"""You are a helpful AI doctor. Use the context below to answer.

    Context:
    {context}

    Question: {query}

    Answer:"""

    # LLM
    response = llm.invoke(prompt)
    answer = response.content if hasattr(response, "content") else str(response)

    return {"answer": answer, "context": context}

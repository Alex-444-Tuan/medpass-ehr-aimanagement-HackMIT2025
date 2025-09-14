# RAGPipeline.py
from langchain_chroma import Chroma
from langchain_mistralai import MistralAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

if not os.environ.get("MISTRAL_API_KEY"):
    os.environ["MISTRAL_API_KEY"] = os.getenv("MISTRAL_API_KEY")

# Khởi tạo embeddings & vectorstore
embeddings = MistralAIEmbeddings(model="mistral-embed")

vector_store = Chroma(
    collection_name="pdf_collection",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db"
)

def add_text_to_vectorstore(text: str, metadata: dict = None):
    """
    Add documents to vectorstore
    """
    vector_store.add_texts([text], metadatas=[metadata or {}])
    return True

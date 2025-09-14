from fastapi import FastAPI, File, UploadFile, Form
from datetime import datetime
import shutil
from transformers import BitsAndBytesConfig, pipeline
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import torch
import os
import whisper
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
pipe = None

whisper_model = whisper.load_model("turbo")

if not os.environ.get("HF_TOKEN"):
    os.environ["HF_TOKEN"] = os.getenv("HF_TOKEN")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestBody(BaseModel):
    prompt: str
    max_new_tokens: int = 1024

@app.on_event("startup")
def load_model():
    """
    Load the MedGemma model with optional quantization.
    """
    global pipe
    model_variant = "4b-it"
    model_id = f"google/medgemma-{model_variant}"
    use_quantization = True

    model_kwargs = dict(
        torch_dtype=torch.bfloat16,
        device_map="auto",
    )

    if use_quantization:
        model_kwargs["quantization_config"] = BitsAndBytesConfig(load_in_4bit=True)

    pipe = pipeline("image-text-to-text", model=model_id, model_kwargs=model_kwargs)
    print("✅ MedGemma model loaded successfully!")

@app.post("/voice-to-EHR")
async def upload_audio(file: UploadFile = File(...)):
    save_path = f"records/{file.filename}"

    os.makedirs("records", exist_ok=True)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    speechText = whisper_model.transcribe(save_path, fp16=False)

    text = speechText["text"]

    prompt= text

    role_instruction = """You are a professional nurse with extensive experience in writing Electronic Health Records (EHR). You understand hospital protocols, documentation standards, and best practices for medical charting. Your job is to produce EHR entries that are:

Clear, concise, and medically accurate

Structured and formatted according to hospital documentation protocol

Easy to read, organized, and track across multiple visits or encounters

Focused on patient care details such as symptoms, vitals, medications, treatments, assessments, and plans.

Always write as if the notes will be used by other medical professionals for continuity of care.

You are going to receive a conversation between a nurse and a patient following Quest SCHOLAR MAC. You just need to generate the EHR based on the conversation. Do not add any other information.
"""
    system_instruction = role_instruction
    max_new_tokens = 1500

    messages = [
    {
        "role": "system",
        "content": [{"type": "text", "text": system_instruction}]
    },
    {
        "role": "user",
        "content": [
            {"type": "text", "text": prompt}
            #{type": "image", "image": image} if there is function to upload by image
        ]
    }
]
    output = pipe(text=messages, max_new_tokens=max_new_tokens)
    response = output[0]["generated_text"][-1]["content"]
    print("✅ EHR generated successfully!" + f'n\n{response}')

    return {"status": "ok", "EHR": response}

@app.post("/confirm-EHR")
async def confirm_EHR(EHR: str = Form(...)):
    os.makedirs("EHR_history", exist_ok=True)
    filename = f"EHR_history/EHR_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(EHR)
    return {"status": "saved", "filename": filename}
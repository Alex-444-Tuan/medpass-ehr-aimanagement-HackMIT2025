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
from pipelines.RAGPipeline import add_text_to_vectorstore
import re
import glob
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit


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

CATEGORY_PROMPTS = {
    "critical_summary": "Extract a concise Critical Summary from the following EHR. Focus on patient demographics, blood type, allergies, chronic conditions, current medications. generate a summary like as if this patient is going to be sent to the ER and the doctor need this information to benefit the surgery in txt file and in a readable format. do not include your thinking process in the output and do not put content generated inside ```txt```.",
    "visit_history": "From the EHR, generate a structured Visit History with dates, type of encounter (visit/admission), diagnosis, and important notes in txt file and in a readable format. do not include your thinking process in the output and do not put content generated inside ```txt```.",
    "procedures_surgeries": "From the EHR, extract details of Procedures & Surgeries (dates, procedures performed, outcomes) in txt file and in a readable format. do not include your thinking process in the output and do not put content generated inside ```txt```."
}

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

You are going to receive a conversation between a nurse and a patient following Quest SCHOLAR MAC. You need to generate the EHR based on the conversation and you do not need to include your thinking process in the output and do not put content inside ```txt```.
"""
    system_instruction = role_instruction
    max_new_tokens = 1000

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


def clean_text_from_codeblocks(text: str) -> str:
    """
    Remove ```txt ... ``` blocks (and optionally any other code block)
    from the given text.
    """
    # Regex to capture ```txt ... ``` including newlines, non-greedy
    cleaned = re.sub(r"```txt(.*?)```", r"\1", text, flags=re.DOTALL)

    # Optionally, remove other generic ```...``` blocks
    cleaned = re.sub(r"```(.*?)```", r"\1", cleaned, flags=re.DOTALL)

    return cleaned.strip()

#helper function to generate category files, results and save to local

def generate_category_file(category: str, ehr_text: str):
    folder = f"EHR/EHR_{category}"
    os.makedirs(folder, exist_ok=True)

    # Load previous category file if exists
    previous_text = ""
    if os.listdir(folder):  # check if not empty
        latest_file = sorted(os.listdir(folder))[-1]  # get most recent
        with open(os.path.join(folder, latest_file), "r", encoding="utf-8") as f:
            previous_text = f.read()

    # Build prompt: include old + new
    system_instruction = CATEGORY_PROMPTS[category]
    if previous_text:
        user_prompt = f"""Here is the previous {category.replace("_", " ").title()} record:\n
{previous_text}

Here is a new EHR entry:\n
{ehr_text}

Update the {category.replace("_", " ").title()} accordingly, keeping old information but adding or modifying as needed for accuracy and completeness in txt file and in a readable format. do not include your thinking process in the output and do not put content inside ```txt```.
"""
    else:
        user_prompt = ehr_text

    messages = [
        {"role": "system", "content": [{"type": "text", "text": system_instruction}]},
        {"role": "user", "content": [{"type": "text", "text": user_prompt}]}
    ]

    output = pipe(text=messages, max_new_tokens=700)
    raw_result = output[0]["generated_text"][-1]["content"]
    result = clean_text_from_codeblocks(raw_result)

    # Save updated result
    filename = f"{folder}/{category}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(result)

    return result, filename


@app.post("/confirm-EHR")
async def confirm_EHR(EHR: str = Form(...)):
    os.makedirs("EHR/fulldocs", exist_ok=True)
    filename = f"EHR/fulldocs/fulldocs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"

    # Save EHR to local for displaying purpose
    with open(filename, "w", encoding="utf-8") as f:
        f.write(EHR)
    
    # Add EHR to vectorstore for future retrieval
    metadata = {"source": filename}
    add_text_to_vectorstore(EHR, metadata)
    print("📝 EHR confirmed and saved successfully!")

    # Generate specialized outputs
    critical_summary, file1 = generate_category_file("critical_summary", EHR)
    visit_history, file2 = generate_category_file("visit_history", EHR)
    procedures, file3 = generate_category_file("procedures_surgeries", EHR)

    print("📝 EHR confirmed, saved, and specialized categories generated!")

    return {
        "status": "saved",
        "full_EHR_file": filename,
        "categories": {
            "critical_summary": {"file": file1, "text": critical_summary},
            "visit_history": {"file": file2, "text": visit_history},
            "procedures_surgeries": {"file": file3, "text": procedures}
        }
    }

# List all EHR files
@app.get("/list-EHR")
async def list_EHR():
    docs = []
    folder = "EHR/fulldocs"
    if os.path.exists(folder):
        for file in sorted(os.listdir(folder)):
            path = os.path.join(folder, file)
            with open(path, "r", encoding="utf-8") as f:
                docs.append({"file": file, "text": f.read()})
    return {"docs": docs}

def get_latest_file_text(base_dir,folder):
    path = os.path.join(base_dir, folder)
    if not os.path.exists(path) or not os.listdir(path):
        return None
    latest_file = sorted(glob.glob(f"{path}/*.txt"))[-1]
    with open(latest_file, "r", encoding="utf-8") as f:
        return f.read()

@app.get("/load-categories")
async def load_categories():
    base_dir = "EHR"  # adjust if your folder is "server/EHR"

    def get_latest_file_text(folder):
        path = os.path.join(base_dir, folder)
        if not os.path.exists(path) or not os.listdir(path):
            return None
        latest_file = sorted(glob.glob(f"{path}/*.txt"))[-1]
        with open(latest_file, "r", encoding="utf-8") as f:
            return f.read()

    return {
        "critical_summary": get_latest_file_text("EHR_critical_summary"),
        "visit_history": get_latest_file_text("EHR_visit_history"),
        "procedures_surgeries": get_latest_file_text("EHR_procedures_surgeries"),
        "fulldocs": get_latest_file_text("fulldocs"),
        # Lab & Imaging (optional) – same logic if you create folder
        "lab_and_imaging": get_latest_file_text("EHR_lab_and_imaging") if os.path.exists(os.path.join(base_dir, "EHR_lab_and_imaging")) else None,
    }

STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)

PDF_PATH = STATIC_DIR / "critical_summary.pdf"

class SummaryRequest(BaseModel):
    summary: str

def generate_pdf(content: str):
    """Generate a simple PDF with the given text content."""

    content = get_latest_file_text("EHR","EHR_critical_summary")

    c = canvas.Canvas(str(PDF_PATH), pagesize=letter)
    width, height = letter
    max_width = width - 200
    y = height - 140
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 100, "Critical Summary")
    # Body text
    c.setFont("Helvetica", 12)
    # Wrap text
    lines = simpleSplit(content, "Helvetica", 12, max_width)
    for line in lines:
        c.drawString(100, y, line)
        y -= 14  # move down line height
    c.save()

@app.post("/update-summary")
def update_summary(req: SummaryRequest):
    """
    Update the critical summary and regenerate PDF.
    Body: { "summary": "some text here" }
    """
    generate_pdf(req.summary)
    return {"pdf_url": "http://0.0.0.0:8000/summary-pdf"}

@app.get("/summary-pdf")
def get_pdf():
    """Serve the latest generated PDF."""
    return FileResponse(PDF_PATH, media_type="application/pdf")
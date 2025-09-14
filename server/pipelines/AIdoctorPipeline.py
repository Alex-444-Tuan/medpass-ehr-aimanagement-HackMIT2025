from main import pipe

def run_medgemma_on_chainlit(text_prompt: str, role_instruction: str, max_new_tokens: int = 1500) -> str:
    """
    Run the MedGemma model with the given text prompt and role instruction.
    """
    messages = [
        {
            "role": "system",
            "content": [{"type": "text", "text": role_instruction}]
        },
        {
            "role": "user",
            "content": [{"type": "text", "text": text_prompt}]
        }
    ]
    output = pipe(text=messages, max_new_tokens=max_new_tokens)
    response = output[0]["generated_text"][-1]["content"]
    return response
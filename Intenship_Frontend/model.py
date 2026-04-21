import json
import os
import torch
import faiss
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
from sentence_transformers import SentenceTransformer

# =========================
# CONFIG
# =========================
model_name = "Qwen/Qwen2.5-1.5B-Instruct"  # lighter & safer

MEMORY_FILE = "memory.json"
DOC_FILE = "docs.txt"

# =========================
# GLOBALS
# =========================
_tokenizer = None
_model = None

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
documents = []
index = None

# =========================
# MODEL LOADING
# =========================
def get_model():
    global _tokenizer, _model
    if _model is None:
        print("Loading model and tokenizer...")

        _tokenizer = AutoTokenizer.from_pretrained(model_name)

        _model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="auto",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        )

        _model.eval()
        print("Model loaded successfully!")

    return _tokenizer, _model


# =========================
# MEMORY FUNCTIONS
# =========================
def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r") as f:
                return json.load(f)
        except:
            return []
    return []


def save_memory(memory):
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f, indent=4)


# =========================
# RAG FUNCTIONS
# =========================
def load_documents():
    global documents
    if os.path.exists(DOC_FILE):
        with open(DOC_FILE, "r", encoding="utf-8") as f:
            documents = f.read().split("\n\n")
    else:
        documents = []


def build_index():
    global index
    if not documents:
        index = None
        return

    embeddings = embedding_model.encode(documents)
    embeddings = np.array(embeddings).astype("float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)


def retrieve_context(query, k=3):
    if index is None or not documents:
        return ""

    query_embedding = embedding_model.encode([query])
    query_embedding = np.array(query_embedding).astype("float32")

    distances, indices = index.search(query_embedding, k)

    results = [documents[i] for i in indices[0]]
    return "\n".join(results)


# =========================
# PROMPT BUILDER
# =========================
def build_prompt(chat_history, context=""):
    prompt = "You are a coding assistant. Always return full updated code.\n\n"

    if context:
        prompt += f"Relevant Context:\n{context}\n\n"

    for msg in chat_history:
        if msg["role"] == "user":
            prompt += f"User: {msg['content']}\n"
        else:
            prompt += f"Assistant: {msg['content']}\n"

    prompt += "Assistant:"
    return prompt


# =========================
# CHAT LOOP
# =========================
def chat():
    load_documents()
    build_index()

    chat_history = load_memory()
    tokenizer, model = get_model()

    print("\nRAG Coding Assistant (type 'exit' to stop)\n")

    while True:
        user_input = input("You: ")

        if user_input.lower() == "exit":
            save_memory(chat_history)
            break

        chat_history.append({"role": "user", "content": user_input})

        # Retrieve context
        context = retrieve_context(user_input)

        # Build prompt
        prompt = build_prompt(chat_history, context)

        # Tokenize safely
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048
        )
        inputs = {k: v.to(model.device) for k, v in inputs.items()}

        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=256,
                temperature=0.3,
                top_p=0.9,
                repetition_penalty=1.1,
                do_sample=True
            )

        # Decode properly (remove prompt part)
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response = generated_text[len(prompt):].strip()

        print("\nQwen:\n", response, "\n")

        chat_history.append({"role": "assistant", "content": response})
        save_memory(chat_history)


# =========================
# MAIN
# =========================
if _name_ == "_main_":
    chat()
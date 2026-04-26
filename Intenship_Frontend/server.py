from flask import Flask, request, jsonify
from flask_cors import CORS
from model import build_prompt, load_memory, save_memory, get_model

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "running", "message": "Backend server is active"})

@app.route("/chat", methods=["POST"])
def chat_api():
    print("\n[BACKEND] Received a new chat request...")
    data = request.json
    user_input = data.get("message")

    if not user_input:
        print("[BACKEND] Error: No message provided in request")
        return jsonify({"error": "No message provided"}), 400

    print(f"[BACKEND] User message: {user_input}")
    
    chat_history = load_memory()
    chat_history.append({"role": "user", "content": user_input})

    prompt = build_prompt(chat_history)

    # Lazy load model on first request
    print("[BACKEND] Accessing AI model...")
    tokenizer, model = get_model()
    import torch

    print("[BACKEND] Generating response (this might take a few seconds)...")
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.3,
            top_p=0.9,
            repetition_penalty=1.1,
            do_sample=True
        )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    response = response.split("Assistant:")[-1].strip()

    print("[BACKEND] Response generated successfully!")
    chat_history.append({"role": "assistant", "content": response})
    save_memory(chat_history)

    return jsonify({"response": response})


if __name__ == "__main__":
    print("\n" + "="*50)
    print("AI BACKEND SERVER STARTING")
    print("Pre-loading AI model... (this may take a minute)")
    try:
        get_model() # Load model immediately on startup
        print("AI Model loaded and ready!")
    except Exception as e:
        print(f"Warning: Model pre-loading failed: {e}")
    print("Status: Server is active on port 5000")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
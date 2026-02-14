
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
from time import sleep

app = Flask(__name__)
CORS(app)  # allows your Next.js frontend to call the Pi

# ----------------------------
# HARDWARE STUBS (safe for now)
# Replace these later
# ----------------------------

def speak(text: str):
    try:
        subprocess.Popen(["espeak", text])
    except Exception as e:
        print("TTS error:", e)

def show_on_screen(text: str):
    # TODO: replace with real LCD/OLED code
    print("[SCREEN]", text)

def rotate_to(level: int, compartment: int):
    """
    For now this is a simulation.
    Later you will replace with servo/stepper code.
    """
    degrees_per_slot = 360 / 4
    target_deg = (compartment - 1) * degrees_per_slot

    print(f"[MOTOR] Level {level} -> {target_deg:.0f} degrees")
    sleep(1)

# ----------------------------
# API ROUTES
# ----------------------------

@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.post("/api/dispense")
def dispense():
    data = request.get_json(force=True)

    try:
        level = int(data.get("level"))
        compartment = int(data.get("compartment"))
    except Exception:
        return jsonify({"ok": False, "error": "Invalid input"}), 400

    message = f"Dispensing level {level} compartment {compartment}"

    # hardware actions
    show_on_screen(message)
    speak(message)
    rotate_to(level, compartment)

    return jsonify({
        "ok": True,
        "level": level,
        "compartment": compartment
    })

@app.get("/api/alerts")
def alerts():
    """
    Placeholder for reminder system.
    Later this will check schedules.
    """
    return jsonify({
        "active": False,
        "message": ""
    })

# ----------------------------
# RUN SERVER
# ----------------------------

if __name__ == "__main__":
    print("🚀 EverCare backend starting...")
    app.run(host="0.0.0.0", port=5000, debug=True)

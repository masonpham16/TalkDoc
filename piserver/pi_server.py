from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows your website to call the Pi from the browser

# Map compartment -> angle (change these to your real angles)
ANGLE_MAP = {
    "B1": 45,
    "B2": 90,
    "B3": 135,
    "B4": 180,
    "T1": 225,
    "T2": 270,
    "T3": 315,
    "T4": 0,
}

def rotate_to_angle(angle: int):
    # ✅ FOR NOW: just print so you can test the connection
    # Later you replace this with real motor code
    print(f"[MOTOR] Rotate to {angle} degrees")

@app.post("/api/dispense")
def dispense():
    data = request.get_json(force=True) or {}
    slot = data.get("slot")

    if slot not in ANGLE_MAP:
        return jsonify({"ok": False, "error": "Invalid slot"}), 400

    angle = ANGLE_MAP[slot]
    rotate_to_angle(angle)

    return jsonify({"ok": True, "slot": slot, "angle": angle})

if __name__ == "__main__":
    # host 0.0.0.0 makes it reachable from other devices on Wi-Fi
    app.run(host="0.0.0.0", port=5000)

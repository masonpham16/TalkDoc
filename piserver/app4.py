from flask import Flask, request, jsonify
from flask_cors import CORS
import RPi.GPIO as GPIO
import time
import threading
import tkinter as tk
from PIL import Image, ImageTk

# -----------------------------
# Flask setup
# -----------------------------
app = Flask(__name__)
CORS(app)

# -----------------------------
# Servo setup (physical pin 32 = GPIO12)
# -----------------------------
SERVO_GPIO = 12

GPIO.setmode(GPIO.BCM)
GPIO.setup(SERVO_GPIO, GPIO.OUT)

pwm = GPIO.PWM(SERVO_GPIO, 50)
pwm.start(0)

def angle_to_duty(angle: int) -> float:
    return 2.5 + (angle / 180.0) * 10.0

def rotate_to_angle(angle: int):
    angle = angle % 360
    if angle > 180:
        angle = 180

    duty = angle_to_duty(angle)
    print(f"[SERVO] Rotate to {angle}")

    pwm.ChangeDutyCycle(duty)
    time.sleep(0.7)
    pwm.ChangeDutyCycle(0)

# -----------------------------
# GUI setup (your 3.5" LCD)
# -----------------------------
IDLE_TIMEOUT_MS = 5000
idle_job = None

root = tk.Tk()
root.title("TalkDoc")
root.configure(bg="black")
root.attributes("-fullscreen", True)

# ESC to exit GUI
root.bind("<Escape>", lambda e: root.destroy())

# Load startup logo (logo.jpg) and idle logo (idle.jpg)
# Put both images next to this file.
startup_raw = Image.open("logo.jpg").resize((480, 320))
startup_img = ImageTk.PhotoImage(startup_raw)

idle_raw = Image.open("idle.jpg").resize((480, 320))
idle_img = ImageTk.PhotoImage(idle_raw)

label = tk.Label(root, image=startup_img, bg="black")
label.pack(expand=True)

def show_startup_logo():
    def _do():
        label.config(image=startup_img, text="")
    root.after(0, _do)

def show_idle_logo():
    def _do():
        label.config(image=idle_img, text="")
    root.after(0, _do)

def show_on_lcd(text: str):
    # Switch label from image -> text (thread-safe)
    def _do():
        label.config(
            image="",
            text=text,
            font=("Arial", 40),
            fg="white",
            bg="black",
            wraplength=480,
            justify="center"
        )
    root.after(0, _do)

def schedule_idle():
    """After IDLE_TIMEOUT_MS with no new schedule, show the idle logo."""
    global idle_job
    if idle_job is not None:
        root.after_cancel(idle_job)
    idle_job = root.after(IDLE_TIMEOUT_MS, show_idle_logo)

# Start idle timer at boot so it will eventually swap to idle logo
schedule_idle()

# -----------------------------
# Slot map
# -----------------------------
ANGLE_MAP = {
    "B1": 45,
    "B2": 90,
    "B3": 135,
    "B4": 180,
    "T1": 45,
    "T2": 90,
    "T3": 135,
    "T4": 180,
}

# -----------------------------
# API route
# -----------------------------
@app.post("/api/dispense")
def dispense():
    data = request.get_json(force=True) or {}
    slot = data.get("slot")

    if slot not in ANGLE_MAP:
        return jsonify({"ok": False, "error": "Invalid slot"}), 400

    angle = ANGLE_MAP[slot]

    # Update LCD and reset idle timer
    show_on_lcd(f"Dispensing...\n{slot}")
    schedule_idle()

    # Move servo
    rotate_to_angle(angle)

    # Show done and reset idle timer again (5s after done)
    show_on_lcd(f"Done\n{slot}")
    schedule_idle()

    return jsonify({"ok": True, "slot": slot, "angle": angle})

# -----------------------------
# Run both GUI + Flask
# -----------------------------
def run_flask():
    # use_reloader=False prevents extra process that can break GPIO/threading
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)

if __name__ == "__main__":
    threading.Thread(target=run_flask, daemon=True).start()
    root.mainloop()

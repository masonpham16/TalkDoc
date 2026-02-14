
from gpiozero import Servo
from time import sleep

# Pick a GPIO pin for signal. GPIO18 is common (physical pin 12).
servo = Servo(18)

print("Center")
servo.mid()
sleep(1)

print("Left")
servo.min()
sleep(1)

print("Right")
servo.max()
sleep(1)

print("Sweep")
for v in [-1, -0.5, 0, 0.5, 1]:
    servo.value = v
    sleep(0.8)

servo.detach()
print("Done")

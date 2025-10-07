from flask import Flask, jsonify
from flask_cors import CORS
import psutil, time, threading, random, datetime

app = Flask(__name__)
CORS(app)

metrics = []

def collect_metrics():
    while True:
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        duration = random.uniform(20, 60)  # simulate processing time (ms)
        mem = psutil.virtual_memory().percent / 30  # fake MB scaling
        metrics.append({
            "timestamp": ts,
            "durationMS": round(duration, 2),
            "memoryMB": round(mem, 2)
        })
        if len(metrics) > 30:
            metrics.pop(0)
        time.sleep(3)

@app.route("/metrics", methods=["GET"])
def get_metrics():
    return jsonify(metrics)

if __name__ == "__main__":
    threading.Thread(target=collect_metrics, daemon=True).start()
    print("✅ Python metrics server running on http://localhost:8081")
    app.run(port=8081)

import express from "express";
import cors from "cors";
import os from "os";

const app = express();
app.use(cors());

let metrics = [];

function collectMetrics() {
  const now = new Date().toLocaleTimeString("en-US", { hour12: false });
  const durationMS = (Math.random() * 40 + 20).toFixed(2); // 20-60ms
  const memoryMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  metrics.push({
    timestamp: now,
    durationMS: parseFloat(durationMS),
    memoryMB: parseFloat(memoryMB)
  });

  if (metrics.length > 30) metrics.shift();
}

setInterval(collectMetrics, 3000);

app.get("/metrics", (req, res) => {
  res.json(metrics);
});

app.listen(8082, () => {
  console.log("✅ Node metrics server running on http://localhost:8082");
});

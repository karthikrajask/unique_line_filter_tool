import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Legend,
  Tooltip,
} from "chart.js";
Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Legend, Tooltip);

type Metric = {
  timestamp: string;
  durationMS: number;
  memoryMB: number;
};

export default function MetricsDashboard(): JSX.Element {
  const [goMetrics, setGoMetrics] = useState<Metric[]>([]);
  const [synthetic, setSynthetic] = useState<{ python: Metric[]; node: Metric[] }>({
    python: [],
    node: [],
  });
  const [lastGoCount, setLastGoCount] = useState(0);

  // Fetch Go metrics every few seconds
  const fetchGoMetrics = async () => {
    try {
      const res = await fetch("http://localhost:8080/metrics", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGoMetrics(data);
      }
    } catch (err) {
      console.warn("⚠️ Go metrics unavailable:", (err as Error).message);
    }
  };

  // Generate synthetic Python & Node metrics ONLY when Go metrics actually change
  useEffect(() => {
    if (goMetrics.length === 0 || goMetrics.length === lastGoCount) return;

    const generatedPython: Metric[] = goMetrics.map((g) => ({
      timestamp: g.timestamp,
      durationMS: +(g.durationMS * 1.7 + Math.random() * 10).toFixed(2), // ~70% slower
      memoryMB: +(g.memoryMB * 1.4 + Math.random()).toFixed(2),
    }));

    const generatedNode: Metric[] = goMetrics.map((g) => ({
      timestamp: g.timestamp,
      durationMS: +(g.durationMS * 1.3 + Math.random() * 5).toFixed(2), // ~30% slower
      memoryMB: +(g.memoryMB * 1.2 + Math.random()).toFixed(2),
    }));

    setSynthetic({ python: generatedPython, node: generatedNode });
    setLastGoCount(goMetrics.length);
  }, [goMetrics, lastGoCount]);

  useEffect(() => {
    fetchGoMetrics();
    const timer = setInterval(fetchGoMetrics, 4000);
    return () => clearInterval(timer);
  }, []);

  // Build labels
  const timestamps = goMetrics.map((m) => m.timestamp);

  const buildChartData = (field: keyof Metric) => ({
    labels: timestamps,
    datasets: [
      {
        label: "Go",
        data: goMetrics.map((m) => m[field]),
        borderColor: "rgb(37,99,235)",
        backgroundColor: "rgba(37,99,235,0.1)",
        tension: 0.25,
      },
      {
        label: "Python",
        data: synthetic.python.map((m) => m[field]),
        borderColor: "rgb(34,197,94)",
        backgroundColor: "rgba(34,197,94,0.1)",
        tension: 0.25,
      },
      {
        label: "Node",
        data: synthetic.node.map((m) => m[field]),
        borderColor: "rgb(234,179,8)",
        backgroundColor: "rgba(234,179,8,0.1)",
        tension: 0.25,
      },
    ],
  });

  const avg = (arr: Metric[], key: keyof Metric) =>
    arr.length ? (arr.reduce((s, x) => s + (x[key] as number), 0) / arr.length).toFixed(2) : "-";

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 mt-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        ⚙️ Performance Metrics Comparison — Go vs Python vs Node
      </h2>

      {/* Time Chart */}
      <div className="mb-10">
        <h3 className="text-lg font-medium mb-2">⏱️ Processing Time (ms)</h3>
        <Line data={buildChartData("durationMS")} />
      </div>

      {/* Memory Chart */}
      <div className="mb-10">
        <h3 className="text-lg font-medium mb-2">💾 Memory Usage (MB)</h3>
        <Line data={buildChartData("memoryMB")} />
      </div>

      {/* Summary Table */}
      <div className="overflow-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Language</th>
              <th className="p-2">Avg Time (ms)</th>
              <th className="p-2">Avg Memory (MB)</th>
              <th className="p-2">Samples</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Go", arr: goMetrics },
              { name: "Python", arr: synthetic.python },
              { name: "Node", arr: synthetic.node },
            ].map(({ name, arr }) => (
              <tr key={name} className="border-t text-center">
                <td className="font-medium p-2">{name}</td>
                <td className="p-2">{avg(arr, "durationMS")}</td>
                <td className="p-2">{avg(arr, "memoryMB")}</td>
                <td className="p-2">{arr.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Synthetic comparison — updates only when new Go data is detected.
      </p>
    </div>
  );
}

"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

type Point = {
  period: string;
  buyVolume: number;
  sellVolume: number;
  sp500Close: number | null;
};

type Props = {
  issuerName: string;
  points: Point[];
};

export default function IssuerMarketTrendChart({ issuerName, points }: Props) {
  if (!points.length) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-5 text-gray-400">
        暫無足夠資料繪製趨勢圖。
      </div>
    );
  }

  const data = {
    labels: points.map((p) => p.period),
    datasets: [
      {
        type: "bar" as const,
        label: "買入量",
        data: points.map((p) => Math.round(p.buyVolume)),
        backgroundColor: "#22d3ee",
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "bar" as const,
        label: "賣出量",
        data: points.map((p) => Math.round(p.sellVolume)),
        backgroundColor: "#f59e0b",
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "S&P 500",
        data: points.map((p) => p.sp500Close),
        borderColor: "#f472b6",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [6, 6],
        tension: 0.25,
        pointRadius: 0,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `${issuerName} 買賣量與 S&P 500 趨勢`,
        color: "#d1d5db",
      },
      legend: {
        labels: { color: "#d1d5db" },
      },
      tooltip: {
        callbacks: {
          label(context: { dataset: { label?: string }; parsed: { y: number } }) {
            const label = context.dataset.label || "";
            if (label === "S&P 500") return `S&P 500: ${context.parsed.y.toFixed(2)}`;
            return `${label}: $${Math.round(context.parsed.y).toLocaleString("en-US")}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(156,163,175,0.15)" },
      },
      y: {
        position: "left" as const,
        ticks: {
          color: "#9ca3af",
          callback(value: string | number) {
            return `$${Number(value).toLocaleString("en-US")}`;
          },
        },
        grid: { color: "rgba(156,163,175,0.15)" },
      },
      y1: {
        position: "right" as const,
        ticks: { color: "#f472b6" },
        grid: { drawOnChartArea: false },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
      <div className="h-72">
        <Chart type="bar" data={data} options={options} />
      </div>
    </div>
  );
}

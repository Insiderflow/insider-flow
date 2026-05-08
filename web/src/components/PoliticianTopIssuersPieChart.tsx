"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type Item = {
  issuerId: string;
  name: string;
  ticker: string | null;
  count: number;
};

type Props = {
  items: Item[];
};

const palette = [
  "#22d3ee",
  "#f472b6",
  "#f59e0b",
  "#34d399",
  "#a78bfa",
  "#60a5fa",
  "#fb7185",
  "#facc15",
];

export default function PoliticianTopIssuersPieChart({ items }: Props) {
  if (!items.length) {
    return <div className="text-gray-400">目前沒有可視化資料。</div>;
  }

  const data = {
    labels: items.map((i) => (i.ticker ? `${i.name} (${i.ticker})` : i.name)),
    datasets: [
      {
        data: items.map((i) => i.count),
        backgroundColor: items.map((_, idx) => palette[idx % palette.length]),
        borderColor: "#111827",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "right" as const,
        labels: { color: "#d1d5db", boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label(context: { label: string; parsed: number }) {
            return `${context.label}: ${context.parsed} 筆`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="h-72">
      <Doughnut data={data} options={options} />
    </div>
  );
}

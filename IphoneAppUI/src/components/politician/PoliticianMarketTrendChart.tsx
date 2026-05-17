import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { PoliticianChartPoint } from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";

ChartJS.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PoliticianMarketTrendChartProps {
  name: string;
  points: PoliticianChartPoint[];
}

export default function PoliticianMarketTrendChart({
  name,
  points,
}: PoliticianMarketTrendChartProps) {
  const { t } = useLanguage();

  if (!points.length) {
    return (
      <p className="py-8 text-center text-sm text-muted">{t.politicianProfile.noChartData}</p>
    );
  }

  const hasSp500 = points.some((p) => p.sp500Close != null);

  const data = {
    labels: points.map((p) => p.period),
    datasets: [
      {
        type: "bar" as const,
        label: t.politicianProfile.buyVolume,
        data: points.map((p) => Math.round(p.buyVolume)),
        backgroundColor: "#22d3ee",
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "bar" as const,
        label: t.politicianProfile.sellVolume,
        data: points.map((p) => Math.round(p.sellVolume)),
        backgroundColor: "#f59e0b",
        borderRadius: 4,
        yAxisID: "y",
      },
      ...(hasSp500
        ? [
            {
              type: "line" as const,
              label: t.politicianProfile.sp500,
              data: points.map((p) => p.sp500Close),
              borderColor: "#f472b6",
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [6, 6],
              tension: 0.25,
              pointRadius: 0,
              yAxisID: "y1",
              spanGaps: true,
            },
          ]
        : []),
    ],
  };

  return (
    <div className="h-64 w-full min-h-[16rem]">
      <Chart
        type="bar"
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: t.politicianProfile.trendTitle(name),
              color: "#d1d5db",
              font: { size: 13, weight: "bold" },
            },
            legend: {
              labels: { color: "#9ca3af", boxWidth: 10, font: { size: 10 } },
            },
            tooltip: {
              callbacks: {
                label(context) {
                  const label = context.dataset.label || "";
                  const y = context.parsed.y;
                  if (label === t.politicianProfile.sp500) {
                    return `${label}: ${Number(y).toFixed(0)}`;
                  }
                  return `${label}: $${Math.round(Number(y)).toLocaleString("en-US")}`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#6b7280", font: { size: 9 }, maxRotation: 45 },
              grid: { color: "rgba(156,163,175,0.1)" },
            },
            y: {
              position: "left",
              ticks: {
                color: "#6b7280",
                font: { size: 9 },
                callback(value) {
                  const n = Number(value);
                  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
                  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
                  return `$${n}`;
                },
              },
              grid: { color: "rgba(156,163,175,0.1)" },
            },
            y1: {
              position: "right",
              ticks: { color: "#f472b6", font: { size: 9 } },
              grid: { drawOnChartArea: false },
            },
          },
          interaction: { intersect: false, mode: "index" },
        }}
      />
    </div>
  );
}

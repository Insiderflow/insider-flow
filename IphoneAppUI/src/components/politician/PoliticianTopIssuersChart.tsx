import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { PoliticianTopIssuer } from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";

ChartJS.register(ArcElement, Tooltip, Legend);

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

interface PoliticianTopIssuersChartProps {
  items: PoliticianTopIssuer[];
}

export default function PoliticianTopIssuersChart({ items }: PoliticianTopIssuersChartProps) {
  const { t } = useLanguage();

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted">{t.politicianProfile.noChartData}</p>
    );
  }

  const data = {
    labels: items.map((i) => (i.ticker ? `${i.name} (${i.ticker})` : i.name)),
    datasets: [
      {
        data: items.map((i) => i.count),
        backgroundColor: items.map((_, idx) => palette[idx % palette.length]),
        borderColor: "#0f1419",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="h-56 w-full">
      <Doughnut
        data={data}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#9ca3af",
                boxWidth: 10,
                font: { size: 10 },
                padding: 8,
              },
            },
            tooltip: {
              callbacks: {
                label(context) {
                  return `${context.label}: ${context.parsed} ${t.politicianProfile.tradesUnit}`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

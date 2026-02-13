import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", transport: 3.5, food: 2.2, energy: 1.8, consumption: 0.5 },
  { day: "Tue", transport: 2.1, food: 3.0, energy: 1.6, consumption: 1.2 },
  { day: "Wed", transport: 4.2, food: 2.5, energy: 2.0, consumption: 0.3 },
  { day: "Thu", transport: 1.8, food: 2.8, energy: 1.5, consumption: 0.8 },
  { day: "Fri", transport: 3.0, food: 3.2, energy: 1.9, consumption: 2.1 },
  { day: "Sat", transport: 1.2, food: 3.5, energy: 2.2, consumption: 3.0 },
  { day: "Sun", transport: 0.8, food: 2.0, energy: 1.4, consumption: 0.6 },
];

const WeeklyChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          This Week
        </h3>
        <span className="text-xs text-muted-foreground">Total: 56.7 kg CO₂</span>
      </div>
      <div className="rounded-xl bg-card p-4 shadow-card">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={2} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              unit="kg"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="transport" stackId="a" fill="hsl(var(--transport))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="food" stackId="a" fill="hsl(var(--food))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="energy" stackId="a" fill="hsl(var(--energy))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="consumption" stackId="a" fill="hsl(var(--consumption))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {[
            { label: "Transport", color: "bg-transport" },
            { label: "Food", color: "bg-food" },
            { label: "Energy", color: "bg-energy" },
            { label: "Consumption", color: "bg-consumption" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyChart;

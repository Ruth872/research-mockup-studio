import { motion } from "framer-motion";
import { Users, Clock, Activity, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";

const attendanceData = [
  { month: "Jan", patients: 820 },
  { month: "Feb", patients: 750 },
  { month: "Mar", patients: 910 },
  { month: "Apr", patients: 880 },
  { month: "May", patients: 1040 },
  { month: "Jun", patients: 960 },
  { month: "Jul", patients: 1100 },
  { month: "Aug", patients: 1050 },
  { month: "Sep", patients: 980 },
  { month: "Oct", patients: 870 },
  { month: "Nov", patients: 920 },
  { month: "Dec", patients: 780 },
];

const symptomData = [
  { name: "Fever", value: 28 },
  { name: "Cough", value: 22 },
  { name: "Headache", value: 18 },
  { name: "Diarrhoea", value: 14 },
  { name: "Back pain", value: 10 },
  { name: "Other", value: 8 },
];

const COLORS = [
  "hsl(152, 55%, 33%)",
  "hsl(36, 85%, 55%)",
  "hsl(210, 70%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 50%, 50%)",
  "hsl(160, 30%, 60%)",
];

const hourlyData = [
  { hour: "06:00", patients: 5 },
  { hour: "07:00", patients: 18 },
  { hour: "08:00", patients: 42 },
  { hour: "09:00", patients: 55 },
  { hour: "10:00", patients: 48 },
  { hour: "11:00", patients: 38 },
  { hour: "12:00", patients: 22 },
  { hour: "13:00", patients: 30 },
  { hour: "14:00", patients: 35 },
  { hour: "15:00", patients: 28 },
  { hour: "16:00", patients: 15 },
  { hour: "17:00", patients: 8 },
];

const weeklyTrend = [
  { week: "W1", urgent: 12, moderate: 28, low: 45 },
  { week: "W2", urgent: 15, moderate: 32, low: 40 },
  { week: "W3", urgent: 10, moderate: 25, low: 50 },
  { week: "W4", urgent: 18, moderate: 30, low: 38 },
];

const statCards = [
  { icon: Users, label: "Total Patients (Month)", value: "1,050", change: "+8.2%" },
  { icon: Clock, label: "Avg. Wait Time", value: "2h 15m", change: "-12%" },
  { icon: Activity, label: "Triage Assessments", value: "342", change: "+24%" },
  { icon: TrendingUp, label: "Peak Hour", value: "09:00 AM", change: "" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Patient Flow Analytics
          </h1>
          <p className="mt-1 text-muted-foreground">
            Kabwata Clinic · Simulated operational data
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                {card.change && (
                  <span className="text-xs font-semibold text-safe">{card.change}</span>
                )}
              </div>
              <p className="mt-4 font-heading text-2xl font-bold text-card-foreground">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Monthly attendance */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-heading text-lg font-semibold text-card-foreground">
              Monthly Patient Attendance
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">2025 simulated data</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,89%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(160,10%,45%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(160,10%,45%)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(140,15%,89%)",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="patients" fill="hsl(152,55%,33%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Symptom distribution */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-heading text-lg font-semibold text-card-foreground">
              Common Symptoms
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">Top presenting complaints</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={symptomData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {symptomData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {symptomData.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {s.name} ({s.value}%)
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Charts row 2 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Hourly flow */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-heading text-lg font-semibold text-card-foreground">
              Peak Consultation Hours
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">Average daily patient flow</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,89%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(160,10%,45%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(160,10%,45%)" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    fill="hsl(152,55%,33%,0.15)"
                    stroke="hsl(152,55%,33%)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Weekly triage */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <h3 className="font-heading text-lg font-semibold text-card-foreground">
              Weekly Triage Distribution
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">Cases by urgency level</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140,15%,89%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(160,10%,45%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(160,10%,45%)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="urgent" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="moderate" stroke="hsl(36,85%,55%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="low" stroke="hsl(152,55%,40%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-urgent" /> Urgent</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-safe" /> Low</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

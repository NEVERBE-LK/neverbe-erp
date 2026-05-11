import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, Legend
} from "recharts";
import {
   Card, Typography, Tag, Spin, Button, Badge, Progress, Space, Divider, Select
} from "antd";
import {
   IconBrain, IconAlertTriangle, IconRefresh, IconRobot, IconTrendingUp, IconChartLine, IconUserCheck,
   IconTarget, IconCalendarStats, IconHistory
} from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import DashboardCard from "../shared/DashboardCard";
import { useNeural } from "@/contexts/NeuralContext";

dayjs.extend(relativeTime);
const { Text, Title, Paragraph } = Typography;

const NeuralStrategicHub = () => {
   const navigate = useNavigate();
   const { data, loading, refreshing, refresh, selectedYear, selectedMonth, setPeriod } = useNeural();
   const [activeTab, setActiveTab] = useState<'TRANSCRIPT' | 'INTERVENTIONS'>('INTERVENTIONS');

   const years = [2024, 2025, 2026];
   const months = [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
   ];

   const isCurrentMonth = selectedYear === dayjs().year() && selectedMonth === (dayjs().month() + 1);
   const isHistorical = dayjs(`${selectedYear}-${selectedMonth}-01`).isBefore(dayjs().startOf('month'));

   if (loading && !data) {
      return (
         <DashboardCard className="h-[600px] flex items-center justify-center bg-emerald-900/20 rounded-[3rem]">
            <Spin size="large" tip="Orchestrating Unified Neural Hub..." />
         </DashboardCard>
      );
   }

   // Process Forecast Data with Past Predictions Overlay
   const raw = data?.projections?.predictions || [];
   const pastPredictions: Record<string, number> = data?.pastPredictions || {};
   const chartPoints: any[] = [];
   
   if (raw.length) {
      raw.forEach((p: any) => {
         const dateStr = dayjs(p.date).format('YYYY-MM-DD');
         chartPoints.push({
            ...p,
            timestamp: dayjs(p.date).valueOf(),
            netSales: Number(p.netSales.toFixed(0)),
            // Add past AI prediction for overlay (only for historical dates)  
            aiPredicted: !p.isForecast && pastPredictions[dateStr] ? Number(pastPredictions[dateStr].toFixed(0)) : undefined,
            // For forecast dates, continue the AI line
            aiForecast: p.isForecast ? Number(p.netSales.toFixed(0)) : undefined
         });
      });
   }
   const fIndex = chartPoints.findIndex(p => p.isForecast);

   // Monthly Target Data
   const mt = data?.monthlyTarget;
   const monthlyProgressColor = mt?.progressPercent >= 80 ? '#059669' : mt?.progressPercent >= 50 ? '#f59e0b' : '#ef4444';
   const monthlyProgressStatus = mt?.progressPercent >= 80 ? 'On Track' : mt?.progressPercent >= 50 ? 'Slightly Behind' : 'Behind Target';

   // Forecast Accuracy
   const accuracy = data?.forecastAccuracy || 0;
   const accuracyPoints = data?.forecastAccuracyDataPoints || 0;

   return (
      <div className="flex flex-col gap-8">
         {/* 🔮 LAYER 0: THE MORNING BRIEFING & EXECUTIVE PULSE */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <DashboardCard className="lg:col-span-8 bg-white/40 backdrop-blur-xl border border-white/40 overflow-hidden relative rounded-[2.5rem] shadow-2xl shadow-emerald-900/5">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12">
                  <IconBrain size={250} className="text-emerald-900" />
               </div>
               <div className="relative z-10 p-8">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3 text-emerald-900">
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                           <IconRobot size={28} className="text-emerald-600" />
                        </div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] block mb-1 text-emerald-900">Neural Core Protocol</span>
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                              {isHistorical ? "Historical Audit" : "Global Briefing"} • {dayjs(data?.generatedAt).format('HH:mm A')}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <Space className="bg-white/50 p-1.5 rounded-2xl border border-white/60 backdrop-blur-sm">
                           <Select 
                              size="small" 
                              value={selectedMonth} 
                              onChange={(m) => setPeriod(selectedYear, m)}
                              className="w-28"
                              bordered={false}
                              options={months}
                           />
                           <Select 
                              size="small" 
                              value={selectedYear} 
                              onChange={(y) => setPeriod(y, selectedMonth)}
                              className="w-20"
                              bordered={false}
                              options={years.map(y => ({ value: y, label: y }))}
                           />
                        </Space>
                        {isCurrentMonth ? (
                           <div className="flex items-center gap-2">
                              <Badge status="processing" color="#10b981" />
                              <span className="text-gray-300 text-[9px] font-black uppercase tracking-widest">Feed Live</span>
                           </div>
                        ) : (
                           <div className="flex items-center gap-2">
                              <IconHistory size={14} className="text-blue-400" />
                              <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest">Backtracked</span>
                           </div>
                        )}
                     </div>
                  </div>

                  {!data ? (
                     <div className="py-20 flex flex-col items-center">
                        <Spin size="large" tip="Generating Insight..." />
                     </div>
                  ) : (
                     <>
                        <Title level={2} className="text-emerald-900! font-black leading-[1.1] mb-6 tracking-tighter max-w-3xl">
                           "{data.briefing}"
                        </Title>

                        <div className="flex items-start gap-8 pt-4 border-t border-gray-100">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                 {isHistorical ? "Month Revenue" : "Sales Momentum"}
                              </span>
                              <span className={`text-xl font-black ${(data?.reality?.comparison?.percentageChange?.revenue || 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                 {(data?.reality?.comparison?.percentageChange?.revenue || 0) >= 0 ? "+" : ""}{data?.reality?.comparison?.percentageChange?.revenue || 0}%
                              </span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Neural Accuracy</span>
                              <span className={`text-xl font-black ${accuracy > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                                 {accuracy > 0 ? `${accuracy}%` : 'Calibrating'}
                              </span>
                              {accuracyPoints > 0 && (
                                 <span className="text-[8px] font-bold text-gray-300 uppercase">{accuracyPoints} data points</span>
                              )}
                           </div>
                        </div>
                     </>
                  )}
               </div>
            </DashboardCard>

            <DashboardCard className="lg:col-span-4 bg-white/80 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
               <div>
                  <div className="flex items-center justify-between mb-8">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        {isHistorical ? "Historical Reliability" : "Global Health Index"}
                     </span>
                     <IconTrendingUp size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                     <span className="text-7xl font-black text-emerald-900 tracking-tighter">{data?.healthScore || 0}</span>
                     <span className="text-2xl font-black text-emerald-900/20">%</span>
                  </div>
                  <Progress percent={data?.healthScore || 0} showInfo={false} strokeColor="#059669" trailColor="#f1f5f9" strokeWidth={14} className="m-0 mb-4" />
                  <Text className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase">
                     {isHistorical 
                        ? `AI analysis of this period shows ${data?.healthScore >= 70 ? 'High' : 'Moderate'} data consistency.`
                        : `AI analysis of 90-day cycles indicates a Stable Growth trajectory.`}
                  </Text>
               </div>

               <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Analysis Engine</span>
                     <span className="text-sm font-black text-emerald-900">GEMINI 1.5 PRO</span>
                  </div>
                  <Button
                     type="text"
                     shape="circle"
                     icon={<IconRefresh className={refreshing ? 'animate-spin text-emerald-600' : 'text-gray-300'} />}
                     onClick={() => refresh(true)}
                  />
               </div>
            </DashboardCard>
         </div>

         {/* Chart and Details */}
         <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
            <DashboardCard className="xl:col-span-8 p-10 relative overflow-hidden group rounded-[3rem] h-full flex flex-col">
               <div className="flex flex-col h-full w-full">
                  <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

               <div className="flex items-center justify-between mb-8 shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="w-1.5 h-8 bg-emerald-600 rounded-full" />
                     <div>
                        <h2 className="text-2xl font-black text-emerald-900 m-0 tracking-tight">Neural Forecast Matrix</h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           {isHistorical ? "Re-simulated Forecast for Historical Data" : `Real vs AI Forecast • ${data?.projections?.metrics?.dataPoints || 0} Training Points`}
                        </span>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <Tag color="emerald" bordered={false} className="m-0 font-black text-[9px] rounded-full px-3">730-DAY LOOKBACK</Tag>
                  </div>
               </div>

               <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                           </linearGradient>
                           <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.08} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                           dataKey="timestamp"
                           type="number"
                           domain={['dataMin', 'dataMax']}
                           axisLine={false}
                           tickLine={false}
                           tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                           tickFormatter={(v) => dayjs(v).format('DD MMM')}
                           minTickGap={40}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                           contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                           labelFormatter={(v) => dayjs(v).format('MMMM DD, YYYY')}
                        />
                        
                        <Area type="monotone" dataKey="netSales" stroke="none" fill="url(#gSales)" data={chartPoints.slice(0, fIndex !== -1 ? fIndex + 1 : chartPoints.length)} />
                        <Line type="monotone" dataKey="netSales" stroke="#059669" strokeWidth={3} dot={false} name="Actual Sales" />
                        
                        <Line type="monotone" dataKey="aiPredicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="AI Simulation" />

                        {fIndex !== -1 && (
                           <>
                              <Area type="monotone" dataKey="aiForecast" stroke="none" fill="url(#gForecast)" />
                              <Line type="monotone" dataKey="aiForecast" stroke="#f59e0b" strokeWidth={3} strokeDasharray="10 5" dot={false} name="AI Forecast" />
                           </>
                        )}
                     </ComposedChart>
                  </ResponsiveContainer>
               </div>
               </div>
            </DashboardCard>

            <div className="xl:col-span-4 flex flex-col gap-6">
               {mt && (
                  <DashboardCard className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                     <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                           <IconCalendarStats size={20} />
                        </div>
                        <div>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none block">{mt.monthName} {mt.year}</span>
                           <span className="text-[9px] font-bold text-gray-300 uppercase">Performance Target</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-center mb-5">
                        <Progress
                           type="circle"
                           percent={Math.min(mt.progressPercent, 100)}
                           size={140}
                           strokeColor={monthlyProgressColor}
                           trailColor="#f1f5f9"
                           strokeWidth={10}
                           format={() => (
                              <div className="flex flex-col items-center">
                                 <span className="text-2xl font-black text-gray-900 tracking-tighter">{mt.progressPercent}%</span>
                                 <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: monthlyProgressColor }}>{monthlyProgressStatus}</span>
                              </div>
                           )}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50/50 rounded-2xl p-3 text-center">
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Actual</span>
                           <span className="text-sm font-black text-emerald-700">Rs. {(mt.actual / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="bg-amber-50/50 rounded-2xl p-3 text-center">
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Target</span>
                           <span className="text-sm font-black text-amber-700">Rs. {(mt.forecast / 1000).toFixed(0)}K</span>
                        </div>
                     </div>
                  </DashboardCard>
               )}

               <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center gap-1">
                  <Button
                     className={`flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-none ${activeTab === 'INTERVENTIONS' ? 'bg-white text-emerald-900' : 'bg-transparent text-gray-400'}`}
                     onClick={() => setActiveTab('INTERVENTIONS')}
                  >
                     Interventions
                  </Button>
                  <Button
                     className={`flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-none ${activeTab === 'TRANSCRIPT' ? 'bg-white text-emerald-900' : 'bg-transparent text-gray-400'}`}
                     onClick={() => setActiveTab('TRANSCRIPT')}
                  >
                     Transcript
                  </Button>
               </div>

               <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-2 custom-scrollbar">
                  {activeTab === 'INTERVENTIONS' ? (
                     data?.interventions?.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                           <div className="flex justify-between items-start mb-2">
                              <Tag color={item.priority === 'CRITICAL' ? 'red' : 'orange'} className="text-[8px] font-black rounded-full uppercase">{item.priority}</Tag>
                              <span className="text-[9px] font-black text-gray-400 uppercase">{item.type}</span>
                           </div>
                           <h4 className="text-sm font-black text-emerald-900 mb-1">{item.title}</h4>
                           <p className="text-[10px] text-gray-500 leading-tight m-0">{item.desc}</p>
                        </div>
                     ))
                  ) : (
                     <div className="p-4 bg-white border border-gray-100 rounded-2xl">
                        <Text className="text-xs italic text-gray-400">Neural analysis transcript available for executive review.</Text>
                     </div>
                  )}
               </div>
            </div>
         </div>

         <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
         `}</style>
      </div>
   );
};

export default NeuralStrategicHub;

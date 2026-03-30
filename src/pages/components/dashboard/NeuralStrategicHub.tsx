import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
   Card, Typography, Tag, Spin, Button, Badge, Progress, Space, Divider
} from "antd";
import {
   IconBrain, IconAlertTriangle, IconRefresh, IconRobot, IconTrendingUp, IconChartLine, IconUserCheck
} from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import DashboardCard from "../shared/DashboardCard";
import { useNeural } from "@/contexts/NeuralContext";

dayjs.extend(relativeTime);
const { Text, Title, Paragraph } = Typography;

const NeuralStrategicHub = () => {
   const navigate = useNavigate();
   const { data, loading, refreshing, refresh } = useNeural();
   const [activeTab, setActiveTab] = useState<'TRANSCRIPT' | 'INTERVENTIONS'>('INTERVENTIONS');

   if (loading && !data) {
      return (
         <DashboardCard className="h-[600px] flex items-center justify-center bg-emerald-950/20 rounded-[3rem]">
            <Spin size="large" tip="Orchestrating Unified Neural Hub..." />
         </DashboardCard>
      );
   }

   if (!data) {
    return (
      <DashboardCard className="h-[400px] flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem]">
        <div className="p-4 bg-white rounded-3xl shadow-xl mb-6">
           <IconBrain size={48} className="text-emerald-200 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-emerald-950 m-0 tracking-tight">Neural Core Synchronizing</h3>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-xs text-center leading-relaxed">
           The Intelligence Hub is currently performing a deep context audit. This typically takes 60-90 seconds.
        </p>
        <Button 
          type="primary" 
          icon={<IconRefresh size={18} className={refreshing ? 'animate-spin' : ''} />} 
          onClick={() => refresh(true)}
          className="mt-8 bg-emerald-600 hover:bg-emerald-700 border-none h-12 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200"
        >
          {refreshing ? 'ORCHESTRATING...' : 'Neural Force Sync'}
        </Button>
      </DashboardCard>
    );
  }

   // Process Forecast Data
   const raw = data?.projections?.predictions || [];
   const chartPoints: any[] = [];
   if (raw.length) {
      const today = dayjs().format('YYYY-MM-DD');
      raw.forEach((p: any) => {
         chartPoints.push({
            ...p,
            timestamp: dayjs(p.date).valueOf(),
            netSales: Number(p.netSales.toFixed(0))
         });
      });
   }
   const fIndex = chartPoints.findIndex(p => p.isForecast);

   return (
      <div className="flex flex-col gap-8">
         {/* 🔮 LAYER 0: THE MORNING BRIEFING & EXECUTIVE PULSE */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <DashboardCard className="lg:col-span-8 bg-white/40 backdrop-blur-xl border border-white/40 overflow-hidden relative rounded-[2.5rem] shadow-2xl shadow-emerald-950/5">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12">
                  <IconBrain size={250} className="text-emerald-950" />
               </div>
               <div className="relative z-10 p-8">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3 text-emerald-950">
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                           <IconRobot size={28} className="text-emerald-600" />
                        </div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] block mb-1 text-emerald-950">Neural Core Protocol</span>
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Briefing • {dayjs(data.generatedAt).format('HH:mm A')}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <Badge status="processing" color="#10b981" />
                        <span className="text-gray-300 text-[9px] font-black uppercase tracking-widest">Feed Live</span>
                     </div>
                  </div>

                  <Title level={2} className="!text-emerald-950 font-black leading-[1.1] mb-6 tracking-tighter max-w-3xl">
                     "{data.briefing}"
                  </Title>

                  <div className="flex items-center gap-8 pt-4 border-t border-gray-100">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales Momentum</span>
                        <span className="text-xl font-black text-emerald-600">+{data?.reality?.comparison?.percentageChange?.revenue || 0}%</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Neural Accuracy</span>
                        <span className="text-xl font-black text-emerald-600">98.4%</span>
                     </div>
                  </div>
               </div>
            </DashboardCard>

            <DashboardCard className="lg:col-span-4 bg-white/80 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
               <div>
                  <div className="flex items-center justify-between mb-8">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Global Health Index</span>
                     <IconTrendingUp size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                     <span className="text-7xl font-black text-emerald-950 tracking-tighter">{data.healthScore}</span>
                     <span className="text-2xl font-black text-emerald-950/20">%</span>
                  </div>
                  <Progress percent={data.healthScore} showInfo={false} strokeColor="#059669" trailColor="#f1f5f9" strokeWidth={14} className="m-0 mb-4" />
                  <Text className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase">
                     AI analysis of 90-day cycles indicates a <span className="text-emerald-600 font-black">Stable Growth</span> trajectory.
                  </Text>
               </div>

               <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-gray-400 uppercase">Liquidity Peak</span>
                     <span className="text-sm font-black text-emerald-950">OPTIMAL</span>
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

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                     <IconChartLine size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Daily Velocity</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-emerald-950">Rs. {data.reality.snapshot.totalNetSales.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Today's Net Revenue</span>
               </div>
            </DashboardCard>

            <DashboardCard className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                     <IconTrendingUp size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Profit Delta</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-950">+{data.reality.comparison.percentageChange.profit}%</span>
                  <Tag color="blue" bordered={false} className="m-0 text-[10px] font-black rounded-full px-2">MONTHLY</Tag>
               </div>
               <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 block">Vs Last Month Performance</span>
            </DashboardCard>

            <DashboardCard className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                     <IconRobot size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Logistics Pulse</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                     <span className="text-2xl font-black text-emerald-950">{data.reality.orderStats?.pending || 0}</span>
                     <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex flex-col">
                     <span className="text-2xl font-black text-emerald-950">{data.reality.orderStats?.processing || 0}</span>
                     <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Process</span>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex flex-col">
                     <span className="text-2xl font-black text-emerald-950">{data.reality.orderStats?.shipped || 0}</span>
                     <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Shipped</span>
                  </div>
               </div>
            </DashboardCard>

            <DashboardCard className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                     <IconAlertTriangle size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Intelligence Risks</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-2xl font-black text-emerald-950">{data.reality.neuralRisks.length}</span>
                     <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Stock Breaches</span>
                  </div>
               </div>
            </DashboardCard>
         </div>

         <div className="h-px w-full bg-gray-100/50 my-2" />

         {/* 🛰️ LAYER 1: NEURAL FORECAST MATRIX & ACTIONABLE FEED */}
         <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <DashboardCard className="xl:col-span-8 p-10 relative overflow-hidden group rounded-[3rem]">
               <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

               <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                     <div className="w-1.5 h-8 bg-emerald-600 rounded-full" />
                     <div>
                        <h2 className="text-2xl font-black text-emerald-950 m-0 tracking-tight">Neural Forecast Matrix</h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">14-Day Trajectory Prediction</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <Tag color="emerald" bordered={false} className="m-0 font-black text-[9px] rounded-full px-3">TF.JS ACTIVE</Tag>
                     <Tag color="amber" bordered={false} className="m-0 font-black text-[9px] rounded-full px-3">FORECASTING</Tag>
                  </div>
               </div>

               <div className="h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                           </linearGradient>
                           <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                           dataKey="timestamp"
                           type="number"
                           domain={['auto', 'auto']}
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
                           itemStyle={{ fontWeight: 900, fontSize: '16px' }}
                        />
                        <Area type="monotone" dataKey="netSales" stroke="none" fill="url(#gSales)" data={chartPoints.slice(0, fIndex + 1)} isAnimationActive={false} />
                        <Area type="monotone" dataKey="netSales" stroke="none" fill="url(#gForecast)" data={chartPoints.slice(fIndex)} isAnimationActive={false} />
                        <Area type="monotone" dataKey="netSales" stroke="#059669" strokeWidth={3} fill="none" data={chartPoints.slice(0, fIndex + 1)} dot={false} />
                        <Area type="monotone" dataKey="netSales" stroke="#f59e0b" strokeWidth={4} strokeDasharray="10 5" fill="none" data={chartPoints.slice(fIndex)} dot={false} />
                        {fIndex !== -1 && (
                           <ReferenceLine x={chartPoints[fIndex].timestamp} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                        )}
                     </AreaChart>
                  </ResponsiveContainer>
               </div>

               <div className="mt-8 flex items-center gap-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <IconChartLine size={20} />
                     </div>
                     <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block leading-none mb-1">Projected Peak</span>
                        <span className="text-sm font-black text-emerald-950">Rs. {Math.max(...chartPoints.map(p => p.netSales)).toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <IconUserCheck size={20} />
                     </div>
                     <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase block leading-none mb-1">Growth Forecast</span>
                        <span className="text-sm font-black text-amber-600">POSITIVE</span>
                     </div>
                  </div>
               </div>
            </DashboardCard>

            {/* Action Feed Sidebar */}
            <div className="xl:col-span-4 flex flex-col gap-6">
               <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center gap-1">
                  <Button
                     className={`flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-none transition-all ${activeTab === 'INTERVENTIONS' ? 'bg-white shadow-sm text-emerald-900' : 'bg-transparent text-gray-400'}`}
                     onClick={() => setActiveTab('INTERVENTIONS')}
                  >
                     INTERVENTIONS ({data.interventions?.length || 0})
                  </Button>
                  <Button
                     className={`flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-none transition-all ${activeTab === 'TRANSCRIPT' ? 'bg-white shadow-sm text-emerald-900' : 'bg-transparent text-gray-400'}`}
                     onClick={() => setActiveTab('TRANSCRIPT')}
                  >
                     TRANSCRIPT
                  </Button>
               </div>

               <div className="flex-1 overflow-y-auto max-h-[580px] pr-1 custom-scrollbar space-y-4">
                  {activeTab === 'INTERVENTIONS' ? (
                     <>
                        {data.interventions?.map((item: any, idx: number) => (
                           <div
                              key={idx}
                              onClick={() => {
                                 const routes: any = { REVENUE: "/reports", FINANCE: "/finance", INVENTORY: "/inventory/purchase-orders", PROMOTION: "/campaign/promotions" };
                                 if (routes[item.type]) navigate(routes[item.type]);
                              }}
                              className="rounded-[2.5rem] p-8 border border-gray-100 bg-white/80 backdrop-blur-md cursor-pointer hover:translate-y-[-4px] transition-all hover:shadow-xl hover:shadow-emerald-950/5 group"
                           >
                              <div className="flex gap-6">
                                 {item.imageUrl && (
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shrink-0 bg-white">
                                       <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                 )}
                                 <div className="flex flex-col gap-4 flex-1">
                                    <div className="flex items-center justify-between">
                                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">{item.type}</span>
                                       <Tag color={item.priority === 'CRITICAL' ? 'red' : 'processing'} bordered={false} className="m-0 text-[8px] font-black rounded-full px-2">
                                          {item.priority}
                                       </Tag>
                                    </div>
                                    <h4 className="m-0 font-black text-emerald-950 leading-tight tracking-tight text-lg">{item.title}</h4>
                                    <p className="m-0 text-xs text-gray-500 leading-relaxed font-bold">
                                       {item.desc}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        ))}
                        {(!data.interventions || data.interventions.length === 0) && (
                           <div className="py-20 flex flex-col items-center opacity-30">
                              <IconBrain size={48} className="text-gray-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest mt-4">System Balanced</span>
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="space-y-3">
                        {chartPoints.filter(p => p.isForecast).map((p, idx) => (
                           <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-gray-400 uppercase">{dayjs(p.date).format('dddd')}</span>
                                 <span className="text-xs font-black text-emerald-950">{dayjs(p.date).format('MMM DD, YYYY')}</span>
                              </div>
                              <div className="text-right">
                                 <span className="text-sm font-black text-amber-600 block">Rs. {p.netSales.toLocaleString()}</span>
                                 <span className="text-[8px] font-bold text-gray-300 uppercase">Neural Estimate</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>

         <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
      </div>
   );
};

export default NeuralStrategicHub;

import React from "react";
import { Card, Progress, Typography, Space, Badge, Tooltip } from "antd";
import { IconBrain, IconCash, IconAlertTriangle, IconTrendingUp } from "@tabler/icons-react";

const { Text, Title } = Typography;

interface Props {
  neuralData: any;
}

const NeuralFinanceInsight: React.FC<Props> = ({ neuralData }) => {
  if (!neuralData) return null;

  const score = neuralData.financialResilience || 0;
  const finance = neuralData.reality?.finance || {};
  
  const getStatusColor = (s: number) => {
    if (s > 70) return "#10b981"; // Emerald
    if (s > 40) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const status = score > 70 ? "Healthy" : score > 40 ? "Stable" : "Critical";

  return (
    <Card 
      className="mb-8 border-none shadow-xl relative overflow-hidden" 
      style={{ 
        background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
        borderRadius: "24px"
      }}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Left: Score */}
          <div className="flex-1">
            <Space align="center" className="mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <IconBrain size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60">Neural Financial Engine</span>
            </Space>
            
            <Title level={2} className="!text-white !mb-1 font-black tracking-tight">
              Cashflow Resilience
            </Title>
            <Text className="text-emerald-100/40 text-xs block mb-6">
              AI analysis of projected inbound revenue vs. upcoming supplier obligations.
            </Text>

            <div className="flex items-center gap-6">
              <div className="flex-1">
                <Progress 
                  percent={score} 
                  strokeColor={getStatusColor(score)}
                  trailColor="rgba(255,255,255,0.05)"
                  strokeWidth={12}
                  showInfo={false}
                  className="mb-2"
                />
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                   <span className="text-emerald-100/40">Resilience Score</span>
                   <span style={{ color: getStatusColor(score) }}>{status} ({score}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Insights */}
          <div className="flex-1 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                     <IconCash size={14} className="text-emerald-400" />
                     <span className="text-[9px] font-bold text-emerald-100/40 uppercase">Net Stability</span>
                  </div>
                  <div className="text-lg font-black text-white">
                     {score > 50 ? 'SURPLUS' : 'STRESS'}
                  </div>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                     <IconTrendingUp size={14} className="text-emerald-400" />
                     <span className="text-[9px] font-bold text-emerald-100/40 uppercase">14d Projection</span>
                  </div>
                  <div className="text-lg font-black text-white">
                     Rs {Math.round(neuralData.projections?.avgForecastedDaily * 14 / 1000 || 0)}K
                  </div>
               </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
               <IconAlertTriangle size={18} className="text-emerald-400 mt-1 shrink-0" />
               <div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase mb-1">Neural Briefing</div>
                  <Text className="text-[11px] text-emerald-100/70 leading-relaxed block">
                    {score < 40 
                      ? "Critical liquidity stress detected. Projected inflow will not cover upcoming supplier payables."
                      : score < 70 
                      ? "Cashflow is stable but requires monitoring. 14-day velocity tracks with expense drift."
                      : "Exceptional financial resilience. Surplus capital projected from neural sales spikes."}
                  </Text>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NeuralFinanceInsight;

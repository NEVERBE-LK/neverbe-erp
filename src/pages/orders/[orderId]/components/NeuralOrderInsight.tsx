import React, { useEffect, useState } from "react";
import { Card, Badge, Space, Typography, Tooltip, Spin } from "antd";
import api from "@/lib/api";
import { Order } from "@/model/Order";

const { Text, Title } = Typography;

interface Props {
  order: Order;
}

const NeuralOrderInsight: React.FC<Props> = ({ order }) => {
  const [loading, setLoading] = useState(true);
  const [neuralData, setNeuralData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const { data } = await api.get("/api/v1/erp/ai/neural");
      if (data.success) {
        setNeuralData(data.data);
      }
    } catch (err) {
      console.error("Neural Analysis Failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-4 flex justify-center"><Spin size="small" /></div>;
  if (!neuralData) return null;

  // Calculate Strategic Weight
  const total = order.total || 0;
  const todaySales = neuralData.reality?.snapshot?.totalNetSales || 1;
  const strategicWeight = Math.min(100, Math.round((total / todaySales) * 100));

  // Find Risky Items in this Order
  const riskyItems = order.items?.filter(item => 
    neuralData.reality?.neuralRisks?.some((r: any) => r.productId === item.itemId)
  ) || [];

  return (
    <Card 
      className="mb-8 overflow-hidden relative shadow-md" 
      style={{ 
        background: "rgba(255, 255, 255, 0.7)", 
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(16, 185, 129, 0.1)" 
      }}
      bodyStyle={{ padding: "20px" }}
    >
      {/* Background Pulse */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-2xl animate-pulse" />
      
      <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
        {/* Strategic Weight */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Neural Strategic Hub</span>
          </div>
          
          <Title level={4} className="!mb-1 !mt-0 font-black tracking-tight">
            Order Fulfillment Strategy
          </Title>
          <Text className="text-gray-500 text-xs leading-relaxed italic">
             Neural Core analyzed {order.items?.length || 0} items for fulfillment priorities.
          </Text>

          <div className="mt-4 flex items-center gap-6">
             <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Impact Weight</div>
                <div className="flex items-end gap-1">
                   <span className="text-2xl font-black text-emerald-600 leading-none">{strategicWeight}%</span>
                   <span className="text-[10px] font-bold text-emerald-800/40 mb-1 leading-none">OF TODAY</span>
                </div>
             </div>

             <div className="w-px h-8 bg-gray-100" />

             <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Overall Health</div>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-bold leading-none">{neuralData.healthScore}/100</span>
                   <Badge status={neuralData.healthScore > 70 ? 'success' : 'warning'} className="mb-1" />
                </div>
             </div>
          </div>
        </div>

        {/* Neural Risks */}
        <div className="flex-1 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
            <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
               <div className="text-emerald-900 opacity-60 flex items-center gap-1">
                  <span className="animate-pulse">⚠️</span> CRITICAL STOCK RUNWAY
               </div>
               <div className="text-emerald-600/40">DAYS LEFT</div>
            </div>
           
           {riskyItems.length > 0 ? (
             <div className="space-y-3">
                {riskyItems.map(item => {
                  const risk = neuralData.reality.neuralRisks.find((r: any) => r.productId === item.itemId);
                  return (
                    <div key={item.itemId} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-emerald-100">
                       <div className="flex-1">
                          <Text strong className="block text-xs leading-tight text-gray-700">{item.name}</Text>
                          <Text type="secondary" className="text-[9px]">Predicted Demand: {risk.projectedDemand} units</Text>
                       </div>
                       <Tooltip title={`${risk.daysRemaining} days of inventory remaining based on neural demand forecasting.`}>
                          <div className="flex flex-col items-end">
                             <Badge 
                               count={`${risk.daysRemaining}D`} 
                               style={{ backgroundColor: risk.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b', fontSize: '9px', padding: '0 8px', borderRadius: '6px' }} 
                             />
                             <span className="text-[7px] font-bold text-gray-300 mt-1 uppercase">RUNWAY</span>
                          </div>
                       </Tooltip>
                    </div>
                  );
                })}
             </div>
           ) : (
             <div className="h-full flex items-center justify-center py-4 italic text-gray-400 text-[10px]">
                All items in this order have stable neural runways ({">"}14 days).
             </div>
           )}
        </div>
      </div>
    </Card>
  );
};

export default NeuralOrderInsight;

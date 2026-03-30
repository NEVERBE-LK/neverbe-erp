import { useEffect, useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { 
  Button, 
  Tag, 
  Spin, 
  Typography, 
  Tooltip as AntTooltip,
  Badge,
  Card 
} from "antd";
import { 
  IconBrain, 
  IconRefresh, 
  IconRobot, 
  IconTrendingUp,
  IconInfoCircle,
  IconClock
} from "@tabler/icons-react";
import DashboardCard from "../shared/DashboardCard";
import api from "@/lib/api";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

interface ForecastPoint {
  date: string;
  netSales: number;
  isForecast: boolean;
}

interface HybridData {
  forecast: {
    success?: boolean;
    message?: string;
    predictions: ForecastPoint[];
    metrics: {
      dataPoints: number;
    };
  };
  advisory: string;
  generatedAt: string;
  isAdvisoryFromCache: boolean;
}

const HybridIntelligencePanel = () => {
  const [data, setData] = useState<HybridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntelligence = async (refresh: boolean = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get(`/api/v1/erp/ai/hybrid?refresh=${refresh}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to sync intelligence hub");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  if (loading) {
    return (
      <DashboardCard className="h-[400px] flex items-center justify-center">
        <Spin size="large" tip="Synchronizing Neural Intelligence..." />
      </DashboardCard>
    );
  }

  const chartData = data?.forecast?.predictions || [];
  const forecastStartIndex = chartData.findIndex(p => p.isForecast);

  return (
    <DashboardCard className="relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700" />

      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-200">
              <IconBrain size={18} className="text-white" />
            </div>
            <h4 className="text-lg font-black text-gray-900 m-0 tracking-tight">Intelligence Hub</h4>
          </div>
          <div className="flex items-center gap-2">
            <Tag color="emerald" bordered={false} className="m-0 text-[10px] font-black uppercase tracking-wider rounded-full py-0 px-2 bg-emerald-50 text-emerald-600">
              Real-time Neural Engine
            </Tag>
            {data?.isAdvisoryFromCache && (
              <AntTooltip title={`Advisory generated at ${dayjs(data.generatedAt).format('LT')}`}>
                <Badge status="default" text={<span className="text-[10px] font-bold text-gray-400">CACHED ADVISORY</span>} />
              </AntTooltip>
            )}
          </div>
        </div>
        
        <Button 
          type="text" 
          icon={<IconRefresh size={18} className={`${refreshing ? 'animate-spin text-emerald-600' : 'text-gray-400'}`} />} 
          onClick={() => fetchIntelligence(true)}
          disabled={refreshing}
          className="hover:bg-gray-50 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART SECTION */}
        <div className="lg:col-span-2 relative">
          {!chartData.length && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <IconBrain size={48} className="text-gray-300 mb-2" stroke={1} />
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {data?.forecast?.success === false ? "Insufficient Data for Neural Forecast" : "Analyzing Trajectory..."}
              </Text>
              <Text className="text-[10px] text-gray-400 mt-1">Need at least 7 days of historical sales records</Text>
            </div>
          )}
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => dayjs(val).format('DD MMM')}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `Rs.${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 800, marginBottom: '4px', fontSize: '12px' }}
                  formatter={(value: number, name: string, props: any) => [
                    <span key="val" className="font-black text-gray-900">Rs. {value.toLocaleString()}</span>,
                    <span key="label" className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{props.payload.isForecast ? 'Predicted' : 'Actual'}</span>
                  ]}
                />
                {/* Historical Area */}
                <Area 
                  type="monotone" 
                  dataKey="netSales" 
                  stroke="#059669" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  data={chartData.slice(0, forecastStartIndex + 1)}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                {/* Forecast Area */}
                <Area 
                  type="monotone" 
                  dataKey="netSales" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorForecast)" 
                  data={chartData.slice(forecastStartIndex)}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <ReferenceLine x={chartData[forecastStartIndex]?.date} stroke="#e2e8f0" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Historical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Forecast</span>
            </div>
          </div>
        </div>

        {/* ADVISORY SECTION */}
        <div className="flex flex-col gap-3">
          <Card 
            size="small" 
            bordered={false} 
            className="bg-gray-50/50 rounded-2xl border border-gray-100 flex-1 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconRobot size={18} className="text-emerald-600" />
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">AI Strategic Advisor</span>
            </div>
            <Paragraph className="text-xs leading-relaxed text-gray-600 font-bold m-0 italic line-clamp-6">
              "{data?.advisory}"
            </Paragraph>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-emerald-600">
                <IconTrendingUp size={14} />
                <span className="text-[10px] font-black tracking-widest uppercase">Action Advised</span>
              </div>
              <IconInfoCircle size={14} className="text-gray-300 pointer-events-none" />
            </div>
          </Card>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              <IconInfoCircle size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                Forecast: Real-time
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="text-[9px] font-black uppercase tracking-widest">
                 {data?.forecast?.metrics?.dataPoints || 0} Data Points
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default HybridIntelligencePanel;

import React, { useState } from "react";
import { Badge, Tooltip, Popover, Progress, Button, Typography, Tag } from "antd";
import { IconBrain, IconRefresh, IconArrowRight, IconBolt } from "@tabler/icons-react";
import { useNeural } from "@/contexts/NeuralContext";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Text, Title, Paragraph } = Typography;

interface NeuralPulseProps {
  collapsed?: boolean;
}

const NeuralPulse = ({ collapsed = false }: NeuralPulseProps) => {
  const { data, loading, refreshing, refresh } = useNeural();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  if (!data && !loading) return null;

  const score = data?.healthScore || 0;
  
  const getStatusColor = () => {
    if (score >= 80) return "#10b981"; // Emerald
    if (score >= 60) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const getStatusLabel = () => {
    if (score >= 80) return "OPTIMAL";
    if (score >= 60) return "STABLE";
    return "CRITICAL";
  };

  const handleEnterHub = () => {
    setVisible(false);
    navigate("/dashboard");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const content = (
    <div className="w-[320px] p-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-3 bg-emerald-950 rounded-2xl">
            <IconBrain size={20} className="text-emerald-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Neural Status</span>
        </div>
        <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'} bordered={false} className="m-0 font-black text-[9px] rounded-full px-2 shadow-sm">
           {getStatusLabel()}
        </Tag>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <Title level={1} className="m-0 font-black tracking-tighter text-emerald-950 leading-none">{score}%</Title>
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Health Index</Text>
        </div>
        <Progress percent={score} showInfo={false} strokeColor={getStatusColor()} trailColor="#f1f5f9" strokeWidth={10} className="m-0" />
      </div>

      <div className="bg-emerald-50/30 rounded-2xl p-4 mb-6 border border-emerald-100/50">
        <Paragraph className="text-[11px] leading-relaxed text-emerald-900/60 m-0 italic font-medium">
          "{data?.briefing || "Neural Core is synchronizing your business trajectory..."}"
        </Paragraph>
      </div>

      <div className="flex flex-col gap-2">
        <Button 
          type="primary" 
          block
          icon={<IconArrowRight size={16} />}
          onClick={handleEnterHub}
          className="bg-emerald-600 hover:bg-emerald-700 border-none h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          Enter Strategy Hub
        </Button>
        <Button 
          type="text" 
          block
          disabled={refreshing}
          icon={<IconRefresh size={14} className={refreshing ? 'animate-spin' : ''} />}
          onClick={() => refresh(true)}
          className="h-10 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 mt-1"
        >
          {refreshing ? 'Syncing...' : 'Force Intelligence Sync'}
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between opacity-30">
         <span className="text-[8px] font-black uppercase tracking-widest">Feed: {dayjs(data?.generatedAt).fromNow()}</span>
         <IconBolt size={12} />
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-4">
      <Popover 
        content={content} 
        trigger="click" 
        open={visible}
        onOpenChange={setVisible}
        placement="rightTop"
        overlayClassName="neural-pulse-popover"
        overlayInnerStyle={{ borderRadius: '2rem', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '20px 25px 50px -12px rgb(0 0 0 / 0.1)' }}
      >
        <div className={`group relative cursor-pointer active:scale-95 transition-transform ${collapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
          {/* Breathing Aura */}
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: getStatusColor(), animationDuration: score >= 80 ? '3s' : '1.5s' }}
          />
          
          <div className={`relative w-full h-full rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:border-emerald-200 transition-colors`}>
            <Badge count={`${score}%`} size="small" offset={[5, -5]} style={{ backgroundColor: getStatusColor(), fontSize: '8px', fontWeight: 900, border: 'none', display: collapsed ? 'none' : 'block' }}>
              <IconBrain size={collapsed ? 18 : 22} className={refreshing ? 'text-emerald-400 animate-pulse' : 'text-emerald-950'} />
            </Badge>
          </div>
        </div>
      </Popover>

      <style>{`
        .neural-pulse-popover .ant-popover-inner {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default NeuralPulse;

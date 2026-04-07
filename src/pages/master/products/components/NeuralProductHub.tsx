import React from "react";
import { Card, Row, Col, Statistic, Typography, Space, Tag, Button, Tooltip } from "antd";
import { IconBrain, IconTrendingUp, IconAlertTriangle, IconCash } from "@tabler/icons-react";
import { useNeural } from "@/contexts/NeuralContext";

import { useNavigate } from "react-router-dom";
const { Text, Title } = Typography;


const NeuralProductHub: React.FC = () => {
  const { data: neuralData, loading } = useNeural();
  const navigate = useNavigate();


  if (loading) return null;
  if (!neuralData) return null;

  // Price Advisor Logic: High Velocity + Low Stock Runway
  const priceAdvisories = neuralData.reality?.neuralRisks
    ?.filter((r: any) => r.daysRemaining < 14)
    ?.slice(0, 3) || [];

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <Row gutter={[24, 24]}>
        {/* Main Strategic Card */}
        <Col xs={24} lg={16}>
          <Card
            className="h-full border-none shadow-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
              borderRadius: "24px"
            }}

          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />

            <div className="relative z-10 p-2">
              <Space align="center" className="mb-6">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <IconBrain size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60">Neural Product Analytics</span>
              </Space>

              <Row gutter={[48, 32]}>
                <Col xs={24} md={12}>

                  <Title level={2} className="!text-white !mb-1 font-black">
                    Catalog Health
                  </Title>
                  <Text className="text-emerald-100/40 text-xs block mb-8">
                    System-wide ROI and Stock Momentum optimization.
                  </Text>

                  <div className="flex gap-8">
                    <Statistic
                      title={<span className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-wider">Health Score</span>}
                      value={neuralData.healthScore}
                      suffix={<span className="text-emerald-400/40 text-xs">/100</span>}
                      valueStyle={{ color: '#fff', fontWeight: 900, fontSize: '28px' }}
                    />
                    <Statistic
                      title={<span className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-wider">Depletion Risks</span>}
                      value={neuralData.reality?.neuralRisks?.length || 0}
                      valueStyle={{ color: '#fbbf24', fontWeight: 900, fontSize: '28px' }}
                      prefix={<IconAlertTriangle size={24} className="mr-2" />}
                    />
                  </div>
                </Col>

                <Col xs={24} md={12} className="border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-12 flex flex-col justify-center">

                  <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3">
                      <IconTrendingUp size={16} className="text-emerald-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Intelligence Briefing</span>
                    </div>
                    <Text className="text-[11px] text-emerald-100/70 leading-relaxed block italic h-12 overflow-hidden">
                      &quot;{neuralData.briefing}&quot;
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        {/* Price Advisor Card */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space className="pt-2">
                <IconCash size={18} className="text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60">Neural Price Advisor</span>
              </Space>
            }
            className="h-full border-none shadow-xl rounded-[24px] bg-white/80 backdrop-blur-md"
            bodyStyle={{ padding: '0 24px 24px' }}
          >
            <div className="space-y-4 pt-4">
              {priceAdvisories.length > 0 ? (
                priceAdvisories.map((item: any) => (
                  <div key={item.productId} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 transition-all">
                    <div className="flex-1">
                      <Text strong className="block text-[11px] truncate w-32">{item.name}</Text>
                      <Text className="text-[9px] text-emerald-600 font-bold">Velocity Spike Detected</Text>
                    </div>
                    <div className="text-right">
                      <Tooltip title="Neural recommendation to maximize profit margin while stock lasts.">
                        <Tag color="emerald" className="m-0 border-none font-black text-[10px] px-2 rounded-lg bg-emerald-500 text-white">
                          RECO: +10%
                        </Tag>
                      </Tooltip>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                    <IconTrendingUp size={20} />
                  </div>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No immediate price increases recommended.</Text>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 text-center">
              <Button 
                type="link" 
                onClick={() => navigate('/reports/sales/sales-vs-discount')}
                className="w-full text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500"
              >
                View Full Elasticity Report
              </Button>
            </div>

          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NeuralProductHub;

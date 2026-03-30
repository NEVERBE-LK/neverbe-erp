import api from "@/lib/api";
import React, { useState } from "react";
import PageContainer from "../../components/container/PageContainer";
import {
  IconBrain,
  IconRobot,
} from "@tabler/icons-react";
import { functions } from "@/firebase/firebaseClient";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";
import {
  Card,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Badge,
} from "antd";

const { Text } = Typography;

const AISettingsPage = () => {
  const [training, setTraining] = useState<boolean>(false);

  const handleManualTrain = async () => {
    try {
      setTraining(true);
      toast.loading("Starting Neural Training Job...", { id: "training-job" });
      
      const triggerFn = httpsCallable(functions, "triggerManualTraining");
      // We don't await the full result here if we want to be truly async, 
      // but Firebase Functions return when the code finishes. 
      // Given your request for "too much time", we'll just show the trigger success.
      const result: any = await triggerFn();
      
      if (result.data.success) {
        toast.success("Training started in background! You will receive a notification when finished.", { id: "training-job", duration: 6000 });
      }
    } catch (err: any) {
      console.error("[Manual Training Error]", err);
      toast.error(err.message || "Failed to trigger manual training", { id: "training-job" });
    } finally {
      setTraining(false);
    }
  };

  return (
    <PageContainer title="AI Settings" description="Neural Engine Management">
      <Space
        direction="vertical"
        size="large"
        className="w-full"
      >
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-emerald-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Artificial Intelligence
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                AI Settings
              </h2>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <IconBrain size={20} className="text-emerald-600" /> 
                  <span className="text-emerald-600">Neural Engine Control</span>
                </Space>
              }
              className="border-emerald-100 bg-emerald-50/10 shadow-sm rounded-2xl"
            >
              <div className="flex flex-col gap-6 p-2">
                <div>
                  <Text strong className="text-lg block mb-1">Intelligence Hub Training</Text>
                  <Text type="secondary" className="text-sm">
                    Manually re-train the ML model and regenerate AI advisory using the latest historical data. 
                    This process invokes the Gemini 2.5 Flash analysis engine and updates all dashboard forecasts.
                  </Text>
                </div>
                
                <div className="p-6 bg-white rounded-2xl border border-emerald-50 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Engine Status</Text>
                    <Space size="middle">
                      <Badge status="processing" color="emerald" />
                      <Text strong className="text-emerald-700 text-lg">Operational</Text>
                    </Space>
                  </div>
                  
                  <Button 
                    type="primary"
                    size="large"
                    icon={<IconRobot size={20} />}
                    loading={training}
                    onClick={handleManualTrain}
                    className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-bold h-14 px-8 flex items-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    Trigger Manual Training
                  </Button>
                </div>
                
                <div className="flex items-start gap-2 p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
                  <div className="mt-0.5">
                    <IconBrain size={16} className="text-emerald-600" />
                  </div>
                  <Text type="secondary" className="text-xs italic">
                    Note: The Neural Engine automatically runs on a 60-minute schedule. 
                    Manual training will override the current cache immediately with fresh predictions.
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={<span className="text-xs font-black uppercase tracking-widest text-gray-400">Model Information</span>}
              bordered={false}
              className="rounded-2xl bg-gray-50/50"
            >
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between items-center py-2">
                  <Text type="secondary" className="text-xs">Primary Model</Text>
                  <Badge color="blue" text={<span className="font-bold text-xs">Gemini 2.5 Flash</span>} />
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <Text type="secondary" className="text-xs">Regional Engine</Text>
                  <Text className="font-bold text-xs uppercase">us-central1</Text>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <Text type="secondary" className="text-xs">Instances</Text>
                  <Text className="font-bold text-xs">Gen 2 Lifecycle</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </PageContainer>
  );
};

export default AISettingsPage;

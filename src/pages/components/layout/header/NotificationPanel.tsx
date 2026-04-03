import { useEffect, useState } from "react";
import { Drawer, List, Badge, Button, Space, Typography, Tag, Empty, Tooltip } from "antd";
import { IconBell, IconCheck, IconExternalLink, IconTrash, IconBrain } from "@tabler/icons-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

dayjs.extend(relativeTime);
import toast from "react-hot-toast";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: Props) {
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("ALL");

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch("/api/v1/erp/notifications", { id });
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/api/v1/erp/notifications", { all: true });
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    handleMarkAsRead(n.id);
    onClose();
    
    if (n.metadata?.orderId) {
      navigate(`/orders/${n.metadata.orderId}`);
    } else if (n.type === "STOCK") {
      navigate("/inventory");
    }
  };

  const getTypeTag = (type: string) => {
    switch (type) {
      case "ORDER": return <Tag color="blue" bordered={false} className="m-0 text-[8px] font-black uppercase px-2 rounded-full">Order</Tag>;
      case "STOCK": return <Tag color="orange" bordered={false} className="m-0 text-[8px] font-black uppercase px-2 rounded-full">Inventory</Tag>;
      case "AI": return <Tag color="purple" bordered={false} className="m-0 text-[8px] font-black uppercase px-2 rounded-full shadow-sm shadow-purple-100">AI Engine</Tag>;
      default: return <Tag color="gray" bordered={false} className="m-0 text-[8px] font-black uppercase px-2 rounded-full">System</Tag>;
    }
  };

    const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
    const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setExpandedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };

    const filteredNotifications = notifications.filter(n => {
      if (filter === "ALL") return true;
      return n.type === filter;
    });

    return (
      <Drawer
        title={
          <div className="flex flex-col gap-6 w-full py-2">
            <div className="flex items-center justify-between">
              <Space size="middle">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                   <IconBell size={22} className="text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <Title level={5} style={{ margin: 0 }} className="font-black tracking-tight uppercase text-[12px]">Strategy Feed</Title>
                  <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{unreadCount} UNRESOLVED PULSES</Text>
                </div>
              </Space>
              {unreadCount > 0 && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<IconCheck size={14} />} 
                  onClick={handleMarkAllAsRead}
                  className="text-emerald-600 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-50 rounded-lg px-3"
                >
                  Mark all
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
               {["ALL", "AI", "ORDER", "STOCK"].map((t) => (
                 <Button 
                   key={t}
                   type={filter === t ? 'primary' : 'text'}
                   size="small"
                   onClick={() => setFilter(t)}
                   className={`flex-1 text-[9px] font-black uppercase tracking-widest h-8 rounded-lg border-none shadow-none ${filter === t ? 'bg-white text-emerald-900! shadow-sm' : 'text-gray-400'}`}
                 >
                   {t}
                 </Button>
               ))}
            </div>
          </div>
        }
        placement="right"
        onClose={onClose}
        open={open}
        width={window.innerWidth < 640 ? '90%' : 460}
        styles={{ body: { padding: 0 } }}
        headerStyle={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}
      >
        {filteredNotifications.length === 0 ? (
          <Empty 
            description={<span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Neural Silence</span>} 
            className="mt-32 opacity-50" 
            image={<IconBrain size={48} className="mx-auto text-gray-200" />}
          />
        ) : (
          <List
            dataSource={filteredNotifications}
            className="p-4 space-y-4"
            renderItem={(item) => {
              const isExpanded = expandedIds.includes(item.id);
              const isLong = item.message.length > 90;

              return (
                <div 
                  key={item.id}
                  className={`p-6 cursor-pointer transition-all hover:bg-gray-50 border border-gray-100 rounded-[2.5rem] relative overflow-hidden group mb-4 ${item.read ? 'bg-white opacity-60' : 'bg-white shadow-xl shadow-gray-100/50'}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  {!item.read && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />}
                  
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getTypeTag(item.type)}
                        {!item.read && <Badge status="processing" color="#10b981" />}
                      </div>
                      <Text type="secondary" className="text-[9px] font-black uppercase tracking-widest opacity-40">
                        {dayjs(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt).fromNow()}
                      </Text>
                    </div>
                    
                    <Title level={5} className="m-0 font-black tracking-tight leading-tight text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </Title>
                    
                    <div className="relative">
                      <Text 
                        className={`text-xs text-gray-500 block leading-relaxed transition-all duration-300 ${!isExpanded && isLong ? 'line-clamp-2 max-h-12' : 'max-h-none'}`}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {item.message}
                      </Text>
                      
                      {isExpanded && item.metadata && (
                         <div className="mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-3 block opacity-60">Neural Deep Analysis</span>
                            <div className="grid grid-cols-2 gap-4">
                               {item.metadata.sku && (
                                  <div className="flex flex-col">
                                     <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">SKU Trace</span>
                                     <span className="text-[10px] font-black text-gray-700 font-mono">{item.metadata.sku}</span>
                                  </div>
                               )}
                               {item.metadata.daysRemaining !== undefined && (
                                  <div className="flex flex-col">
                                     <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Est. Depletion</span>
                                     <span className="text-[10px] font-black text-red-600 italic">{item.metadata.daysRemaining} Days</span>
                                  </div>
                               )}
                               {item.metadata.revenueRisk && (
                                  <div className="flex flex-col">
                                     <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Value at Risk</span>
                                     <span className="text-[10px] font-black text-emerald-950">Rs. {Number(item.metadata.revenueRisk).toLocaleString()}</span>
                                  </div>
                               )}
                               {item.metadata.riskLevel && (
                                  <div className="flex flex-col">
                                     <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Confidence</span>
                                     <span className="text-[10px] font-black text-emerald-600">HIGH (Neural Matrix)</span>
                                  </div>
                               )}
                            </div>
                            <Button 
                              type="link" 
                              size="small" 
                              onClick={(e) => { e.stopPropagation(); navigate("/inventory/purchase-orders"); onClose(); }}
                              className="p-0 h-auto text-[9px] font-black uppercase mt-4 text-emerald-600 hover:text-emerald-700 tracking-widest flex items-center gap-1"
                            >
                               Initiate Strategic Reorder <IconExternalLink size={10} />
                            </Button>
                         </div>
                      )}

                      {isLong && !isExpanded && (
                        <Button 
                          type="link" 
                          size="small" 
                          className="p-0 h-auto text-[10px] font-black uppercase mt-3 text-emerald-600 hover:text-emerald-700 tracking-widest flex items-center gap-1"
                          onClick={(e) => toggleExpand(e, item.id)}
                        >
                          Deep Analysis
                        </Button>
                      )}

                      {isExpanded && (
                         <Button 
                           type="link" 
                           size="small" 
                           className="p-0 h-auto text-[10px] font-black uppercase mt-3 text-gray-400 hover:text-gray-600 tracking-widest flex items-center gap-1"
                           onClick={(e) => toggleExpand(e, item.id)}
                         >
                           Show Less
                         </Button>
                      )}
                    </div>
                    
                    <div className="mt-2 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<IconExternalLink size={14} />}
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(item); }}
                          className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl text-[9px] font-black uppercase tracking-widest h-9 px-4 shadow-lg shadow-emerald-100"
                        >
                          {item.type === 'AI' ? 'Execute Intelligence' : 'View Pulse'}
                        </Button>
                       {item.type === 'STOCK' && (
                          <Button 
                            type="text" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); navigate("/inventory/purchase-orders"); onClose(); }}
                            className="text-orange-600 font-black text-[9px] uppercase tracking-widest"
                          >
                            New Reorder
                          </Button>
                       )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </Drawer>
    );
}

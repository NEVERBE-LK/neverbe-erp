import { useEffect, useState } from "react";
import { Drawer, List, Badge, Button, Space, Typography, Tag, Empty, Tooltip } from "antd";
import { IconBell, IconCheck, IconExternalLink, IconTrash } from "@tabler/icons-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { dayjs, parseToDayjs } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import toast from "react-hot-toast";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: Props) {
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();

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

  const getTypeTag = (type: string, meta?: any) => {
    switch (type) {
      case "ORDER": {
        const isCod =
          (meta?.paymentMethod || "").toLowerCase().includes("cod") ||
          (meta?.paymentMethodId || "") === "PM-001" ||
          (meta?.paymentMethod || "").toLowerCase().includes("cash on delivery");
        return (
          <Space size={4}>
            <Tag bordered={false} className="m-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">Order</Tag>
            {isCod ? (
              <Tag bordered={false} className="m-0 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">COD</Tag>
            ) : (
              <Tag bordered={false} className="m-0 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">Paid</Tag>
            )}
          </Space>
        );
      }
      case "STOCK": return <Tag bordered={false} className="m-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">Inventory</Tag>;
      case "SYSTEM": return <Tag bordered={false} className="m-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 font-mono">System</Tag>;
      default: return <Tag bordered={false} className="m-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 font-mono">System</Tag>;
    }
  };

    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [filter, setFilter] = useState<string>("ALL");
  
    const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setExpandedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };

    const filteredNotifications = notifications.filter((n) => {
      if (filter === "ALL") return true;
      return n.type === filter;
    });

    return (
      <Drawer
        title={
          <div className="flex flex-col gap-4 w-full py-2">
            <div className="flex items-center justify-between">
              <Space size="middle">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
                   <IconBell size={18} />
                </div>
                <div className="flex flex-col">
                   <Title level={5} style={{ margin: 0 }} className="font-extrabold tracking-tight uppercase text-xs text-zinc-900 dark:text-white">Notifications</Title>
                   <Text className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">{unreadCount} UNREAD UPDATES</Text>
                </div>
              </Space>
              {unreadCount > 0 && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<IconCheck size={14} />} 
                  onClick={handleMarkAllAsRead}
                  className="text-zinc-900 dark:text-zinc-100 font-bold text-[9px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg px-2.5 font-mono"
                >
                  Mark all
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
               {["ALL", "ORDER", "STOCK", "SYSTEM"].map((t) => (
                 <Button 
                   key={t}
                   type="text"
                   size="small"
                   onClick={() => setFilter(t)}
                   className={`flex-1 text-[9px] font-bold uppercase tracking-widest h-8 rounded-lg border-none transition-all font-mono ${filter === t ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
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
      >
        {filteredNotifications.length === 0 ? (
          <Empty 
            description={<span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">No Notifications</span>} 
            className="mt-32 opacity-50" 
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
                  className={`p-4 sm:p-5 cursor-pointer transition-all hover:border-zinc-400 dark:hover:border-zinc-600 border border-zinc-200 dark:border-zinc-800 rounded-2xl relative overflow-hidden group mb-3 ${item.read ? 'bg-white/60 dark:bg-[#141414]/60 opacity-60' : 'bg-white dark:bg-[#141414] shadow-xs'}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  {!item.read && <div className="absolute top-0 left-0 w-1 h-full bg-black dark:bg-white" />}
                  
                  <div className="flex flex-col gap-2.5 w-full">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getTypeTag(item.type, item.metadata)}
                        {!item.read && <Badge status="processing" color="#10b981" />}
                      </div>
                      <Text type="secondary" className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                        {parseToDayjs(item.createdAt)?.fromNow() || "recently"}
                      </Text>
                    </div>
                    
                    <Title level={5} className="m-0 font-extrabold tracking-tight leading-tight text-zinc-900 dark:text-white transition-colors">
                      {item.title}
                    </Title>
                    
                    <div className="relative">
                      <Text 
                        className={`text-xs text-zinc-500 dark:text-zinc-400 block leading-relaxed transition-all duration-300 ${!isExpanded && isLong ? 'line-clamp-2 max-h-12' : 'max-h-none'}`}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {item.message}
                      </Text>
                      
                      {isExpanded && item.metadata && (
                         <div className="mt-3 p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5 block font-mono">Technical Details</span>
                            <div className="grid grid-cols-2 gap-3">
                               {item.metadata.orderId && (
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Order ID</span>
                                     <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 font-mono">#{item.metadata.orderId}</span>
                                  </div>
                               )}
                               {item.metadata.customerName && (
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Customer</span>
                                     <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{item.metadata.customerName}</span>
                                  </div>
                               )}
                               {item.metadata.paymentMethod && (
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Payment</span>
                                     <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{item.metadata.paymentMethod} {item.metadata.paymentStatus ? `(${item.metadata.paymentStatus})` : ""}</span>
                                  </div>
                               )}
                               {item.metadata.total !== undefined && (
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Total</span>
                                     <span className="text-[11px] font-bold text-zinc-900 dark:text-white font-mono">Rs. {Number(item.metadata.total).toLocaleString()}</span>
                                  </div>
                               )}
                               {item.metadata.sku && (
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest font-mono">SKU Trace</span>
                                     <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 font-mono">{item.metadata.sku}</span>
                                  </div>
                               )}
                               {item.metadata.daysRemaining !== undefined && (
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Est. Depletion</span>
                                     <span className="text-[11px] font-bold text-red-500 font-mono">{item.metadata.daysRemaining} Days</span>
                                  </div>
                               )}
                               {item.metadata.revenueRisk && (
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Value at Risk</span>
                                     <span className="text-[11px] font-bold text-zinc-900 dark:text-white font-mono">Rs. {Number(item.metadata.revenueRisk).toLocaleString()}</span>
                                  </div>
                                )}
                            </div>
                         </div>
                      )}

                      {isLong && !isExpanded && (
                        <Button 
                          type="link" 
                          size="small" 
                          className="p-0 h-auto text-[10px] font-bold uppercase mt-2.5 text-zinc-900 dark:text-zinc-100 hover:text-black dark:hover:text-white tracking-widest flex items-center gap-1 font-mono"
                          onClick={(e) => toggleExpand(e, item.id)}
                        >
                          View Details
                        </Button>
                      )}

                      {isExpanded && (
                         <Button 
                           type="link" 
                           size="small" 
                           className="p-0 h-auto text-[10px] font-bold uppercase mt-2.5 text-zinc-400 hover:text-zinc-600 tracking-widest flex items-center gap-1 font-mono"
                           onClick={(e) => toggleExpand(e, item.id)}
                         >
                           Show Less
                         </Button>
                      )}
                    </div>
                    
                    <div className="mt-1 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<IconExternalLink size={14} />}
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(item); }}
                          className="bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 border-none rounded-xl text-[9px] font-bold uppercase tracking-wider h-8 px-3.5"
                        >
                          View Details
                        </Button>
                       {item.type === 'STOCK' && (
                          <Button 
                            type="text" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); navigate("/inventory/purchase-orders"); onClose(); }}
                            className="text-amber-500 font-bold text-[9px] uppercase tracking-wider font-mono"
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

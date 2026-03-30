import { useEffect, useState } from "react";
import { Drawer, List, Badge, Button, Space, Typography, Tag, Empty, Tooltip } from "antd";
import { IconBell, IconCheck, IconExternalLink, IconTrash } from "@tabler/icons-react";
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
      case "ORDER": return <Tag color="blue">Order</Tag>;
      case "STOCK": return <Tag color="orange">Inventory</Tag>;
      case "AI": return <Tag color="purple">AI Engine</Tag>;
      default: return <Tag color="gray">System</Tag>;
    }
  };

    const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
    const toggleExpand = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setExpandedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };

    return (
      <Drawer
        title={
          <div className="flex items-center justify-between w-full">
            <Space>
              <IconBell size={20} />
              <Title level={5} style={{ margin: 0 }}>Notifications</Title>
            </Space>
            {unreadCount > 0 && (
              <Button 
                type="link" 
                size="small" 
                icon={<IconCheck size={14} />} 
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        }
        placement="right"
        onClose={onClose}
        open={open}
        width={400}
      >
        {notifications.length === 0 ? (
          <Empty description="No notifications found" className="mt-20" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => {
              const isExpanded = expandedIds.includes(item.id);
              const isLong = item.message.length > 90;

              return (
                <List.Item
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 border-l-4 ${item.read ? 'border-transparent' : 'border-emerald-500 bg-emerald-50/10'}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-start">
                      {getTypeTag(item.type)}
                      <Text type="secondary" className="text-[10px]">
                        {dayjs(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt).fromNow()}
                      </Text>
                    </div>
                    <Text strong className="text-sm">{item.title}</Text>
                    
                    <div className="relative">
                      <Text 
                        className={`text-xs text-gray-500 block transition-all ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}
                      >
                        {item.message}
                      </Text>
                      {isLong && (
                        <Button 
                          type="link" 
                          size="small" 
                          className="p-0 h-auto text-[10px] font-bold uppercase mt-1 text-emerald-600"
                          onClick={(e) => toggleExpand(e, item.id)}
                        >
                          {isExpanded ? "Show Less" : "Show More"}
                        </Button>
                      )}
                    </div>
                    
                    {item.metadata?.orderId && (
                      <div className="mt-2 flex items-center text-blue-600 font-bold text-[10px] uppercase">
                        <IconExternalLink size={12} className="mr-1" /> View Order
                      </div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    );
  }

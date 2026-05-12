import React from "react";
import { Coupon } from "@/model/Coupon";
import { Table, Button, Tag, Space, Typography, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { dayjs } from "@/utils/dateUtils";

const { Text } = Typography;

interface Props {
  items: Coupon[];
  loading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete?: (coupon: Coupon) => void;
  pagination?: any;
  onChange?: (pagination: any) => void;
}

const CouponListTable: React.FC<Props> = ({
  items,
  loading,
  onEdit,
  onDelete,
  pagination,
  onChange,
}) => {
  const columns = [
    {
      title: "Coupon Code",
      dataIndex: "code",
      key: "code",
      render: (code: string, record: Coupon) => (
        <div className="flex flex-col">
          <Text strong copyable className="text-lg font-mono">
            {code}
          </Text>
          <Text type="secondary" className="text-xs">
            {record.name}
          </Text>
        </div>
      ),
    },
    {
      title: "Value",
      key: "value",
      render: (_: any, record: Coupon) => {
        if (record.discountType === "PERCENTAGE") {
          return (
            <Tag color="blue" className="font-bold text-base">
              {record.discountValue}% OFF
            </Tag>
          );
        }
        if (record.discountType === "FIXED") {
          return (
            <Tag color="green" className="font-bold text-base">
              Rs. {record.discountValue}
            </Tag>
          );
        }
        if (record.discountType === "FREE_SHIPPING") {
          return <Tag color="cyan">FREE SHIPPING</Tag>;
        }
        return "-";
      },
    },
    {
      title: "Valid Until",
      dataIndex: "endDate",
      key: "endDate",
      render: (date: any) => {
        return <Text strong>{date || "-"}</Text>;
      },
    },
    {
      title: "Usage",
      key: "usage",
      render: (_: any, record: Coupon) => (
        <Tag bordered={false}>
          {record.usageCount} /{" "}
          {record.usageLimit && record.usageLimit > 0 ? record.usageLimit : "∞"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: Coupon) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {onDelete && (
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      scroll={{ x: "max-content" }}
      columns={columns}
      dataSource={items}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onChange={onChange}
      className="bg-white rounded-lg border border-gray-100 p-2 shadow-sm mt-4 hover:shadow-md transition-shadow duration-300"
      bordered={false}
    />
  );
};

export default CouponListTable;

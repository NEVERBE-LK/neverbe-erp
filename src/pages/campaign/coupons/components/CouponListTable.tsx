import React from "react";
import { Coupon } from "@/model/Coupon";
import { Table, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react";
import { formatSLDate } from "@/utils/dateUtils";

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
        <div className="flex flex-col font-mono">
          <span className="font-bold text-xs text-text-main dark:text-text-main-dark">
            {code}
          </span>
          <span className="text-xs text-text-sub font-sans">
            {record.name}
          </span>
        </div>
      ),
    },
    {
      title: "Value",
      key: "value",
      render: (_: any, record: Coupon) => {
        let label = "-";
        if (record.discountType === "PERCENTAGE") label = `${record.discountValue}% OFF`;
        else if (record.discountType === "FIXED") label = `Rs ${record.discountValue}`;
        else if (record.discountType === "FREE_SHIPPING") label = "FREE SHIPPING";

        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
            {label}
          </span>
        );
      },
    },
    {
      title: "Valid Until",
      dataIndex: "endDate",
      key: "endDate",
      render: (date: any) => (
        <span className="font-mono text-xs text-text-sub dark:text-slate-400">
          {formatSLDate(date) || "—"}
        </span>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_: any, record: Coupon) => (
        <span className="font-mono text-xs text-text-sub dark:text-slate-400">
          {record.usageCount} / {record.usageLimit && record.usageLimit > 0 ? record.usageLimit : "∞"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono ${
            isActive
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-card-border dark:border-card-border-dark"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: any, record: Coupon) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Coupon",
            onClick: () => onEdit(record),
          },
          ...(onDelete
            ? [
                {
                  type: "divider" as const,
                },
                {
                  key: "delete",
                  icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
                  label: (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      Delete Coupon
                    </span>
                  ),
                  onClick: () => onDelete(record),
                },
              ]
            : []),
        ];

        return (
          <div className="flex justify-end">
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
              >
                <IconDotsVertical size={16} />
              </button>
            </Dropdown>
          </div>
        );
      },
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
    />
  );
};

export default CouponListTable;

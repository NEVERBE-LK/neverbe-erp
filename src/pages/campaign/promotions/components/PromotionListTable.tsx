import React from "react";
import { Promotion } from "@/model/Promotion";
import { Table, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react";
import { formatSLDate } from "@/utils/dateUtils";

interface Props {
  items: Promotion[];
  loading: boolean;
  pagination: any;
  onChange: (pagination: any) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete?: (promotion: Promotion) => void;
}

const PromotionListTable: React.FC<Props> = ({
  items,
  loading,
  pagination,
  onChange,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: "Campaign Info",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">
          {text}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-card-border dark:border-card-border-dark font-mono">
          {type?.replace("_", " ")}
        </span>
      ),
    },
    {
      title: "Timeline",
      key: "timeline",
      render: (_: any, record: Promotion) => (
        <div className="flex flex-col text-xs font-mono text-text-sub dark:text-slate-400">
          <span>Start: {formatSLDate(record.startDate) || "—"}</span>
          <span>End: {formatSLDate(record.endDate) || "—"}</span>
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      align: "center" as const,
      render: (priority: number) => (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-mono">
          P-{priority}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      align: "center" as const,
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
      render: (_: any, record: Promotion) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Promotion",
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
                      Delete Promotion
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
      pagination={{ ...pagination, position: ["bottomRight"] }}
      onChange={onChange}
    />
  );
};

export default PromotionListTable;

import React from "react";
import { ComboProduct } from "@/model/ComboProduct";
import { Table, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { IconEdit, IconTrash, IconDotsVertical, IconPhoto } from "@tabler/icons-react";

interface Props {
  items: ComboProduct[];
  loading: boolean;
  onEdit: (combo: ComboProduct) => void;
  onDelete?: (combo: ComboProduct) => void;
}

const ComboListTable: React.FC<Props> = ({
  items,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: "Asset",
      key: "asset",
      width: 70,
      render: (_: any, record: ComboProduct) => (
        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-card-border dark:border-card-border-dark rounded-xl flex items-center justify-center overflow-hidden">
          {record.thumbnail?.url ? (
            <img
              src={record.thumbnail.url}
              alt={record.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <IconPhoto className="text-text-sub text-lg" size={18} />
          )}
        </div>
      ),
    },
    {
      title: "Bundle Info",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ComboProduct) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">
            {text}
          </span>
          <span className="text-xs text-text-sub dark:text-slate-400 truncate max-w-[200px]">
            {record.description || "No description"}
          </span>
        </div>
      ),
    },
    {
      title: "Details",
      key: "details",
      render: (_: any, record: ComboProduct) => (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center w-max px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-card-border dark:border-card-border-dark font-mono">
            {record.type}
          </span>
          <span className="text-xs text-text-sub dark:text-slate-400 font-mono">
            {record.items?.length || 0} Items
          </span>
        </div>
      ),
    },
    {
      title: "Pricing",
      key: "pricing",
      align: "right" as const,
      render: (_: any, record: ComboProduct) => (
        <div className="flex flex-col items-end font-mono">
          <span className="font-bold text-xs text-text-main dark:text-text-main-dark">
            Rs {record.comboPrice.toLocaleString()}
          </span>
          {record.originalPrice > record.comboPrice && (
            <span className="line-through text-[10px] text-text-sub dark:text-slate-500">
              Rs {record.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
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
      render: (_: any, record: ComboProduct) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Combo",
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
                      Delete Combo
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
      pagination={false}
    />
  );
};

export default ComboListTable;

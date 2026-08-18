import React from "react";
import { ProductVariant } from "@/model/ProductVariant";
import { Table, Empty } from "antd";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { ColumnsType } from "antd/es/table";

interface VariantListProps {
  variants: ProductVariant[];
  onAddVariant: () => void;
  onEditVariant: (index: number) => void;
  onDeleteVariant: (index: number) => void;
}

const VariantList: React.FC<VariantListProps> = ({
  variants,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}) => {
  const columns: ColumnsType<ProductVariant> = [
    {
      title: "Variant Name",
      dataIndex: "variantName",
      key: "variantName",
      render: (text) => (
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {text}
        </span>
      ),
    },
    {
      title: "Sizes",
      dataIndex: "sizes",
      key: "sizes",
      render: (sizes: string[]) => (
        <div className="flex flex-wrap gap-1">
          {sizes && sizes.length > 0 ? (
            sizes.map((size) => (
              <span
                key={size}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-md text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300"
              >
                {size}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-xs italic">No sizes</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 100,
      render: (status: boolean) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          status
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          {status ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 90,
      render: (_, __, index) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEditVariant(index)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <IconEdit size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDeleteVariant(index)}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <IconTrash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider m-0 font-mono">
          Product Variants
        </h4>
        <button
          type="button"
          onClick={onAddVariant}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <IconPlus size={14} />
          Add Variant
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <Table
          scroll={{ x: 'max-content' }}
          dataSource={variants}
          columns={columns}
          rowKey={(record) => record.variantId || Math.random().toString()}
          pagination={false}
          size="small"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className="text-slate-400 text-xs">No variants added yet</span>}
              />
            ),
          }}
          className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3"
        />
      </div>
    </div>
  );
};

export default VariantList;

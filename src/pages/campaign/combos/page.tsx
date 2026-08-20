import { Button } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import { ComboProduct } from "@/model/ComboProduct";
import ComboListTable from "./components/ComboListTable";
import ComboFormModal from "./components/ComboFormModal";
import toast from "react-hot-toast";
import PageContainer from "../../components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const CombosPage = () => {
  const [combos, setCombos] = useState<ComboProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0 });
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComboProduct | null>(null);
  const { showConfirmation } = useConfirmationDialog();

  const fetchCombos = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/erp/master/combos", {
        params: { page: pagination.page, size: pagination.size },
      });

      setCombos(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e: any) {
      console.error("Failed to fetch combos", e);
      toast.error("Failed to fetch combos");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.size]);

  useEffect(() => {
    if (!currentUser) return;
    fetchCombos();
  }, [currentUser, fetchCombos]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ComboProduct) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (item: ComboProduct) => {
    handleCloseModal();
    setCombos((prev) => {
      const index = prev.findIndex((p) => p.id === item.id);
      if (index > -1) {
        const newArr = [...prev];
        newArr[index] = item;
        return newArr;
      } else {
        return [item, ...prev];
      }
    });
    if (!editingItem) {
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleDelete = async (item: ComboProduct) => {
    showConfirmation({
      title: "Delete Combo?",
      message: `Are you sure you want to delete combo "${item.name}"?`,
      variant: "danger",
      confirmText: "Delete",
      onSuccess: async () => {
        try {
          const result = await api.delete(`/api/v1/erp/master/combos/${item.id}`);
          toast.success("Combo deleted");
          setCombos((prev) => prev.filter((p) => p.id !== result.data.id));
          setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        } catch (e) {
          console.error("Delete failed", e);
          toast.error("Failed to delete");
        }
      },
    });
  };

  return (
    <PageContainer title="Combo Products">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Campaign Management
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Combo Products
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {pagination.total} Total
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={handleOpenCreateModal}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            New Combo
          </Button>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <ComboListTable
              items={combos}
              loading={loading}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination */}
          <div className="flex justify-end p-4 border-t border-card-border dark:border-card-border-dark font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1 || loading}
                className="p-2 border border-card-border dark:border-card-border-dark rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <IconChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-text-sub px-3">
                Page {pagination.page}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={loading || combos.length < pagination.size}
                className="p-2 border border-card-border dark:border-card-border-dark rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <IconChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ComboFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        combo={editingItem}
      />
    </PageContainer>
  );
};

export default CombosPage;

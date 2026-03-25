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
import ComboFormModal from "./components/ComboFormModal"; // Will create next
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
    <PageContainer
      title="Combo Products"
      description="Manage product bundles and deals"
    >
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Campaign Management
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Combo Products
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={handleOpenCreateModal}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            New Combo
          </Button>
        </div>

        <div className="bg-transparent space-y-6">
          <ComboListTable
            items={combos}
            loading={loading}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          <div className="flex justify-end mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1 || loading}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <IconChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-gray-700 px-4">
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
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <IconChevronRight size={18} />
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

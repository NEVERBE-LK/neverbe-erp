import { Button, Form, Card, Input, Select, Space } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import { IconPlus, IconX, IconFilter, IconSearch } from "@tabler/icons-react";
import { Promotion } from "@/model/Promotion";
import PromotionListTable from "./components/PromotionListTable";
import PromotionFormModal from "./components/PromotionFormModal"; // Will create next
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import NeuralPromoAdvisor from "./components/NeuralPromoAdvisor";
import dayjs from "dayjs";


const PromotionsPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [form] = Form.useForm();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Promotion | null>(null);
  const { showConfirmation } = useConfirmationDialog();

  const fetchPromotions = React.useCallback(
    async (filters: any = {}) => {
      setLoading(true);
      try {
        const params: any = {
          page: pagination.current,
          size: pagination.pageSize,
          ...filters,
        };

        const response = await api.get("/api/v1/erp/master/promotions", {
          params,
        });

        setPromotions(response.data.dataList || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.rowCount || 0,
        }));
      } catch (e: any) {
        console.error("Failed to fetch promotions", e);
        toast.error("Failed to fetch promotions");
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize],
  );

  useEffect(() => {
    if (!currentUser) return;
    fetchPromotions(form.getFieldsValue());
  }, [currentUser, pagination.current, pagination.pageSize, fetchPromotions]);

  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchPromotions(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Promotion) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (item: Promotion) => {
    handleCloseModal();
    setPromotions((prev) => {
      const index = prev.findIndex((p) => p.id === item.id);
      if (index > -1) {
        const newArr = [...prev];
        newArr[index] = item;
        return newArr;
      } else {
        return [item, ...prev];
      }
    });
    // Optional: We can still fetch in background or just update total
    if (!editingItem) {
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleDelete = async (item: Promotion) => {
    showConfirmation({
      title: "Delete Promotion?",
      message: `Are you sure you want to delete "${item.name}"?`,
      variant: "danger",
      confirmText: "Delete",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/master/promotions/${item.id}`);
          toast.success("Promotion deleted");
          setPromotions((prev) => prev.filter((p) => p.id !== item.id));
          setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        } catch (e) {
          console.error("Delete failed", e);
          toast.error("Failed to delete");
        }
      },
    });
  };
  
  const handleApplyStrategy = (suggestion: any) => {
    const draft: any = {
      name: `AI RECO: ${suggestion.name} Liquidity Boost`,
      description: `Neural strategy to optimize liquidity for ${suggestion.name} by clearing stagnant stock.`,
      type: "PERCENTAGE",
      isActive: true,
      startDate: dayjs(),
      endDate: dayjs().add(7, "day"),
      conditions: [
        {
          type: "SPECIFIC_PRODUCT",
          value: suggestion.productId,
        },
      ],
      actions: [
        {
          type: "PERCENTAGE_OFF",
          value: suggestion.recommendedDiscount,
        },
      ],
      stackable: false,
      priority: 5,
    };
    setEditingItem(draft);
    setIsModalOpen(true);
  };


  return (
    <PageContainer
      title="Promotions"
      description="Master Data Sales & Discounts"
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
                Promotions
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
            New Promotion
          </Button>
        </div>

        {/* 🧠 Neural Strategy Hub */}
        <div className="mb-12">
           <NeuralPromoAdvisor onApply={handleApplyStrategy} />
        </div>

        <div className="bg-transparent space-y-4 pt-4 border-t border-gray-100">
          {/* Filter bar */}
          <Card size="small" className="shadow-sm mb-4!">
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterSubmit}
              initialValues={{
                status: "all",
                type: "all",
              }}
              className="flex flex-wrap gap-2 w-full"
            >
              <Form.Item name="search" className="mb-0! flex-1 min-w-[160px]">
                <Input
                  prefix={<IconSearch size={15} className="text-gray-400" />}
                  placeholder="Search promotions..."
                  allowClear
                />
              </Form.Item>
              <Form.Item name="type" className="mb-0! w-40">
                <Select>
                  <Select.Option value="all">All Types</Select.Option>
                  <Select.Option value="BOGO">BOGO</Select.Option>
                  <Select.Option value="FIXED">Fixed</Select.Option>
                  <Select.Option value="PERCENTAGE">Percentage</Select.Option>
                  <Select.Option value="FREE_SHIPPING">
                    Free Shipping
                  </Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" className="mb-0! w-32">
                <Select>
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="true">Active</Select.Option>
                  <Select.Option value="false">Inactive</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item className="mb-0!">
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<IconFilter size={15} />}
                  >
                    Filter
                  </Button>
                  <Button
                    icon={<IconX size={15} />}
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          <PromotionListTable
            items={promotions}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <PromotionFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        promotion={editingItem}
      />
    </PageContainer>
  );
};

export default PromotionsPage;

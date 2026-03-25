import { Button, Form, Card, Input, Select, Space } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import { IconPlus, IconX, IconFilter, IconSearch } from "@tabler/icons-react";
import { Coupon } from "@/model/Coupon";
import CouponListTable from "./components/CouponListTable";
import CouponFormModal from "./components/CouponFormModal"; // Will create next
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [form] = Form.useForm();
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);
  const { showConfirmation } = useConfirmationDialog();

  const fetchCoupons = React.useCallback(
    async (filters: any = {}) => {
      setLoading(true);
      try {
        const params: any = {
          page: pagination.current,
          size: pagination.pageSize,
          ...filters,
        };

        const response = await api.get("/api/v1/erp/master/coupons", {
          params,
        });

        setCoupons(response.data.dataList || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.rowCount || 0,
        }));
      } catch (e: any) {
        console.error("Failed to fetch coupons", e);
        toast.error("Failed to fetch coupons");
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize],
  );

  useEffect(() => {
    if (!currentUser) return;
    fetchCoupons(form.getFieldsValue());
  }, [currentUser, pagination.current, pagination.pageSize, fetchCoupons]);

  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchCoupons(values);
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

  const handleOpenEditModal = (item: Coupon) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (item: Coupon) => {
    handleCloseModal();
    setCoupons((prev) => {
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

  const handleDelete = async (item: Coupon) => {
    showConfirmation({
      title: "Delete Coupon?",
      message: `Are you sure you want to delete coupon "${item.code}"?`,
      variant: "danger",
      confirmText: "Delete",
      onSuccess: async () => {
        try {
          const result = await api.delete(`/api/v1/erp/master/coupons/${item.id}`);
          toast.success("Coupon deleted");
          setCoupons((prev) => prev.filter((p) => p.id !== result.data.id));
          setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        } catch (e) {
          console.error("Delete failed", e);
          toast.error("Failed to delete");
        }
      },
    });
  };

  return (
    <PageContainer title="Coupons" description="Manage discount codes">
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
                Coupons
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
            New Coupon
          </Button>
        </div>

        <div className="bg-transparent space-y-4">
          <Card size="small" className="shadow-sm mb-4!">
            <Form
              form={form}
              layout="inline"
              onFinish={handleFilterSubmit}
              initialValues={{
                status: "all",
              }}
              className="flex flex-wrap gap-2 w-full"
            >
              <Form.Item name="search" className="mb-0! flex-1 min-w-[160px]">
                <Input
                  prefix={<IconSearch size={15} className="text-gray-400" />}
                  placeholder="Search coupons..."
                  allowClear
                />
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

          <CouponListTable
            items={coupons}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <CouponFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        coupon={editingItem}
      />
    </PageContainer>
  );
};

export default CouponsPage;

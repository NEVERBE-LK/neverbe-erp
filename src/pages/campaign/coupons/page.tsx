import { Button, Form, Input, Select } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import { IconPlus, IconX, IconFilter, IconSearch } from "@tabler/icons-react";
import { Coupon } from "@/model/Coupon";
import CouponListTable from "./components/CouponListTable";
import CouponFormModal from "./components/CouponFormModal";
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
    <PageContainer title="Coupons">
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
                  Coupons
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
            New Coupon
          </Button>
        </div>

        {/* Filter Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{
              status: "all",
            }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-text-sub" />}
                placeholder="Search coupons..."
                allowClear
                className="rounded-xl h-10"
              />
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-32">
              <Select className="h-10">
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="true">Active</Select.Option>
                <Select.Option value="false">Inactive</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item className="!mb-0">
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                  className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={15} />}
                  onClick={handleClearFilters}
                  className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-medium cursor-pointer"
                >
                  Clear
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
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

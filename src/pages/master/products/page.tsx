import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconFilter,
  IconEdit,
  IconTrash,
  IconEye,
  IconCopy,
  IconDotsVertical,
} from "@tabler/icons-react";
import { Product } from "@/model/Product";
import ProductFormModal from "./components/ProductFormModal";
import api from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import { useSettings } from "@/contexts/SettingsContext";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  Table,
  Button,
  Input,
  Select,
  Badge,
  Form,
  Switch,
  Dropdown,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import Spinner from "@/pages/components/shared/Spinner";

export interface DropdownOption {
  id: string;
  label: string;
}

const { Option } = Select;

const ProductPage = () => {
  const { formatCurrency, isLowStock } = useSettings();
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );
  const { showConfirmation } = useConfirmationDialog();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<DropdownOption[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [sizes, setSizes] = useState<DropdownOption[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchProducts();
      fetchDropdown("/api/v1/erp/master/brands/dropdown", setBrands);
      fetchDropdown("/api/v1/erp/master/categories/dropdown", setCategories);
      fetchDropdown("/api/v1/erp/master/sizes/dropdown", setSizes);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (currentUser) fetchProducts();
  }, [pagination.current, pagination.pageSize]);

  const fetchProducts = async (values?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const filters = values || form.getFieldsValue();
      const params: Record<string, unknown> = {
        page: pagination.current,
        size: pagination.pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.brand && filters.brand !== "all")
        params.brand = filters.brand;
      if (filters.category && filters.category !== "all")
        params.category = filters.category;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.listing && filters.listing !== "all")
        params.listing = filters.listing;

      const response = await api.get("/api/v1/erp/master/products", {
        params,
      });
      setProducts(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e) {
      console.error("Failed to fetch products", e);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdown = async (
    url: string,
    setData: (data: DropdownOption[]) => void,
  ) => {
    try {
      const response = await api.get(url);
      setData(response.data || []);
    } catch (e) {
      console.error("Failed to fetch dropdown data", e);
    }
  };

  // --- Handlers ---
  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchProducts(values);
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

  // --- CRUD ---
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (productData: Product, file: File | null) => {
    setIsSaving(true);
    const isEditing = !!productData.productId;
    const url = isEditing
      ? `/api/v1/erp/master/products/${productData.productId}`
      : "/api/v1/erp/master/products";

    try {
      const formData = new FormData();
      if (file) formData.append("thumbnail", file);

      // Send the entire product data object as a JSON string under the 'data' key.
      // This preserves types (numbers/booleans) and is parsed by the API.
      formData.append("data", JSON.stringify(productData));

      if (isEditing) {
        const res = await api.put(url, formData);
        const updated: Product = res.data || productData;
        setProducts((prev) =>
          prev.map((p) => (p.productId === updated.productId ? updated : p)),
        );
      } else {
        const res = await api.post(url, formData);
        const created: Product = res.data || productData;
        setProducts((prev) => [created, ...prev]);
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      }

      toast.success(isEditing ? "Product updated" : "Product created");
      handleCloseModal();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggle = async (productId: string, field: "status" | "listing", value: boolean) => {
    try {
      const response = await api.put(`/api/v1/erp/master/products/${productId}`, {
        [field]: value
      });
      const updated: Product = response.data;
      setProducts((prev) =>
        prev.map((p) => (p.productId === updated.productId ? updated : p)),
      );
      toast.success(`${field === "status" ? "Status" : "Listing"} updated`);
    } catch (e) {
      console.error("Failed to update status", e);
      toast.error("Failed to update settings");
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicated: Product = {
      ...product,
      productId: "",
      name: `${product.name} (Copy)`,
      variants: [],
    };
    setEditingProduct(duplicated);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (itemId: string) => {
    showConfirmation({
      title: "DELETE PRODUCT?",
      message: "This action cannot be undone. Confirm deletion?",
      variant: "danger",
      onSuccess: async () => {
        setLoading(true);
        try {
          await api.delete(`/api/v1/erp/master/products/${itemId}`);
          setProducts((prev) => prev.filter((p) => p.productId !== itemId));
          setPagination((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
          }));
          toast.success("Product deleted");
        } catch (error: unknown) {
          const err = error as Error;
          toast.error(err.message || "Error deleting product");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns: ColumnsType<Product> = [
    {
      title: "Product Details",
      key: "details",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.thumbnail ? (
            <img
              src={record.thumbnail.url}
              alt="thumb"
              className="w-10 h-10 object-cover rounded-lg border border-card-border dark:border-card-border-dark"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
          )}
          <div>
            <span className="text-sm font-semibold text-text-main dark:text-text-main-dark block">
              {record.name}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400">
                {record.brand}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400">
                {record.category}
              </span>
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "Pricing & Profitability",
      key: "price",
      align: "right" as const,
      render: (_, record) => {
        const costPrice = record.buyingPrice || 0;
        const hasDiscount = (record.discount || 0) > 0;
        const discountedPrice = hasDiscount
          ? Math.round(
              (record.sellingPrice * (100 - (record.discount || 0))) / 100 / 10,
            ) * 10
          : record.sellingPrice;

        const profit = discountedPrice - costPrice;
        const margin = discountedPrice > 0 ? Math.round((profit / discountedPrice) * 100) : 0;

        let marginColor = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
        if (margin >= 40) marginColor = "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
        else if (margin >= 20) marginColor = "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";

        return (
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-text-sub dark:text-slate-500 font-mono">
              Cost: <span className="font-semibold text-text-main dark:text-text-main-dark">{formatCurrency(costPrice)}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              {hasDiscount && (
                <span className="text-[10px] line-through text-text-sub dark:text-slate-600">
                  {formatCurrency(record.sellingPrice)}
                </span>
              )}
              <span className={`font-bold text-sm ${hasDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-text-main dark:text-text-main-dark"}`}>
                {formatCurrency(discountedPrice)}
              </span>
            </div>
            {discountedPrice > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                {hasDiscount && (
                  <span className="text-[9px] font-bold px-1 py-0 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-mono">
                    -{record.discount}%
                  </span>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${marginColor} font-mono`}>
                  {margin}% Margin
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Inventory Status",
      dataIndex: "totalStock",
      key: "quantity",
      align: "center" as const,
      render: (stock: number) => {
        const count = stock || 0;
        let statusText = "Out of Stock";
        let statusColor = "error";
        if (count === 0) {
          statusText = "Out of Stock";
          statusColor = "error";
        } else if (isLowStock(count)) {
          statusText = "Low Stock";
          statusColor = "warning";
        } else {
          statusText = "In Stock";
          statusColor = "success";
        }

        return (
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-sm text-text-main dark:text-text-main-dark">
              {count} Units
            </span>
            <Badge status={statusColor as any} text={<span className="text-xs font-semibold text-text-sub dark:text-slate-500 uppercase">{statusText}</span>} />
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, record) => (
        <Switch
          checked={status}
          onChange={(checked) => handleQuickToggle(record.productId!, "status", checked)}
          checkedChildren="ACTIVE"
          unCheckedChildren="INACTIVE"
          className="scale-90"
        />
      ),
    },
    {
      title: "Listing",
      dataIndex: "listing",
      key: "listing",
      render: (listing: boolean, record) => (
        <Switch
          checked={listing}
          onChange={(checked) => handleQuickToggle(record.productId!, "listing", checked)}
          checkedChildren="VISIBLE"
          unCheckedChildren="HIDDEN"
          className="scale-90"
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      align: "center" as const,
      render: (_, record) => {
        const items: MenuProps["items"] = [
          {
            key: "view",
            icon: <IconEye size={14} />,
            label: "View",
            onClick: () => navigate(`/master/products/${record.productId}/view`),
          },
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit",
            onClick: () => handleOpenEditModal(record),
          },
          {
            key: "duplicate",
            icon: <IconCopy size={14} />,
            label: "Duplicate",
            onClick: () => handleDuplicateProduct(record),
          },
          { type: "divider" },
          {
            key: "delete",
            icon: <IconTrash size={14} />,
            label: "Delete",
            danger: true,
            onClick: () => handleDeleteProduct(record.productId!),
          },
        ];
        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <button className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
              <IconDotsVertical size={16} />
            </button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PageContainer title="Products" description="Products Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Master Data Management
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Products
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {pagination.total} items
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer self-start md:self-auto"
          >
            <IconPlus size={16} />
            New Product
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{
              brand: "all",
              category: "all",
              status: "all",
              listing: "all",
            }}
            className="w-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              <Form.Item name="search" label="Search" className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-slate-400" />}
                  placeholder="Search products..."
                  allowClear
                  className="w-full rounded-xl"
                />
              </Form.Item>
              <Form.Item name="category" label="Category" className="!mb-0">
                <Select className="w-full rounded-xl">
                  <Option value="all">All Categories</Option>
                  {categories.map((c) => (
                    <Option key={c.id} value={c.label}>
                      {c.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="brand" label="Brand" className="!mb-0">
                <Select className="w-full rounded-xl">
                  <Option value="all">All Brands</Option>
                  {brands.map((b) => (
                    <Option key={b.id} value={b.label}>
                      {b.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Status" className="!mb-0">
                <Select className="w-full rounded-xl">
                  <Option value="all">All Status</Option>
                  <Option value="true">Active</Option>
                  <Option value="false">Inactive</Option>
                </Select>
              </Form.Item>
              <Form.Item name="listing" label="Listing" className="!mb-0">
                <Select className="w-full rounded-xl">
                  <Option value="all">All Listing</Option>
                  <Option value="true">Listed</Option>
                  <Option value="false">Unlisted</Option>
                </Select>
              </Form.Item>
              <Form.Item className="!mb-0">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <IconFilter size={14} />
                    Filter
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-all cursor-pointer"
                  >
                    <IconX size={14} />
                    Clear
                  </button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <Table
            scroll={{ x: 1000 }}
            columns={columns}
            dataSource={products}
            rowKey="productId"
            pagination={{ ...pagination, position: ["bottomRight"] }}
            loading={{ spinning: loading, indicator: <Spinner size="small" /> }}
            onChange={handleTableChange}
            size="small"
            className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
          />
        </div>
      </div>

      <ProductFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={editingProduct}
        brands={brands}
        categories={categories}
        sizes={sizes}
        saving={isSaving}
      />
    </PageContainer>
  );
};

export default ProductPage;

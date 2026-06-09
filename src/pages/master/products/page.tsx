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
  IconPackage,
  IconTrendingUp,
  IconDatabase,
  IconActivity,
  IconCopy,
} from "@tabler/icons-react";
import { Product } from "@/model/Product";
import ProductFormModal from "./components/ProductFormModal";
import api from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Badge,
  Space,
  Tooltip,
  Form,
  Card,
  Typography,
  Switch,
} from "antd";
import type { ColumnsType } from "antd/es/table";

export interface DropdownOption {
  id: string;
  label: string;
}

const { Option } = Select;

const ProductPage = () => {
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
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalStock: 0,
    avgMargin: 0,
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
      if (response.data.stats) {
        setStats(response.data.stats);
      }
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
        <Space>
          {record.thumbnail ? (
            <img
              src={record.thumbnail.url}
              alt="thumb"
              className="w-10 h-10 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
          )}
          <div>
            <Typography.Text strong className="block">
              {record.name}
            </Typography.Text>
            <Space size={4} className="mt-1">
              <Tag className="m-0 text-[10px] uppercase border-gray-200">
                {record.brand}
              </Tag>
              <Tag className="m-0 text-[10px] uppercase border-gray-200">
                {record.category}
              </Tag>
            </Space>
          </div>
        </Space>
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

        let marginColor = "red";
        if (margin >= 40) marginColor = "green";
        else if (margin >= 20) marginColor = "orange";

        return (
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-gray-500">
              Cost: <span className="font-semibold text-gray-700">LKR {costPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasDiscount && (
                <span className="text-[10px] line-through text-gray-400">
                  LKR {record.sellingPrice?.toLocaleString()}
                </span>
              )}
              <span className={`font-bold text-sm ${hasDiscount ? "text-green-600" : "text-gray-900"}`}>
                LKR {discountedPrice.toLocaleString()}
              </span>
            </div>
            {discountedPrice > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                {hasDiscount && (
                  <Tag color="green" className="m-0 text-[9px] font-black px-1 py-0 border-none leading-none">
                    -{record.discount}%
                  </Tag>
                )}
                <Tag color={marginColor} className="m-0 text-[10px] font-bold px-1.5 py-0.5 leading-none">
                  {margin}% Margin
                </Tag>
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
        if (count >= 5) {
          statusText = "In Stock";
          statusColor = "success";
        } else if (count > 0) {
          statusText = "Low Stock";
          statusColor = "warning";
        }

        return (
          <div className="flex flex-col items-center gap-1">
            <span className="font-black text-sm text-gray-800">
              {count} Units
            </span>
            <Badge status={statusColor as any} text={<span className="text-xs font-semibold text-gray-500 uppercase">{statusText}</span>} />
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
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              size="small"
              icon={<IconEye size={16} />}
              onClick={() =>
                navigate(`/master/products/${record.productId}/view`)
              }
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<IconEdit size={16} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              size="small"
              icon={<IconCopy size={16} />}
              onClick={() => handleDuplicateProduct(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<IconTrash size={16} />}
              onClick={() => handleDeleteProduct(record.productId!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Products" description="Products Management">
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Master Data Management
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Products
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={handleOpenCreateModal}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2 self-start md:self-auto"
          >
            New Product
          </Button>
        </div>
        
        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
          <Card size="small" className="shadow-sm hover:shadow-md transition-shadow border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Products</div>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats.totalProducts}</div>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <IconDatabase size={20} />
              </div>
            </div>
          </Card>
          <Card size="small" className="shadow-sm hover:shadow-md transition-shadow border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Active Listing</div>
                <div className="text-2xl font-black text-green-600 mt-1">
                  {stats.activeProducts} <span className="text-xs font-normal text-gray-400">/ {stats.totalProducts}</span>
                </div>
              </div>
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                <IconActivity size={20} />
              </div>
            </div>
          </Card>
          <Card size="small" className="shadow-sm hover:shadow-md transition-shadow border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Catalog Stock</div>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats.totalStock} <span className="text-xs font-normal text-gray-400">Units</span></div>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <IconPackage size={20} />
              </div>
            </div>
          </Card>
          <Card size="small" className="shadow-sm hover:shadow-md transition-shadow border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Average Margin</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {stats.avgMargin}%
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <IconTrendingUp size={20} />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter bar */}
        <Card size="small" className="shadow-sm !mb-4">
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
            className="w-full p-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              <Form.Item name="search" label="Search" className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-gray-400" />}
                  placeholder="Search products..."
                  allowClear
                  className="w-full"
                />
              </Form.Item>
              <Form.Item name="category" label="Category" className="!mb-0">
                <Select className="w-full">
                  <Option value="all">All Categories</Option>
                  {categories.map((c) => (
                    <Option key={c.id} value={c.label}>
                      {c.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="brand" label="Brand" className="!mb-0">
                <Select className="w-full">
                  <Option value="all">All Brands</Option>
                  {brands.map((b) => (
                    <Option key={b.id} value={b.label}>
                      {b.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Status" className="!mb-0">
                <Select className="w-full">
                  <Option value="all">All Status</Option>
                  <Option value="true">Active</Option>
                  <Option value="false">Inactive</Option>
                </Select>
              </Form.Item>
              <Form.Item name="listing" label="Listing" className="!mb-0">
                <Select className="w-full">
                  <Option value="all">All Listing</Option>
                  <Option value="true">Listed</Option>
                  <Option value="false">Unlisted</Option>
                </Select>
              </Form.Item>
              <Form.Item className="!mb-0">
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<IconFilter size={15} />}
                    className="flex-1"
                  >
                    Filter
                  </Button>
                  <Button
                    icon={<IconX size={15} />}
                    onClick={handleClearFilters}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </Card>

        {/* Table */}
        <Table
          scroll={{ x: 1000 }}
          bordered
          columns={columns}
          dataSource={products}
          rowKey="productId"
          pagination={{ ...pagination, position: ["bottomRight"] }}
          loading={loading}
          onChange={handleTableChange}
          size="small"
          className="rounded-lg overflow-hidden border border-gray-100"
        />
      </Space>

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

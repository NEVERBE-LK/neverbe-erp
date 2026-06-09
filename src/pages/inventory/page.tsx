import React, { useState, useEffect, useMemo } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconStack2,
  IconFilter,
  IconBox,
  IconAlertTriangle,
  IconMapPin,
} from "@tabler/icons-react";
import { useAppSelector } from "@/lib/hooks";
import api from "@/lib/api";
import { DropdownOption } from "../master/products/page";
import { InventoryItem } from "@/model/InventoryItem";
import InventoryFormModal from "./components/InventoryFormModal";
import BulkInventoryFormModal from "./components/BulkInventoryFormModal";
import toast from "react-hot-toast";
import {
  Table,
  Button,
  Select,
  Form,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";

interface StockLocationOption extends DropdownOption {}

const { Option } = Select;

const InventoryPage = () => {
  const [form] = Form.useForm();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [variants, setVariants] = useState<DropdownOption[]>([]);
  const [sizes, setSizes] = useState<DropdownOption[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationOption[]>(
    [],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (currentUser) {
      fetchInventory(); // Initial fetch
      fetchDropdown("/api/v1/erp/master/products/dropdown", setProducts);
      fetchDropdown("/api/v1/erp/master/sizes/dropdown", setSizes);
      fetchDropdown("/api/v1/erp/master/stocks/dropdown", setStockLocations);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchInventory();
    }
  }, [pagination.current, pagination.pageSize]);

  const fetchInventory = async (values?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const filters = values || form.getFieldsValue();
      const params: Record<string, unknown> = {
        page: pagination.current,
        size: pagination.pageSize,
      };
      if (filters.productId) params.productId = filters.productId;
      if (filters.variantId && filters.variantId !== "all")
        params.variantId = filters.variantId;
      if (filters.size && filters.size !== "all")
        params.variantSize = filters.size;
      if (filters.stockId && filters.stockId !== "all")
        params.stockId = filters.stockId;

      const response = await api.get("/api/v1/erp/inventory", { params });
      setInventoryItems(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch {
      toast.error("Failed to fetch inventory");
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
    } catch {
      console.error(`Failed to fetch dropdown data from ${url}`);
    }
  };

  const fetchVariantsDropdown = async (productId: string) => {
    setVariantLoading(true);
    setVariants([]);
    try {
      const response = await api.get(
        `/api/v1/erp/master/products/${productId}/variants/dropdown`,
      );
      setVariants(response.data || []);
    } catch {
      console.error(`Failed to fetch variants for product ${productId}`);
    } finally {
      setVariantLoading(false);
    }
  };

  // --- Handlers ---
  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchInventory(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    setVariants([]);
    handleFilterSubmit({});
  };

  const handleProductChange = (productId: string) => {
    if (productId) {
      fetchVariantsDropdown(productId);
    } else {
      setVariants([]);
    }
    form.setFieldsValue({ variantId: "all" });
  };

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveStock = async (itemData: InventoryItem) => {
    const { productId, variantId, size, stockId, quantity } = itemData;
    const payload = { productId, variantId, size, stockId, quantity };
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      await api.post("/api/v1/erp/inventory", fd);
      handleCloseModal();
      fetchInventory();
      toast.success("Stock item saved successfully");
    } catch {
      toast.error("Error saving stock item");
    }
  };

  const handleTableChange = (newPagination: {
    current?: number;
    pageSize?: number;
    total?: number;
  }) => {
    setPagination(newPagination as typeof pagination);
  };

  // --- Dynamic Stats calculation ---
  const stats = useMemo(() => {
    const totalSKUs = pagination.total;
    const totalUnits = inventoryItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );
    const lowStockCount = inventoryItems.filter(
      (item) => (item.quantity || 0) <= 5,
    ).length;
    return { totalSKUs, totalUnits, lowStockCount };
  }, [inventoryItems, pagination.total]);

  const columns: ColumnsType<InventoryItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <Space>
          {(record as any).thumbnail ? (
            <img
              src={(record as any).thumbnail}
              alt="thumbnail"
              className="w-10 h-10 object-cover rounded-xl border border-gray-100 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl border border-gray-100">
              <IconStack2 size={16} className="text-gray-400" />
            </div>
          )}
          <div>
            <Typography.Text strong className="block text-gray-800 text-sm">
              {(record as any).productName}
            </Typography.Text>
            <Typography.Text type="secondary" className="text-xs">
              {(record as any).variantName}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 100,
      render: (size) => (
        <Tag className="rounded-full px-3 py-0.5 font-bold bg-gray-50 border-gray-200 text-gray-700">
          {size}
        </Tag>
      ),
    },
    {
      title: "Location",
      dataIndex: "stockName",
      key: "location",
      render: (locName) => (
        <Space className="text-gray-600">
          <IconMapPin size={16} className="text-gray-400" />
          <span>{locName}</span>
        </Space>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      render: (qty) => {
        if (qty === 0) {
          return (
            <Tag color="red" className="rounded-lg px-2.5 py-0.5 border-none font-bold">
              Out of Stock
            </Tag>
          );
        }
        if (qty <= 5) {
          return (
            <Tag color="orange" className="rounded-lg px-2.5 py-0.5 border-none font-bold">
              Low Stock: {qty}
            </Tag>
          );
        }
        return (
          <Tag
            color="emerald"
            className="rounded-lg px-2.5 py-0.5 border-none font-bold bg-emerald-50 text-emerald-700"
          >
            {qty} Units
          </Tag>
        );
      },
    },
  ];

  return (
    <PageContainer title="Stocks" description="Stock Management">
      <Space direction="vertical" size="large" className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Inventory Control
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none">
                Stock Management
              </h2>
            </div>
          </div>
          <Space className="w-full sm:w-auto justify-start sm:justify-end">
            <Button
              icon={<IconStack2 size={18} />}
              onClick={() => setIsBulkModalOpen(true)}
              className="rounded-xl h-12 px-4 flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              Bulk Add
            </Button>
            <Button
              type="primary"
              icon={<IconPlus size={18} />}
              onClick={handleOpenCreateModal}
              className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
              New Entry
            </Button>
          </Space>
        </div>

        {/* Metric Cards */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Total Unique SKUs
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.totalSKUs}
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                  <IconBox size={24} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-teal-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Physical Stock (Page)
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.totalUnits}
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <IconStack2 size={24} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50/50 to-red-50/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <Typography.Text
                    type="secondary"
                    className="text-xs uppercase tracking-wider font-semibold"
                  >
                    Low Stock Items (Page)
                  </Typography.Text>
                  <div className="text-3xl font-black text-slate-800 mt-1">
                    {stats.lowStockCount}
                  </div>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                  <IconAlertTriangle size={24} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters Card */}
        <Card
          size="small"
          className="border-none bg-gray-50/50 rounded-2xl shadow-none"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ variantId: "all", size: "all", stockId: "all" }}
            className="w-full p-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
              <Form.Item name="productId" label="Product" className="!mb-0">
                <Select
                  showSearch
                  placeholder="All Products"
                  optionFilterProp="children"
                  onChange={handleProductChange}
                  allowClear
                  className="w-full h-10"
                >
                  {products.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="variantId" label="Variant" className="!mb-0">
                <Select
                  className="w-full h-10"
                  disabled={!form.getFieldValue("productId") || variantLoading}
                  loading={variantLoading}
                >
                  <Option value="all">All Variants</Option>
                  {variants.map((v) => (
                    <Option key={v.id} value={v.id}>
                      {v.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="size" label="Size" className="!mb-0">
                <Select className="w-full h-10">
                  <Option value="all">All Sizes</Option>
                  {sizes.map((s) => (
                    <Option key={s.id} value={s.label}>
                      {s.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="stockId" label="Location" className="!mb-0">
                <Select className="w-full h-10">
                  <Option value="all">All Locations</Option>
                  {stockLocations.map((l) => (
                    <Option key={l.id} value={l.id}>
                      {l.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item className="!mb-0">
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<IconSearch size={15} />}
                    className="flex-1 rounded-xl h-10 font-bold bg-gray-900 border-none hover:bg-black flex items-center justify-center gap-1"
                  >
                    Filter
                  </Button>
                  <Button
                    icon={<IconX size={15} />}
                    onClick={handleClearFilters}
                    className="flex-1 rounded-xl h-10 font-bold border-gray-200 flex-items-center justify-center gap-1"
                  >
                    Clear
                  </Button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </Card>

        {/* Table */}
        <div className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none">
          <Table
            scroll={{ x: 1000 }}
            bordered
            columns={columns}
            dataSource={inventoryItems}
            rowKey="id"
            pagination={{ ...pagination, position: ["bottomRight"] }}
            loading={loading}
            onChange={handleTableChange}
            size="middle"
            className="rounded-2xl overflow-hidden ant-table-fluid"
          />
        </div>
      </Space>

      <InventoryFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveStock}
        item={null} // Editing is blocked, so item is always null
        products={products}
        sizes={sizes}
        stockLocations={stockLocations}
      />

      <BulkInventoryFormModal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={() => fetchInventory()}
        products={products}
        stockLocations={stockLocations}
      />
    </PageContainer>
  );
};

export default InventoryPage;

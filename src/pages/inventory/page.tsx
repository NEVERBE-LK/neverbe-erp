import React, { useState, useEffect } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconSearch,
  IconX,
  IconStack2,
  IconFilter,
  IconMapPin,
  IconDotsVertical,
  IconEye,
} from "@tabler/icons-react";
import { useAppSelector } from "@/lib/hooks";
import api from "@/lib/api";
import { DropdownOption } from "../master/products/page";
import { InventoryItem } from "@/model/InventoryItem";
import toast from "react-hot-toast";
import {
  Table,
  Select,
  Form,
  Space,
  Typography,
  Tag,
  Image,
  Input,
  Dropdown,
  Modal,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import Spinner from "@/pages/components/shared/Spinner";

export interface ProductDropdownOption extends DropdownOption {
  buyingPrice?: number;
  sellingPrice?: number;
  variants?: any[];
  availableSizes?: string[];
  thumbnail?: { url: string; file: string; order: number };
  brand?: string;
  category?: string;
}

interface StockLocationOption extends DropdownOption {}

const { Option } = Select;

const InventoryPage = () => {
  const [form] = Form.useForm();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<ProductDropdownOption[]>([]);
  const [variants, setVariants] = useState<DropdownOption[]>([]);
  const [sizes, setSizes] = useState<DropdownOption[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationOption[]>(
    [],
  );

  const [loading, setLoading] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
      if (filters.search) params.search = filters.search;
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

  const handleTableChange = (newPagination: {
    current?: number;
    pageSize?: number;
    total?: number;
  }) => {
    setPagination(newPagination as typeof pagination);
  };

  const columns: ColumnsType<InventoryItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => {
        const imageUrl = (record as any).thumbnail;
        const productName = (record as any).productName;
        const variantName = (record as any).variantName || "";
        const formattedVariant = variantName.replace(/\b\w/g, (char: string) => char.toUpperCase());

        return (
          <Space size="middle">
            {imageUrl ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-xs shrink-0 flex items-center justify-center bg-gray-50 cursor-pointer">
                <Image
                  src={imageUrl}
                  alt={productName}
                  width={48}
                  height={48}
                  className="object-cover rounded-lg"
                  preview={{
                    mask: <span className="text-[9px] font-bold">Preview</span>
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
                <IconStack2 size={20} className="text-gray-400" />
              </div>
            )}
            <div>
              <Typography.Text strong className="block text-gray-800 text-sm">
                {productName}
              </Typography.Text>
              {formattedVariant ? (
                <Typography.Text type="secondary" className="text-xs">
                  {formattedVariant}
                </Typography.Text>
              ) : (
                <span className="text-gray-400 font-semibold text-xs">-</span>
              )}
            </div>
          </Space>
        );
      },
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
    {
      title: "Action",
      key: "action",
      align: "right",
      width: 80,
      render: (_, record) => {
        const items: MenuProps["items"] = [
          {
            key: "view",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <IconEye size={15} className="text-slate-500" />
                View Details
              </span>
            ),
            onClick: () => {
              setSelectedItem(record);
              setIsViewModalOpen(true);
            },
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <IconDotsVertical size={16} />
            </button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PageContainer title="Stock Overview" description="Physical Stock & Inventory Overview">
      <Space direction="vertical" size="large" className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-7 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 leading-none mb-1 font-mono">
                Inventory Control
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Stock Overview
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                  {pagination.total} items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "", productId: undefined, variantId: undefined, size: undefined, stockId: undefined }}
            className="w-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-end">
              <Form.Item name="search" label="Search" className="!mb-0">
                <Input
                  prefix={<IconSearch size={15} className="text-slate-400" />}
                  placeholder="Search item name..."
                  allowClear
                  className="rounded-xl w-full"
                />
              </Form.Item>
              <Form.Item name="productId" label="Product" className="!mb-0">
                <Select
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="rounded-xl w-full"
                  placeholder="Select Product"
                  onChange={handleProductChange}
                  allowClear
                  options={products.map((p) => ({ value: p.id, label: p.label }))}
                />
              </Form.Item>
              <Form.Item name="variantId" label="Variant" className="!mb-0">
                <Select
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="rounded-xl w-full"
                  placeholder="Select Variant"
                  loading={variantLoading}
                  disabled={!variants.length}
                  allowClear
                  options={variants.map((v) => ({ value: v.id, label: v.label }))}
                />
              </Form.Item>
              <Form.Item name="size" label="Size" className="!mb-0">
                <Select
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="rounded-xl w-full"
                  placeholder="Select Size"
                  allowClear
                  options={sizes.map((s) => ({ value: s.id, label: s.label }))}
                />
              </Form.Item>
              <Form.Item name="stockId" label="Location" className="!mb-0">
                <Select
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="rounded-xl w-full"
                  placeholder="Select Location"
                  allowClear
                  options={stockLocations.map((s) => ({ value: s.id, label: s.label }))}
                />
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
            dataSource={inventoryItems}
            rowKey="id"
            pagination={{ ...pagination, position: ["bottomRight"] }}
            loading={{ spinning: loading, indicator: <Spinner size="small" /> }}
            onChange={handleTableChange}
            size="small"
            className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3.5"
          />
        </div>
      </Space>

      {/* View Item Details Modal */}
      <Modal
        title={null}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={null}
        closable={false}
        width={560}
        centered
        className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!bg-white [&_.ant-modal-content]:dark:!bg-slate-900 [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-slate-200/80 [&_.ant-modal-content]:dark:!border-slate-800"
      >
        {selectedItem && (() => {
          const matchedProduct = products.find((p) => p.id === selectedItem.productId);
          const matchedVariant = matchedProduct?.variants?.find((v: any) => v.variantId === selectedItem.variantId || v.id === selectedItem.variantId);
          const imageUrl = matchedVariant?.images?.[0]?.url || matchedProduct?.thumbnail?.url || (selectedItem as any).thumbnail;

          return (
            <div>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-slate-900 dark:bg-slate-100 rounded-full" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 font-mono">
                      Inventory Item Details
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0 leading-tight">
                      {selectedItem.productName || "Product Overview"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Product Header Box */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={selectedItem.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IconStack2 size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate m-0">
                        {selectedItem.productName || "Product"}
                      </h4>
                      {selectedItem.quantity === 0 ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">
                          Out of Stock
                        </span>
                      ) : selectedItem.quantity <= 5 ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          In Stock
                        </span>
                      )}
                    </div>
                    {selectedItem.variantName && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-normal mt-0.5">
                        Variant: {selectedItem.variantName}
                      </span>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        SIZE: {selectedItem.size}
                      </span>
                      {matchedProduct?.brand && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {matchedProduct.brand}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Stock Location
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                      <IconMapPin size={14} className="text-slate-400 shrink-0" />
                      {selectedItem.stockName || selectedItem.stockId}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Available Units
                    </span>
                    <span className={`font-bold text-sm ${selectedItem.quantity === 0 ? 'text-rose-600 dark:text-rose-400' : selectedItem.quantity <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {selectedItem.quantity} Units
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Unit Price
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {matchedProduct?.sellingPrice ? `Rs. ${matchedProduct.sellingPrice.toLocaleString()}` : "N/A"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Stock Valuation
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {matchedProduct?.sellingPrice ? `Rs. ${(matchedProduct.sellingPrice * selectedItem.quantity).toLocaleString()}` : "N/A"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Product ID
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 truncate block">
                      {selectedItem.productId}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                      Variant ID
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 truncate block">
                      {selectedItem.variantId || "Standard"}
                    </span>
                  </div>
                </div>

                {/* Additional Record Meta Box */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] flex justify-between items-center font-mono">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    Inventory Record Key
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    {selectedItem.id || "N/A"}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </PageContainer>
  );
};

export default InventoryPage;

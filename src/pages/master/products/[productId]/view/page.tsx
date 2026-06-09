import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tag,
  Table,
  Image,
  Spin,
  Badge,
  Button,
  Empty,
  Tooltip,
  Descriptions,
  Statistic,
  Typography,
  Row,
  Col,
  Space,
} from "antd";

import dayjs from "dayjs";
import { parseToDayjs } from "@/utils/dateUtils";

const { Text } = Typography;

import {
  IconChevronLeft,
  IconEdit,
  IconTag,
  IconRuler,
  IconPhoto,
  IconTrendingUp,
  IconAlertTriangle,
  IconCash,
  IconHistory,
} from "@tabler/icons-react";
import api from "@/lib/api";
import { Product } from "@/model/Product";
import PageContainer from "@/pages/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { Link } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { ProductVariant } from "@/model/ProductVariant";
import { InventoryItem } from "@/model/InventoryItem";

const ProductViewPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.productId as string;
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productRes, inventoryRes] = await Promise.all([
          api.get(`/api/v1/erp/master/products/${id}`),
          api.get(`/api/v1/erp/inventory?productId=${id}&size=100`),
        ]);

        if (productRes.data) {
          const prod: Product = productRes.data;
          setProduct(prod);
          setActiveImage(prod.thumbnail?.url || null);
        } else {
          setError("Product not found.");
        }

        if (inventoryRes.data && inventoryRes.data.dataList) {
          setInventory(inventoryRes.data.dataList);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, currentUser]);

  const allImages = product
    ? [
        ...(product.thumbnail ? [product.thumbnail] : []),
        ...(product.variants?.flatMap((v) => v.images || []) || []),
      ]
    : [];

  const variantColumns: ColumnsType<ProductVariant> = [
    {
      title: "Variant Name",
      dataIndex: "variantName",
      key: "variantName",
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Variant ID",
      dataIndex: "variantId",
      key: "variantId",
      render: (text: string) => (
        <span className="font-mono text-xs text-gray-400">{text}</span>
      ),
    },
    {
      title: "Sizes",
      dataIndex: "sizes",
      key: "sizes",
      render: (sizes: string[]) => (
        <div className="flex flex-wrap gap-1">
          {sizes?.map((s) => (
            <Tag key={s} className="text-xs">
              {s}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Available Stock",
      key: "stock",
      render: (_, record) => {
        const variantStock = inventory
          .filter((inv) => inv.variantId === record.variantId)
          .reduce((sum, item) => sum + item.quantity, 0);

        return (
          <span
            className={`font-black ${
              variantStock > 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {variantStock} Units
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v: boolean) => (
        <Badge
          status={v ? "success" : "default"}
          text={v ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Images",
      dataIndex: "images",
      key: "images",
      render: (imgs: { url: string }[]) => (
        <div className="flex gap-1">
          {imgs?.slice(0, 3).map((img, i) => (
            <img
              key={i}
              src={img.url}
              className="w-8 h-8 rounded object-cover border border-gray-100"
              alt=""
            />
          ))}
          {(imgs?.length || 0) > 3 && (
            <span className="text-xs text-gray-400 flex items-center">
              +{imgs.length - 3}
            </span>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <PageContainer title="Loading Product...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spin size="large" tip="Loading product details..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer title="Product Not Found">
        <Empty description={error || "Product not found"} className="mt-20">
          <Link to="/master/products">
            <Button>Back to Products</Button>
          </Link>
        </Empty>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={product.name}
      description={`Details for ${product.name}`}
    >
      <div className="space-y-8">
        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
              <IconTag size={32} stroke={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Text className="text-xs font-bold text-green-600 uppercase tracking-wider">
                  {product.brand} · {product.category}
                </Text>
                <Tag
                  color={product.status ? "success" : "default"}
                  className="rounded-full px-3 text-[10px] font-bold uppercase border-none"
                >
                  {product.status ? "Active" : "Inactive"}
                </Tag>
                {product.listing && (
                  <Tag
                    color="blue"
                    className="rounded-full px-3 text-[10px] font-bold uppercase border-none"
                  >
                    Listed
                  </Tag>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight m-0">
                {product.name}
              </h1>
              <Text className="text-gray-400 font-mono text-xs">
                SKU: {product.productId}
              </Text>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              size="large"
              className="flex-1 sm:flex-none rounded-xl font-semibold inline-flex items-center justify-center gap-2"
              icon={<IconEdit size={18} />}
              onClick={() => navigate(`/master/products`)}
            >
              Edit Product
            </Button>
          </div>
        </div>

        {/* Inventory & Specs Hub */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card className="border border-gray-100 rounded-[24px] bg-white shadow-sm h-full">
              <div className="p-2">
                <Space align="center" className="mb-6">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <IconTrendingUp size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                    Inventory Overview
                  </span>
                </Space>

                <Row gutter={[48, 32]}>
                  <Col xs={24} md={14}>
                    <h2 className="text-gray-900 text-3xl font-black mb-2 tracking-tight">
                      Current Availability
                    </h2>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          ROI Status:{" "}
                          {(product.sellingPrice - product.buyingPrice) /
                            product.sellingPrice >
                          0.4
                            ? "Optimized"
                            : "Thin Margins"}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          Stock Health: {product.inStock ? "Adequate" : "Exhausted"}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-0">
                      This product currently has {product.totalStock || 0} units across all locations.
                      The acquisition cost is LKR {(product.buyingPrice || 0).toLocaleString()} with a gross margin of {product.sellingPrice > 0 ? Math.round(((product.sellingPrice - (product.buyingPrice || 0)) / product.sellingPrice) * 100) : 0}%.
                    </p>
                  </Col>
                  <Col xs={24} md={10} className="flex items-center">
                    <div className="w-full grid grid-cols-1 gap-3">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Retail Price
                          </span>
                          <IconCash size={14} className="text-green-600" />
                        </div>
                        <div className="text-xl font-black text-gray-900">
                          LKR {(product.sellingPrice || 0).toLocaleString()}
                        </div>
                      </div>
                      
                      {product.marketPrice > 0 && (
                        <div className="px-4 py-2 bg-amber-50/50 rounded-xl border border-amber-100/50 flex justify-between items-center">
                          <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">
                            Market Avg
                          </span>
                          <span className="text-xs font-bold text-amber-900">
                            LKR {product.marketPrice.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              className="border-none shadow-xl rounded-[24px] h-full bg-white flex flex-col pt-4"
              title={
                <Space>
                  <IconAlertTriangle size={18} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Stock Alerts
                  </span>
                </Space>
              }
            >
              <div className="space-y-4">
                {(product.totalStock || 0) < 10 && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0">
                      <IconAlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-red-900 uppercase tracking-tight">
                        Critical Depletion
                      </div>
                      <div className="text-[10px] text-red-700 font-medium">
                        Low stock detected.
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <IconTrendingUp size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-900 uppercase tracking-tight">
                      Listing Health
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      Optimized for retail listing.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media & Primary Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <Card
                className="border-none rounded-3xl overflow-hidden bg-gray-50 shadow-none ring-1 ring-gray-100"
                styles={{ body: { padding: 0 } }}
              >
                <div className="aspect-square flex items-center justify-center rounded-2xl overflow-hidden relative group">
                  {activeImage ? (
                    <Image
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ maxHeight: "450px" }}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300 gap-2">
                      <IconPhoto size={64} stroke={1} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        No image available
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3 px-1">
                  {allImages.slice(0, 5).map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImage(img.url)}
                      className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                        activeImage === img.url
                          ? "border-green-500 shadow-md transform scale-105"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Product Narrative
                  </span>
                </div>
              }
              className="border border-gray-100 rounded-2xl bg-white shadow-none"
            >
              <div 
                className="text-sm text-gray-600 leading-relaxed font-medium markdown-content"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {product.description ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {product.description}
                  </ReactMarkdown>
                ) : (
                  <span className="italic text-gray-400">
                    No description provided.
                  </span>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Specs & Pricing */}
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              <Card className="border border-emerald-100 rounded-2xl bg-emerald-50/20 shadow-none">
                <div className="text-[9px] font-black uppercase text-emerald-700 tracking-[0.2em] mb-2">
                  Buying Price
                </div>
                <div className="text-xl font-black text-emerald-900">
                  <span className="text-xs font-bold mr-1">LKR</span>
                  {(product.buyingPrice || 0).toLocaleString()}
                </div>
              </Card>

              <Card className="border border-blue-100 rounded-2xl bg-blue-50/20 shadow-none">
                <div className="text-[9px] font-black uppercase text-blue-700 tracking-[0.2em] mb-2">
                  Selling Price
                </div>
                <div className="text-xl font-black text-blue-900">
                  <span className="text-xs font-bold mr-1">LKR</span>
                  {(product.sellingPrice || 0).toLocaleString()}
                </div>
              </Card>

              <Card className="border border-amber-100 rounded-2xl bg-amber-50/20 shadow-none">
                <div className="text-[9px] font-black uppercase text-amber-700 tracking-[0.2em] mb-2">
                  Market Price
                </div>
                <div className="text-xl font-black text-amber-900">
                  <span className="text-xs font-bold mr-1">LKR</span>
                  {(product.marketPrice || 0).toLocaleString()}
                </div>
              </Card>

              <Card className="border border-gray-100 rounded-2xl bg-white shadow-none">
                <div className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">
                  Unit Margin
                </div>
                <div className="text-xl font-black text-gray-900">
                  {product.sellingPrice > 0 
                    ? Math.round(((product.sellingPrice - (product.buyingPrice || 0)) / product.sellingPrice) * 100) 
                    : 0}%
                </div>
              </Card>

              <Card className="border border-indigo-100 rounded-2xl bg-indigo-50/10 shadow-none">
                <div className="text-[9px] font-black uppercase text-indigo-700 tracking-[0.2em] mb-2">
                  Inventory Value
                </div>
                <div className="text-xl font-black text-indigo-900">
                  <span className="text-xs font-bold mr-1">LKR</span>
                  {(
                    (product.buyingPrice || 0) * (product.totalStock || 0)
                  ).toLocaleString()}
                </div>
              </Card>

              <Card className="border border-purple-100 rounded-2xl bg-purple-50/20 shadow-none">
                <div className="text-[9px] font-black uppercase text-purple-700 tracking-[0.2em] mb-2">
                  Potential Revenue
                </div>
                <div className="text-xl font-black text-purple-900">
                  <span className="text-xs font-bold mr-1">LKR</span>
                  {(
                    (product.sellingPrice || 0) * (product.totalStock || 0)
                  ).toLocaleString()}
                </div>
              </Card>
            </div>

            <Card
              title={
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-gray-300 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Technical Specifications
                  </span>
                </div>
              }
              className="border border-gray-100 rounded-2xl bg-white shadow-none"
            >
              <Descriptions
                bordered={false}
                column={{ xxl: 2, xl: 2, lg: 1, md: 2, sm: 1, xs: 1 }}
                size="middle"
              >
                <Descriptions.Item label="Inventory Status">
                  <span className={product.inStock ? "text-green-600" : "text-red-500 font-bold"}>
                    {product.inStock ? `${product.totalStock} units available` : "Out of Stock"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Unit Weight">
                  {product.weight ? `${product.weight} g` : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Brand">{product.brand}</Descriptions.Item>
                <Descriptions.Item label="Category">{product.category}</Descriptions.Item>
              </Descriptions>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <IconRuler size={18} className="text-gray-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Product Variants ({product.variants?.length || 0})
                  </span>
                </div>
              </div>
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                <Table
                  scroll={{ x: 1000 }}
                  bordered
                  columns={variantColumns}
                  dataSource={product.variants || []}
                  rowKey="variantId"
                  pagination={false}
                  size="middle"
                />
              </div>
            </div>
          </div>
        </div>

        <Card className="border border-gray-100 rounded-2xl bg-gray-50/30">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                <IconHistory size={18} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-0.5">
                  Created On
                </div>
                <div className="text-[11px] font-bold text-gray-600">
                  {(() => {
                    const parsed = parseToDayjs(product.createdAt);
                    return parsed ? parsed.format("DD MMM YYYY, hh:mm A") : "N/A";
                  })()}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        .markdown-content strong {
          font-weight: 800;
          color: #111827;
        }
        .markdown-content p {
          margin-bottom: 0.5em;
        }
        .markdown-content ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .ant-table-thead > tr > th {
          background: #fcfcfc !important;
          color: #9ca3af !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          font-weight: 800 !important;
        }
      `}</style>
    </PageContainer>
  );
};

export default ProductViewPage;

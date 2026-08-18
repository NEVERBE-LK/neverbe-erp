import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Table, Empty } from "antd";
import Spinner from "@/pages/components/shared/Spinner";
import { parseToDayjs } from "@/utils/dateUtils";
import {
  IconEdit,
  IconRuler,
  IconPhoto,
} from "@tabler/icons-react";
import api from "@/lib/api";
import { Product } from "@/model/Product";
import PageContainer from "@/pages/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
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
      render: (text: string) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{text}</span>
      ),
    },
    {
      title: "Variant ID",
      dataIndex: "variantId",
      key: "variantId",
      render: (text: string) => (
        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{text}</span>
      ),
    },
    {
      title: "Sizes",
      dataIndex: "sizes",
      key: "sizes",
      render: (sizes: string[]) => (
        <div className="flex flex-wrap gap-1">
          {sizes?.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
            >
              {s}
            </span>
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
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            variantStock > 0
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${variantStock > 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
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
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          v
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${v ? "bg-emerald-500" : "bg-slate-400"}`} />
          {v ? "Active" : "Inactive"}
        </span>
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
              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              alt=""
            />
          ))}
          {(imgs?.length || 0) > 3 && (
            <span className="text-[10px] font-bold text-slate-400 flex items-center">
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
          <Spinner size="large" tip="Loading product details..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer title="Product Not Found">
        <Empty description={<span className="text-slate-400 text-sm">{error || "Product not found"}</span>} className="mt-20">
          <Link to="/master/products">
            <button className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer">
              Back to Products
            </button>
          </Link>
        </Empty>
      </PageContainer>
    );
  }

  const costPrice = product.buyingPrice || 0;
  const sellingPrice = product.sellingPrice || 0;
  const profit = sellingPrice - costPrice;
  const marginPercentage = sellingPrice > 0 ? Math.round((profit / sellingPrice) * 100) : 0;
  const totalStock = product.totalStock || 0;
  const totalInventoryValue = costPrice * totalStock;
  const potentialRevenue = sellingPrice * totalStock;

  return (
    <PageContainer
      title={product.name}
      description={`Details for ${product.name}`}
    >
      <div className="space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none m-0">
              {product.name}
            </h1>
          </div>

          <button
            onClick={() => navigate(`/master/products`)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-all cursor-pointer w-full sm:w-auto"
          >
            <IconEdit size={16} />
            Edit Product
          </button>
        </div>

        {/* Top 2-Column Balanced Grid: Gallery & Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (5 Cols): Media Gallery */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 flex-1 flex flex-col justify-between">
              <div className="aspect-square flex items-center justify-center rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 relative group max-h-[350px]">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-300 dark:text-slate-600 gap-2">
                    <IconPhoto size={56} stroke={1} />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      No image available
                    </span>
                  </div>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {allImages.slice(0, 5).map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImage(img.url)}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                        activeImage === img.url
                          ? "border-slate-900 dark:border-slate-100 shadow-xs"
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
          </div>

          {/* Right Column (7 Cols): Single Product Details Card */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-slate-900 dark:bg-slate-100 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                  Product Details
                </span>
              </div>

              {/* Group 1: General Classification & Identity */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  General Classification & Identity
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">SKU</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">{product.productId}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Brand</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{product.brand || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Category</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{product.category || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Status</div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        product.status
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {product.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Listing</div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        product.listing
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}>
                        {product.listing ? "Listed" : "Unlisted"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Unit Weight</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{product.weight ? `${product.weight} g` : "N/A"}</div>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <div className="text-[10px] text-slate-400 font-medium">Created On</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {(() => {
                        const parsed = parseToDayjs(product.createdAt);
                        return parsed ? parsed.format("DD MMM YYYY, HH:mm A") : "N/A";
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: Financials & Pricing */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  Pricing & Profitability
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Buying Price</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      LKR {costPrice.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Selling Price</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      LKR {sellingPrice.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Unit Margin</div>
                    <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {marginPercentage}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Market Price</div>
                    <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                      {product.marketPrice ? `LKR ${product.marketPrice.toLocaleString()}` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 3: Inventory & Valuation */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  Stock & Valuation
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Inventory Status</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      <span className={product.inStock ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Total Stock Units</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      {totalStock} Units
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Inventory Value</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      LKR {totalInventoryValue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Potential Revenue</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      LKR {potentialRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Section: Product Narrative Description */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
              Product Narrative & Description
            </span>
          </div>
          <div
            className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium markdown-content"
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
              <span className="italic text-slate-400">
                No description provided.
              </span>
            )}
          </div>
        </div>

        {/* Full-Width Section: Product Variants Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <IconRuler size={18} className="text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                Product Variants ({product.variants?.length || 0})
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <Table
              scroll={{ x: 600 }}
              columns={variantColumns}
              dataSource={product.variants || []}
              rowKey="variantId"
              pagination={false}
              size="small"
              className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800 [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800/60 [&_.ant-table-tbody>tr>td]:!py-3"
            />
          </div>
        </div>
      </div>

      <style>{`
        .markdown-content strong {
          font-weight: 700;
        }
        .markdown-content p {
          margin-bottom: 0.5em;
        }
        .markdown-content ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
      `}</style>
    </PageContainer>
  );
};

export default ProductViewPage;

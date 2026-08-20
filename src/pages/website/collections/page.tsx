import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Switch,
  Upload,
  message,
  Tooltip,
} from "antd";
import {
  IconStar,
  IconStarOff,
  IconUpload,
  IconRefresh,
} from "@tabler/icons-react";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import { Category } from "@/model/Category";
import { useAppSelector } from "@/lib/hooks";

const CollectionsPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const { currentUser, loading: authLoading } = useAppSelector((state) => state.authSlice);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/v1/erp/master/categories", {
        params: { size: 100, status: "active" },
      });
      setCategories(data.dataList || []);
    } catch (e) {
      console.error(e);
      message.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchCategories();
  }, [currentUser, authLoading]);

  const handleToggleFeatured = async (category: Category) => {
    try {
      setUpdating(category.id!);
      const newStatus = !category.isFeatured;
      
      const formData = new FormData();
      formData.append("data", JSON.stringify({ 
        ...category,
        isFeatured: newStatus 
      }));

      await api.put(`/api/v1/erp/master/categories/${category.id}`, formData);
      
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, isFeatured: newStatus } : c
      ));
      
      message.success(newStatus ? "Added to Featured" : "Removed from Featured");
    } catch (e) {
      message.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleImageUpload = async (category: Category, file: File) => {
    try {
      setUpdating(category.id!);
      
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG/WEBP files!');
        return false;
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(category));
      formData.append("file", file);

      const { data: updatedCategory } = await api.put(`/api/v1/erp/master/categories/${category.id}`, formData);
      
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, imageUrl: updatedCategory.imageUrl } : c
      ));
      
      message.success("Image uploaded successfully");
    } catch (e) {
      message.error("Image upload failed");
    } finally {
      setUpdating(null);
    }
    return false;
  };

  const columns: ColumnsType<Category> = [
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">{text}</span>
          <span className="text-xs text-text-sub dark:text-slate-400">{record.description || "No description"}</span>
        </div>
      ),
    },
    {
      title: "Featured Status",
      dataIndex: "isFeatured",
      key: "isFeatured",
      width: 150,
      align: "center",
      render: (isFeatured, record) => (
        <Tooltip title={isFeatured ? "Currently Featured" : "Not Featured"}>
          <Switch
            checked={isFeatured}
            loading={updating === record.id}
            onChange={() => handleToggleFeatured(record)}
            checkedChildren={<IconStar size={14} fill="currentColor" />}
            unCheckedChildren={<IconStarOff size={14} />}
          />
        </Tooltip>
      ),
    },
    {
      title: "Website Card Image (4:5)",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 250,
      render: (imageUrl, record) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-15 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden border border-card-border dark:border-card-border-dark flex items-center justify-center">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={record.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[9px] text-text-sub text-center font-mono">NO IMG</span>
            )}
          </div>
          <Upload
            beforeUpload={(file) => handleImageUpload(record, file)}
            showUploadList={false}
            accept="image/*"
          >
            <Button 
              size="small" 
              icon={<IconUpload size={14} />}
              loading={updating === record.id}
              className="h-8 px-3 rounded-lg border-card-border dark:border-card-border-dark text-xs font-semibold"
            >
              Change
            </Button>
          </Upload>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Featured Collections">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Storefront CMS
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Featured Collections
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {categories.filter(c => c.isFeatured).length} Featured
                </span>
              </div>
            </div>
          </div>
          <Button 
            icon={<IconRefresh size={16} />} 
            onClick={fetchCategories} 
            loading={loading}
            className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-medium cursor-pointer flex items-center gap-2"
          >
            Refresh
          </Button>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              columns={columns}
              dataSource={categories}
              loading={loading}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </div>
        </div>

        {/* Pro Tip Box */}
        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
            <IconStar size={18} />
          </div>
          <div>
            <span className="font-bold text-xs text-blue-900 dark:text-blue-300 block mb-0.5">Image Formatting Tip:</span>
            <p className="text-xs text-blue-700 dark:text-blue-400 m-0">
              Use images with a 4:5 aspect ratio (e.g. 800x1000px) for collection cards on your storefront homepage.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default CollectionsPage;

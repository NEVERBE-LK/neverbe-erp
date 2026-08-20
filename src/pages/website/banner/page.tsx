import React, { useEffect, useState } from "react";
import { Button, Row, Col } from "antd";
import { useAppSelector } from "@/lib/hooks";
import {
  getBannersAction,
  addBannerAction,
  deleteBannerAction,
} from "@/actions/settingActions";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/pages/components/shared/Spinner";
import { IconTrash, IconUpload, IconCloudUpload, IconPhoto } from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";

// ============ BANNER CARD ============
const BannerCard = ({
  banner,
  onDelete,
}: {
  banner: { file?: string; fileName?: string; url: string; id: string };
  onDelete: (id: string) => void;
}) => {
  const { showConfirmation } = useConfirmationDialog();

  const handleDelete = () => {
    showConfirmation({
      title: "Delete Banner?",
      message: "This banner asset will be permanently removed.",
      variant: "danger",
      confirmText: "Delete Asset",
      onSuccess: () => onDelete(banner.id),
    });
  };

  return (
    <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
      <div className="relative aspect-1400/628 w-full overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <img
          src={banner.url}
          alt="Banner Asset"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3.5 flex items-center justify-between border-t border-card-border dark:border-card-border-dark font-mono">
        <span className="text-xs text-text-sub dark:text-slate-400 truncate max-w-[180px]">
          {banner.fileName || banner.file || "UNTITLED_ASSET"}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer border-none bg-transparent"
        >
          <IconTrash size={16} />
        </button>
      </div>
    </div>
  );
};

// ============ BANNER FORM ============
const BannerForm = ({ onSuccess }: { onSuccess: (newBanner: any) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResolution, setImageResolution] = useState("");

  const validateImage = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (file.size > 20 * 1024 * 1024) {
        return reject("SIZE EXCEEDED: MAX 20MB");
      }

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImageResolution(`${img.width}x${img.height}`);
        const MARGIN = 150;
        const isWidthValid = Math.abs(img.width - 1400) <= MARGIN;
        const isHeightValid = Math.abs(img.height - 628) <= MARGIN;

        if (!isWidthValid || !isHeightValid) {
          return reject(`INVALID DIMENSIONS: REQUIRED ~1400x628px (±${MARGIN}px)`);
        }
        resolve();
      };
      img.onerror = () => reject("FILE ERROR");
    });
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    try {
      setIsLoading(true);
      await validateImage(file);
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    } catch (error: any) {
      toast.error(error);
      setSelectedFile(null);
      setImagePreview(null);
      setImageResolution("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append("banner", selectedFile);
      }
      formData.append("data", JSON.stringify({ path: "sliders" }));

      const res = await addBannerAction(formData);
      setSelectedFile(null);
      setImagePreview(null);
      // @ts-ignore
      e.target.reset();
      toast.success("BANNER UPLOADED");
      onSuccess(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-6 rounded-2xl shadow-xs">
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div
          className={`w-full aspect-1400/628 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden transition-all ${
            selectedFile
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-card-border dark:border-card-border-dark hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            hidden
            onChange={(e) =>
              e.target.files && handleFileChange(e.target.files[0])
            }
            id="upload-button"
          />
          <label
            htmlFor="upload-button"
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 z-10"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center space-y-2">
                <IconCloudUpload
                  className="mx-auto text-text-sub"
                  size={44}
                  stroke={1.5}
                />
                <div>
                  <h4 className="text-sm font-bold text-text-main dark:text-text-main-dark">
                    {isLoading ? "Validating Asset..." : "Click or Drag & Drop Banner"}
                  </h4>
                  <span className="text-[10px] font-mono text-text-sub dark:text-slate-500 block">
                    REQ: ~1400x628px (±150px) | MAX: 20MB
                  </span>
                </div>
              </div>
            )}
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {selectedFile ? (
              <div className="flex flex-col font-mono">
                <span className="text-xs font-bold text-text-main dark:text-text-main-dark">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Resolution: {imageResolution} OK
                </span>
              </div>
            ) : (
              <span className="text-xs text-text-sub dark:text-slate-500">
                No File Selected
              </span>
            )}
          </div>
          <Button
            type="primary"
            htmlType="submit"
            disabled={isLoading || !selectedFile}
            loading={isLoading}
            icon={<IconUpload size={16} />}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            Upload Asset
          </Button>
        </div>
      </form>
    </div>
  );
};

// ============ MAIN BANNER PAGE ============
const BannerPage = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const data = await getBannersAction();
      setBanners(data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBanners();
    }
  }, [currentUser]);

  const handleDelete = async (bannerId: string) => {
    try {
      await deleteBannerAction(bannerId);
      toast.success("ASSET DELETED");
      setBanners((prev) => prev.filter((b) => b.id !== bannerId));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <PageContainer title="Banner Assets">
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
                  Banner Assets
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {banners.length} Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Assets Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Spinner size="large" tip="Loading Banner Assets..." />
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-12 text-center rounded-2xl shadow-xs">
            <IconPhoto size={48} className="mx-auto text-text-sub mb-4" />
            <p className="text-text-sub text-sm font-semibold">No active banner assets found</p>
          </div>
        ) : (
          <Row gutter={[20, 20]}>
            {banners.map(
              (banner: { file?: string; fileName?: string; url: string; id: string }) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={banner.id || banner.url}>
                  <BannerCard banner={banner} onDelete={handleDelete} />
                </Col>
              ),
            )}
          </Row>
        )}

        {/* Upload Form Section */}
        <div className="space-y-3 pt-4 border-t border-card-border dark:border-card-border-dark">
          <h3 className="text-sm font-bold text-text-main dark:text-text-main-dark font-mono">
            Upload New Banner Asset
          </h3>
          <BannerForm
            onSuccess={(newBanner) =>
              setBanners((prev) => [newBanner, ...prev])
            }
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default BannerPage;

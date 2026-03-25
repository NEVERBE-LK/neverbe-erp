import React, { useEffect, useState } from "react";
import { Spin, Card, Button, Typography, Row, Col, Space } from "antd";
import { useAppSelector } from "@/lib/hooks";
import {
  getBannersAction,
  addBannerAction,
  deleteBannerAction,
} from "@/actions/settingActions";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import EmptyState from "@/components/EmptyState";
import { IconTrash, IconUpload, IconCloudUpload } from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";

const { Title, Text } = Typography;

// ============ BANNER CARD ============
const BannerCard = ({
  banner,
  onDelete,
}: {
  banner: { file: string; url: string; id: string };
  onDelete: (id: string) => void;
}) => {
  const { showConfirmation } = useConfirmationDialog();

  const handleDelete = () => {
    showConfirmation({
      title: "DELETE BANNER?",
      message: "This asset will be permanently removed.",
      variant: "danger",
      onSuccess: () => onDelete(banner.id),
    });
  };

  return (
    <Card
      hoverable
      cover={
        <div className="relative aspect-[1200/628] w-full overflow-hidden bg-gray-50">
          <img
            src={banner.url}
            alt="Banner Asset"
            className="w-full h-full object-cover"
          />
        </div>
      }
      actions={[
        <Button
          danger
          type="text"
          icon={<IconTrash size={16} />}
          onClick={handleDelete}
        >
          Delete Asset
        </Button>,
      ]}
      bodyStyle={{ padding: "12px 16px" }}
    >
      <Card.Meta
        title={
          <Text className="text-xs font-mono">
            {banner.file || "UNTITLED_ASSET"}
          </Text>
        }
      />
    </Card>
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
        if (img.width !== 1200 || img.height !== 628) {
          return reject("INVALID DIMENSIONS: REQUIRED 1200x628px");
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
      formData.append("path", "sliders");

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
    <Card className="shadow-sm">
      <form onSubmit={handleSubmit} className="w-full">
        <Space direction="vertical" size="large" className="w-full">
          <div
            className={`w-full aspect-[1200/628] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden transition-all group ${
              selectedFile
                ? "border-gray-200 bg-green-50/10"
                : "border-gray-200 hover:border-gray-200 hover:bg-gray-50/50"
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
                <div className="text-center space-y-3">
                  <IconCloudUpload
                    className="mx-auto text-green-600"
                    size={48}
                    stroke={1}
                  />
                  <div className="space-y-1">
                    <Title level={5} className="!m-0 text-gray-700">
                      {isLoading ? "Validating..." : "Click or Drag & Drop"}
                    </Title>
                    <Text type="secondary" className="block text-xs font-mono">
                      REQ: 1200x628px | MAX: 20MB
                    </Text>
                  </div>
                </div>
              )}
            </label>
          </div>

          <Row justify="space-between" align="middle" className="pt-2">
            <Col>
              {selectedFile ? (
                <Space direction="vertical" size={0}>
                  <Text strong>{selectedFile.name}</Text>
                  <Text type="success" className="text-xs font-mono">
                    Resolution: {imageResolution} OK
                  </Text>
                </Space>
              ) : (
                <Text type="secondary" className="text-xs">
                  No File Selected
                </Text>
              )}
            </Col>
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                disabled={isLoading || !selectedFile}
                loading={isLoading}
                icon={<IconUpload size={16} />}
                size="large"
              >
                Upload Asset
              </Button>
            </Col>
          </Row>
        </Space>
      </form>
    </Card>
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
    <PageContainer title="Banner Assets | NEVERBE ERP">
      <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <Card
          title={
            <Title level={4} className="!m-0">
              Active Assets{" "}
              <Text type="secondary" className="text-sm font-normal">
                ({banners.length})
              </Text>
            </Title>
          }
          className="shadow-sm"
        >
          {!isLoading && banners.length === 0 && (
            <EmptyState
              title="NO ASSETS FOUND"
              subtitle="Upload a banner below to initialize the slider."
            />
          )}

          {!isLoading && banners.length > 0 && (
            <Row gutter={[24, 24]}>
              {banners.map(
                (banner: { file: string; url: string; id: string }) => (
                  <Col
                    xs={24}
                    sm={12}
                    lg={8}
                    xl={6}
                    key={banner.id || banner.url}
                  >
                    <BannerCard banner={banner} onDelete={handleDelete} />
                  </Col>
                ),
              )}
            </Row>
          )}
        </Card>

        <div>
          <Title level={4} className="mb-4">
            Upload New Asset
          </Title>
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

import React, { useState, useRef } from "react";
import PageContainer from "../components/container/PageContainer";

import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { useNavigate } from "react-router-dom";
import {
  IconUser,
  IconMail,
  IconShieldLock,
  IconCalendar,
  IconCircleCheck,
  IconLogout,
  IconPencil,
  IconCamera,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import { logoutUserAction } from "@/actions/authActions";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  Modal,
  Button,
  Input,
  Form,
  Spin,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Divider,
} from "antd";

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showConfirmation } = useConfirmationDialog();

  // === LOCAL STATE ===
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!currentUser && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  // === HELPERS ===
  const formatDate = (date: any) => {
    return date || "N/A";
  };

  // === ACTIONS ===
  const openEditModal = () => {
    setEditName(currentUser?.username || "");
    setPreviewUrl(currentUser?.photoURL || null);
    setEditFile(null);
    setIsEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image too large (Max 20MB)");
        return;
      }
      setEditFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("username", editName);
      if (editFile) {
        formData.append("file", editFile);
      }

      await api.put(`/api/v1/erp/users/${currentUser?.userId}`, formData);

      toast.success("PROFILE UPDATED");
      setIsEditing(false);
    } catch (error: Error | unknown) {
      console.error(error);
      const e = error as any;
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUserAction();
      navigate("/");
      toast.success("LOGGED OUT SUCCESSFULLY");
    } catch (error) {
      toast.error("FAILED TO LOGOUT");
    }
  };

  const handleDeleteAccount = () => {
    showConfirmation({
      title: "DELETE THIS ACCOUNT?",
      message:
        "This action cannot be undone. All data will be permanently removed.",
      variant: "danger",
      confirmText: "DELETE ACCOUNT",
      onSuccess: async () => {
        try {
          setIsLoading(true);
          await api.delete(`/api/v1/erp/users/${currentUser?.userId}`);

          await logoutUserAction();
          navigate("/");
          toast.success("ACCOUNT DELETED");
        } catch (error: Error | unknown) {
          console.error(error);
          toast.error("Could not delete account");
          setIsLoading(false);
        }
      },
    });
  };

  const InfoCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <Card
      bordered
      size="small"
      className="hover:border-gray-200 transition-colors"
    >
      <Space align="start">
        <div className="p-2 border rounded bg-gray-50 text-gray-400">
          <Icon size={20} />
        </div>
        <div>
          <Text type="secondary" className="block text-xs">
            {label}
          </Text>
          <Text strong>{value}</Text>
        </div>
      </Space>
    </Card>
  );

  return (
    <PageContainer title="My Profile" loading={isLoading || !currentUser}>
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Account Settings
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                User Profile
              </h2>
            </div>
          </div>
          <Tag
            color="green"
            icon={<IconCircleCheck size={14} className="inline mr-1" />}
            className="h-8 flex items-center px-4 rounded-full font-bold"
          >
            {currentUser.status || "ACTIVE"}
          </Tag>
        </div>

        <div className="w-full max-w-6xl mx-auto pb-20">
          <Row gutter={[48, 48]}>
            {/* Left Column: Identity Card */}
            <Col xs={24} lg={8}>
              <Card className="text-center" bordered>
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 p-1 mx-auto">
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-green-600">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                          {currentUser.username?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Title level={3} className="!mb-1">
                  {currentUser.username || "Unknown User"}
                </Title>
                <Text type="secondary" className="block mb-8">
                  {currentUser.role || "Member"}
                </Text>

                <Space direction="vertical" className="w-full">
                  <Button
                    block
                    type="primary"
                    icon={<IconPencil size={16} />}
                    onClick={openEditModal}
                  >
                    Edit Details
                  </Button>
                  <Button
                    block
                    icon={<IconLogout size={16} />}
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </Space>
              </Card>
            </Col>

            {/* Right Column: Detailed Info */}
            <Col xs={24} lg={16}>
              <Title level={4} className="mb-6">
                Account Information
              </Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <InfoCard
                    icon={IconUser}
                    label="Display Name"
                    value={currentUser.username}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoCard
                    icon={IconMail}
                    label="Email Address"
                    value={currentUser.email}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoCard
                    icon={IconShieldLock}
                    label="Account Role"
                    value={currentUser.role}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoCard
                    icon={IconCalendar}
                    label="Member Since"
                    value={formatDate(currentUser.createdAt)}
                  />
                </Col>
              </Row>

              <Card className="mt-8 border-red-200 bg-red-50">
                <Space align="start">
                  <IconAlertTriangle className="text-red-600 mt-1" size={24} />
                  <div>
                    <Text strong type="danger" className="block mb-1">
                      Danger Zone
                    </Text>
                    <Text type="danger" className="block text-xs mb-4">
                      Permanently remove your account and all of its contents
                      from the platform. This action is not reversible.
                    </Text>
                    <Button
                      danger
                      size="small"
                      onClick={handleDeleteAccount}
                      loading={isLoading}
                    >
                      DELETE ACCOUNT
                    </Button>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Modal
            title="Edit Profile"
            open={isEditing}
            onCancel={() => setIsEditing(false)}
            onOk={handleUpdateProfile}
            confirmLoading={isLoading}
            okText="Save Changes"
          >
            <div className="flex flex-col items-center gap-4 mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-200 cursor-pointer overflow-hidden flex items-center justify-center group"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconCamera className="text-gray-300 group-hover:text-black" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconPencil className="text-white" size={20} />
                </div>
              </div>
              <Text type="secondary" className="text-xs">
                Click to change photo
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <Form layout="vertical">
              <Form.Item label="Display Name">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;

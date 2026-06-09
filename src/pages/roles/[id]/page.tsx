import {
  Spin,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Checkbox,
  Row,
  Col,
  Tag,
  Divider,
} from "antd";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Permission, Role } from "@/model/Role";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import {
  IconDeviceFloppy,
  IconSearch,
  IconShield,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconListCheck,
} from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";

const { Text, Title } = Typography;

const EditRolePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [roleId, setRoleId] = useState<string>(id || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();
  
  // Track selected permissions in a local state for real-time reactivity in summary panels
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      if (!id) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        const [permRes, roleRes] = await Promise.all([
          api.get("/api/v1/erp/users/roles"),
          api.get(`/api/v1/erp/users/roles/${id}`),
        ]);

        setPermissionsList(permRes.data.permissions || []);
        const roleData = roleRes.data as Role;

        const initialPerms = roleData.permissions || [];
        form.setFieldsValue({
          name: roleData.name,
          permissions: initialPerms,
        });
        setSelectedPermissions(initialPerms);
      } catch (e) {
        toast.error("Failed to load data");
        navigate("/roles");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, navigate, form]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        permissions: values.permissions || [],
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      const token = await auth.currentUser?.getIdToken();
      await api.put(`/api/v1/erp/users/roles/${roleId}`, formData);
      toast.success("Role updated successfully");
      navigate("/roles");
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  // Helper to check/uncheck a specific permission
  const handleTogglePermission = (permKey: string) => {
    const current = form.getFieldValue("permissions") || [];
    let updated: string[];
    if (current.includes(permKey)) {
      updated = current.filter((k: string) => k !== permKey);
    } else {
      updated = [...current, permKey];
    }
    form.setFieldsValue({ permissions: updated });
    setSelectedPermissions(updated);
  };

  // Select/Deselect all permissions in a specific group
  const handleToggleGroup = (groupName: string, permsInGroup: Permission[]) => {
    const current = form.getFieldValue("permissions") || [];
    const groupKeys = permsInGroup.map((p) => p.key);
    const allSelected = groupKeys.every((k) => current.includes(k));

    let updated: string[];
    if (allSelected) {
      // Remove all group keys
      updated = current.filter((k: string) => !groupKeys.includes(k));
    } else {
      // Add all group keys that are not already present
      updated = Array.from(new Set([...current, ...groupKeys]));
    }
    form.setFieldsValue({ permissions: updated });
    setSelectedPermissions(updated);
  };

  // Group and filter permissions
  const filteredPermissions = permissionsList.filter(
    (p) =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.group]) acc[perm.group] = [];
      acc[perm.group].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  // Group raw permissions list (unfiltered) for the sidebar count
  const allGroupedPermissions = permissionsList.reduce(
    (acc, perm) => {
      if (!acc[perm.group]) acc[perm.group] = [];
      acc[perm.group].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  if (loading) {
    return (
      <PageContainer title="Edit Role" description="Loading...">
        <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-3xl border border-gray-100">
          <Spin size="large" />
          <Text type="secondary" className="mt-4 font-bold text-gray-500 uppercase tracking-widest text-xs">
            Loading Role Configuration...
          </Text>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Role" description={`Editing role: ${roleId}`}>
      <div className="w-full max-w-7xl mx-auto py-2 space-y-6">
        {/* PREMIUM BACK HEADER */}
        <div>
          <Button
            type="link"
            onClick={() => navigate("/roles")}
            icon={<IconArrowLeft size={16} />}
            className="px-0 text-emerald-600 hover:text-emerald-700 mb-2 font-bold flex items-center gap-1.5"
          >
            Back to Roles
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-emerald-600 rounded-full" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                  Access Management
                </span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">
                  {roleId.replace(/_/g, " ")}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ permissions: [] }}
        >
          {/* Form hidden field to hold the actual permission keys array */}
          <Form.Item name="permissions" noStyle>
            <input type="hidden" />
          </Form.Item>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* LEFT COLUMN: Permission Matrix & Search */}
            <div className="lg:col-span-2 space-y-6">
              {/* SEARCH BAR */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <IconSearch size={20} className="text-gray-400" />
                <Input
                  placeholder="Search permissions by name, group, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="borderless"
                  className="w-full font-medium text-base placeholder-gray-400"
                  allowClear
                />
              </div>

              {/* PERMISSION GROUPS */}
              {Object.keys(groupedPermissions).length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
                  <IconShield size={40} className="text-gray-300 mx-auto" />
                  <p className="text-gray-500 font-bold uppercase tracking-wider text-xs">
                    No matching permissions found
                  </p>
                </div>
              ) : (
                Object.entries(groupedPermissions).map(([group, perms]) => {
                  const groupKeys = perms.map((p) => p.key);
                  const selectedGroupKeys = groupKeys.filter((k) =>
                    selectedPermissions.includes(k)
                  );
                  const isAllSelected = selectedGroupKeys.length === groupKeys.length;
                  const isSomeSelected = selectedGroupKeys.length > 0 && !isAllSelected;

                  return (
                    <Card
                      key={group}
                      bordered={false}
                      className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden [&_.ant-card-head]:border-b [&_.ant-card-head]:border-gray-50 [&_.ant-card-head]:bg-gray-50/50"
                      title={
                        <div className="flex items-center justify-between w-full py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                            <span className="text-sm font-extrabold uppercase tracking-wider text-gray-800">
                              {group.replace(/_/g, " ")}
                            </span>
                            <Tag color="emerald" className="font-bold text-[10px] ml-2">
                              {selectedGroupKeys.length} / {groupKeys.length} SELECTED
                            </Tag>
                          </div>
                          <Button
                            type="dashed"
                            size="small"
                            onClick={() => handleToggleGroup(group, perms)}
                            className={`rounded-lg text-xs font-bold ${
                              isAllSelected
                                ? "border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-300"
                                : "border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
                            }`}
                          >
                            {isAllSelected ? "Deselect All" : "Select All Group"}
                          </Button>
                        </div>
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {perms.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <div
                              key={perm.key}
                              onClick={() => handleTogglePermission(perm.key)}
                              className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 select-none ${
                                isChecked
                                  ? "border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/50"
                                  : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/20"
                              }`}
                            >
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-bold ${
                                      isChecked ? "text-emerald-950" : "text-gray-800"
                                    }`}
                                  >
                                    {perm.label}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono block uppercase tracking-wider">
                                  {perm.key}
                                </span>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  isChecked
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-gray-200 bg-white"
                                }`}
                              >
                                {isChecked && <IconCheck size={14} stroke={3.5} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* RIGHT COLUMN: Sticky Control & Stats Panel */}
            <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
              {/* ROLE SETTINGS */}
              <Card
                bordered={false}
                className="border border-gray-100 shadow-sm rounded-2xl"
                title={
                  <div className="flex items-center gap-2">
                    <IconShield size={18} className="text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Role Metadata
                    </span>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Role ID (Constant)
                    </span>
                    <span className="text-xs font-mono font-black uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-gray-500 inline-block">
                      {roleId}
                    </span>
                  </div>

                  <Form.Item
                    label={
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Display Name
                      </span>
                    }
                    name="name"
                    rules={[{ required: true, message: "Display name is required" }]}
                    className="mb-0"
                  >
                    <Input
                      placeholder="e.g. Supervisor"
                      size="large"
                      className="rounded-xl border-gray-200 font-bold"
                    />
                  </Form.Item>
                </div>
              </Card>

              {/* LIVE COUNTER STATS */}
              <Card
                bordered={false}
                className="border border-gray-100 shadow-sm rounded-2xl"
                title={
                  <div className="flex items-center gap-2">
                    <IconListCheck size={18} className="text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Selection Summary
                    </span>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="text-center py-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl">
                    <span className="text-3xl font-black text-emerald-950 leading-none">
                      {selectedPermissions.length}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 block mt-1 uppercase tracking-wider">
                      Selected / {permissionsList.length} Total
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {Object.entries(allGroupedPermissions).map(([group, perms]) => {
                      const groupKeys = perms.map((p) => p.key);
                      const selectedCount = groupKeys.filter((k) =>
                        selectedPermissions.includes(k)
                      ).length;

                      return (
                        <div
                          key={group}
                          className="flex justify-between items-center text-xs font-medium py-1"
                        >
                          <span className="text-gray-500 uppercase tracking-wide text-[10px] font-bold">
                            {group.replace(/_/g, " ")}
                          </span>
                          <span className="text-gray-800 font-mono font-bold">
                            {selectedCount} / {groupKeys.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Divider className="my-2 border-gray-100" />

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={saving}
                      icon={<IconDeviceFloppy size={18} />}
                      className="h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 border-none shadow-md shadow-emerald-500/20"
                    >
                      Save Role Settings
                    </Button>
                    <Button
                      size="large"
                      onClick={() => navigate("/roles")}
                      disabled={saving}
                      className="h-12 rounded-xl font-semibold border-gray-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
};

export default EditRolePage;

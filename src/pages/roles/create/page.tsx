import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Permission } from "@/model/Role";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import PageContainer from "../../components/container/PageContainer";
import {
  IconArrowLeft,
  IconShield,
  IconSearch,
  IconCheck,
  IconPlus,
  IconListCheck,
} from "@tabler/icons-react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Spin,
  Tag,
  Tabs,
  Badge,
} from "antd";

const { Text } = Typography;

const CreateRolePage = () => {
  const navigate = useNavigate();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("");
  const [form] = Form.useForm();
  
  // Track selected permissions in a local state for real-time reactivity in summary panels
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await api.get("/api/v1/erp/users/roles");
        const perms = res.data.permissions || [];
        setPermissionsList(perms);
        
        // Set first group as active tab
        if (perms.length > 0) {
          const uniqueGroups = Array.from(new Set(perms.map((p: Permission) => p.group)));
          if (uniqueGroups.length > 0) {
            setActiveTab(uniqueGroups[0] as string);
          }
        }
      } catch (error) {
        toast.error("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        id: values.id.replace(/\s+/g, "_").toLowerCase(),
        name: values.name,
        permissions: values.permissions || [],
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));

      const token = await auth.currentUser?.getIdToken();
      await api.post("/api/v1/erp/users/roles", formData);
      toast.success("Role created successfully");
      navigate("/roles");
    } catch (error) {
      toast.error("Failed to create role");
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

  const uniqueGroups = Array.from(new Set(permissionsList.map((p) => p.group)));

  if (loading) {
    return (
      <PageContainer title="Create Role" description="Loading...">
        <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-3xl border border-gray-100">
          <Spin size="large" />
          <Text type="secondary" className="mt-4 font-bold text-gray-500 uppercase tracking-widest text-xs">
            Loading System Permissions...
          </Text>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Create Role"
      description="Create a new role with permissions"
    >
      <div className="w-full mx-auto py-2 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-emerald-600 rounded-full" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                  Access Management
                </span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">
                  Create New Role
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-emerald-50/50 px-4 py-2.5 rounded-xl border border-emerald-100/50">
            <IconListCheck size={18} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              {selectedPermissions.length} / {permissionsList.length} Permissions Selected
            </span>
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

          <div className="space-y-6">
            {/* ROLE SETTINGS */}
            <Card
              bordered={false}
              className="border border-gray-100 shadow-sm rounded-2xl"
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Role ID
                      </span>
                    }
                    name="id"
                    rules={[{ required: true, message: "Role ID is required" }]}
                    help={<span className="text-[10px] text-gray-400 font-semibold uppercase">lowercase, no spaces, e.g. supervisor</span>}
                    className="mb-0"
                  >
                    <Input
                      placeholder="e.g. supervisor"
                      size="large"
                      className="rounded-xl border-gray-200 font-bold h-10"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
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
                      className="rounded-xl border-gray-200 font-bold h-10"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

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

            {/* FULL WIDTH TAB ASSIGNMENT MATRIX */}
            <Card
              bordered={false}
              className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden [&_.ant-card-body]:p-6"
            >
              {uniqueGroups.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <IconShield size={40} className="text-gray-300 mx-auto" />
                  <p className="text-gray-500 font-bold uppercase tracking-wider text-xs">
                    No permissions found
                  </p>
                </div>
              ) : (
                <Tabs
                  activeKey={activeTab}
                  onChange={(key) => setActiveTab(key)}
                  className="[&_.ant-tabs-nav]:!mb-6 [&_.ant-tabs-tab]:!pb-3 [&_.ant-tabs-tab-btn]:!font-black [&_.ant-tabs-tab-btn]:!text-xs [&_.ant-tabs-tab-btn]:!uppercase [&_.ant-tabs-tab-btn]:!tracking-wider"
                  items={uniqueGroups.map((group) => {
                    const perms = permissionsList.filter((p) => p.group === group);
                    const filteredPerms = groupedPermissions[group] || [];
                    
                    const groupKeys = perms.map((p) => p.key);
                    const selectedGroupKeys = groupKeys.filter((k) =>
                      selectedPermissions.includes(k)
                    );
                    const isAllSelected = selectedGroupKeys.length === groupKeys.length;

                    return {
                      key: group,
                      label: (
                        <div className="flex items-center gap-2">
                          <span>{group.replace(/_/g, " ")}</span>
                          <Badge
                            count={selectedGroupKeys.length}
                            showZero
                            className="[&_.ant-badge-count]:bg-emerald-600 [&_.ant-badge-count]:text-[10px] [&_.ant-badge-count]:font-bold"
                          />
                        </div>
                      ),
                      children: (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div>
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Group Actions
                              </span>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                                Toggle all permissions under {group.replace(/_/g, " ")}
                              </p>
                            </div>
                            <Button
                              type="dashed"
                              size="middle"
                              onClick={() => handleToggleGroup(group, perms)}
                              className={`rounded-xl px-5 font-bold ${
                                isAllSelected
                                  ? "border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 bg-amber-50/20"
                                  : "border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 bg-emerald-50/20"
                              }`}
                            >
                              {isAllSelected ? "Deselect All Group" : "Select All Group"}
                            </Button>
                          </div>

                          {filteredPerms.length === 0 ? (
                            <div className="text-center py-10">
                              <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">
                                No permissions matching "{searchTerm}" in this group
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {filteredPerms.map((perm) => {
                                const isChecked = selectedPermissions.includes(perm.key);
                                return (
                                  <div
                                    key={perm.key}
                                    onClick={() => handleTogglePermission(perm.key)}
                                    className={`p-4 border rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 select-none ${
                                      isChecked
                                        ? "border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/50"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/20"
                                    }`}
                                  >
                                    <div className="space-y-0.5 flex-1">
                                      <span
                                        className={`text-sm font-bold block ${
                                          isChecked ? "text-emerald-950" : "text-gray-800"
                                        }`}
                                      >
                                        {perm.label}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono block uppercase tracking-wider">
                                        {perm.key}
                                      </span>
                                    </div>
                                    <div
                                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
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
                          )}
                        </div>
                      ),
                    };
                  })}
                />
              )}
            </Card>

            {/* ACTION FOOTER */}
            <div className="flex justify-end gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <Button
                size="large"
                onClick={() => navigate("/roles")}
                disabled={saving}
                className="h-12 px-6 rounded-xl font-semibold border-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={saving}
                icon={<IconPlus size={18} />}
                className="h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 border-none shadow-md shadow-emerald-500/20"
              >
                Create Role
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
};

export default CreateRolePage;

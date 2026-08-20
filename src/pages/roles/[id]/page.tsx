import {
  Form,
  Input,
  Button,
  Switch,
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
  IconArrowLeft,
  IconChecklist,
  IconLock,
  IconFolder,
  IconShieldCheck,
  IconShieldLock,
} from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";
import Spinner from "../../components/shared/Spinner";

const EditRolePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [roleId, setRoleId] = useState<string>(id || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [form] = Form.useForm();
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      if (!id) return;

      try {
        await auth.currentUser?.getIdToken();
        const [permRes, roleRes] = await Promise.all([
          api.get("/api/v1/erp/users/roles"),
          api.get(`/api/v1/erp/users/roles/${id}`),
        ]);

        const perms = permRes.data.permissions || [];
        setPermissionsList(perms);
        
        if (perms.length > 0) {
          const uniqueGroups = Array.from(new Set(perms.map((p: Permission) => p.group)));
          if (uniqueGroups.length > 0) {
            setActiveGroup(uniqueGroups[0] as string);
          }
        }

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

      await auth.currentUser?.getIdToken();
      await api.put(`/api/v1/erp/users/roles/${roleId}`, formData);
      toast.success("Role updated successfully");
      navigate("/roles");
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

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

  const handleToggleGroup = (groupName: string, permsInGroup: Permission[]) => {
    const current = form.getFieldValue("permissions") || [];
    const groupKeys = permsInGroup.map((p) => p.key);
    const allSelected = groupKeys.every((k) => current.includes(k));

    let updated: string[];
    if (allSelected) {
      updated = current.filter((k: string) => !groupKeys.includes(k));
    } else {
      updated = Array.from(new Set([...current, ...groupKeys]));
    }
    form.setFieldsValue({ permissions: updated });
    setSelectedPermissions(updated);
  };

  const handleToggleAllSystem = () => {
    const allKeys = permissionsList.map((p) => p.key);
    const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedPermissions.includes(k));

    const updated = allSelected ? [] : allKeys;
    form.setFieldsValue({ permissions: updated });
    setSelectedPermissions(updated);
  };

  const filteredPermissions = permissionsList.filter(
    (p) =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueGroups = Array.from(new Set(permissionsList.map((p) => p.group)));

  const activeGroupPerms = permissionsList.filter((p) => p.group === activeGroup);
  const activeGroupFilteredPerms = filteredPermissions.filter((p) => p.group === activeGroup);
  const activeGroupSelectedKeys = activeGroupPerms
    .map((p) => p.key)
    .filter((k) => selectedPermissions.includes(k));
  const isActiveGroupAllSelected =
    activeGroupPerms.length > 0 && activeGroupSelectedKeys.length === activeGroupPerms.length;

  if (loading) {
    return (
      <PageContainer title="Edit Role">
        <div className="flex justify-center items-center py-32">
          <Spinner size="large" tip="Loading Role Configuration..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Edit Role: ${roleId}`}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ permissions: [] }}
        className="w-full space-y-6"
      >
        <Form.Item name="permissions" noStyle>
          <input type="hidden" />
        </Form.Item>

        {/* INTEGRATED EXECUTIVE PAGE HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-1 h-10 bg-slate-900 dark:bg-slate-100 rounded-full shrink-0" />
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 block">
                  Security Administration
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub border border-card-border dark:border-card-border-dark font-mono flex items-center gap-1">
                  <IconLock size={10} /> {roleId}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Form.Item
                  name="name"
                  rules={[{ required: true, message: "Role name is required" }]}
                  className="!mb-0 flex-1 max-w-md"
                >
                  <Input
                    placeholder="Enter Role Display Name..."
                    className="h-10 text-lg font-bold text-text-main dark:text-text-main-dark border-card-border dark:border-card-border-dark rounded-xl px-3 font-sans"
                  />
                </Form.Item>
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono shrink-0 hidden sm:inline-block">
                  {selectedPermissions.length} / {permissionsList.length} System Permissions Allowed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate("/roles")}
              disabled={saving}
              className="h-10 px-4 rounded-xl text-xs font-semibold border-card-border dark:border-card-border-dark text-text-sub cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={saving}
              icon={<IconDeviceFloppy size={16} />}
              className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* BALANCED 2-COLUMN SINGLE-DOMAIN WORKSPACE (lg:col-span-3 & lg:col-span-9) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-mono">
          {/* LEFT SIDEBAR: COMPACT DOMAINS MENU (lg:col-span-3) */}
          <div className="lg:col-span-3 bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-3 shadow-xs space-y-1 flex flex-col justify-between">
            <div>
              <div className="px-3 py-2 border-b border-card-border dark:border-card-border-dark mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub">
                  Domains ({uniqueGroups.length})
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPermissions.length} Active
                </span>
              </div>

              <div className="space-y-1">
                {uniqueGroups.map((group) => {
                  const perms = permissionsList.filter((p) => p.group === group);
                  const selectedCount = perms.filter((p) => selectedPermissions.includes(p.key)).length;
                  const isActive = activeGroup === group;
                  const percent = perms.length > 0 ? Math.round((selectedCount / perms.length) * 100) : 0;

                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setActiveGroup(group)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs"
                          : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-text-main dark:text-text-main-dark border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <IconFolder size={15} className={isActive ? "text-white dark:text-slate-900" : "text-text-sub"} />
                          <span className="font-bold text-xs uppercase tracking-wider truncate">
                            {group.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-800"
                              : selectedCount > 0
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60"
                              : "bg-slate-100 dark:bg-slate-800 text-text-sub"
                          }`}
                        >
                          {selectedCount}/{perms.length}
                        </span>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700/50 h-1 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isActive
                              ? "bg-emerald-400 dark:bg-emerald-600"
                              : percent === 100
                              ? "bg-emerald-500"
                              : "bg-slate-400 dark:bg-slate-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT MAIN PANEL: ACTIVE DOMAIN MATRIX (lg:col-span-9) */}
          <div className="lg:col-span-9 bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Active Domain Hero Header Card with Embedded Search Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-card-border dark:border-card-border-dark space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl">
                      <IconShieldCheck size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub">
                          Domain Matrix
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                          {activeGroupSelectedKeys.length} / {activeGroupPerms.length} Active
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-text-main dark:text-text-main-dark tracking-tight uppercase mt-0.5">
                        {activeGroup.replace(/_/g, " ")}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleToggleGroup(activeGroup, activeGroupPerms)}
                      className="h-9 px-3.5 rounded-xl border-card-border dark:border-card-border-dark text-text-main dark:text-text-main-dark text-xs font-bold cursor-pointer font-mono"
                    >
                      {isActiveGroupAllSelected ? "Deselect Group" : "Select Group"}
                    </Button>

                    <Button
                      type="default"
                      onClick={handleToggleAllSystem}
                      icon={<IconChecklist size={16} />}
                      className="h-9 px-3.5 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-bold cursor-pointer font-mono whitespace-nowrap"
                    >
                      {permissionsList.length > 0 && selectedPermissions.length === permissionsList.length
                        ? "Deselect System"
                        : "Select System"}
                    </Button>
                  </div>
                </div>

                {/* Embedded Search Input */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-card-border dark:border-card-border-dark">
                  <IconSearch size={16} className="text-text-sub shrink-0" />
                  <Input
                    placeholder={`Filter permissions in ${activeGroup.replace(/_/g, " ")} by keyword (e.g. view, create, edit)...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="borderless"
                    className="w-full text-xs font-medium placeholder-text-sub text-text-main dark:text-text-main-dark p-0"
                    allowClear
                  />
                </div>
              </div>

              {/* Richer Permission Cards Grid (3 Columns) */}
              {activeGroupFilteredPerms.length === 0 ? (
                <div className="text-center py-20 space-y-2">
                  <IconShieldLock size={40} className="text-text-sub mx-auto" />
                  <p className="text-text-sub font-bold text-xs">
                    No permissions match "{searchTerm}" in {activeGroup.replace(/_/g, " ")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeGroupFilteredPerms.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.key);

                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 select-none h-32 ${
                          isChecked
                            ? "border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs"
                            : "border-card-border dark:border-card-border-dark bg-slate-50/40 dark:bg-slate-800/20 hover:border-slate-400 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-text-main dark:text-text-main-dark font-sans leading-snug">
                            {perm.label}
                          </span>
                          <Switch
                            checked={isChecked}
                            size="small"
                            onChange={() => handleTogglePermission(perm.key)}
                          />
                        </div>

                        <div className="pt-2 border-t border-card-border/60 dark:border-card-border-dark/60 flex items-center justify-between">
                          <span className="text-[10px] text-text-sub dark:text-slate-400 font-mono truncate">
                            {perm.key}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isChecked
                                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                                : "bg-slate-200 dark:bg-slate-700 text-text-sub"
                            }`}
                          >
                            {isChecked ? "Granted" : "Restricted"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Form>
    </PageContainer>
  );
};

export default EditRolePage;

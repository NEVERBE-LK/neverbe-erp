import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Role } from "@/model/Role";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import PageContainer from "../components/container/PageContainer";
import Spinner from "../components/shared/Spinner";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconShield,
  IconShieldLock,
  IconSearch,
  IconUserCheck,
  IconLock,
  IconX,
} from "@tabler/icons-react";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import { Table, Button, Dropdown, Input, Tag } from "antd";
import type { MenuProps } from "antd";

type RoleWithPermissions = Role & { permissions: string[] };

const RolesPage = () => {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SYSTEM" | "CUSTOM">("ALL");
  const navigate = useNavigate();
  const { showConfirmation } = useConfirmationDialog();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      await auth.currentUser?.getIdToken();
      const response = await api.get("/api/v1/erp/users/roles");
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    showConfirmation({
      title: "Delete Security Role?",
      message: `Are you sure you want to delete role "${name}"? Users assigned to this role will lose their access permissions.`,
      confirmText: "Delete Role",
      cancelText: "Cancel",
      variant: "danger",
      onSuccess: async () => {
        setDeleting(id);
        try {
          await auth.currentUser?.getIdToken();
          await api.delete(`/api/v1/erp/users/roles/${id}`);
          toast.success("Role deleted successfully");
          fetchRoles();
        } catch (e) {
          toast.error("Failed to delete role");
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("ALL");
  };

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "SYSTEM") return matchesSearch && role.isSystem;
    if (filterType === "CUSTOM") return matchesSearch && !role.isSystem;
    return matchesSearch;
  });

  const systemCount = roles.filter((r) => r.isSystem).length;
  const customCount = roles.filter((r) => !r.isSystem).length;

  const columns = [
    {
      title: "Security Role",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: RoleWithPermissions) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              record.isSystem
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40"
            }`}
          >
            {record.isSystem ? <IconShieldLock size={18} /> : <IconShield size={18} />}
          </div>
          <div>
            <span className="font-semibold text-xs text-text-main dark:text-text-main-dark block leading-snug">
              {text}
            </span>
            <span className="text-[10px] font-mono text-text-sub dark:text-slate-400 block mt-0.5">
              {record.isSystem ? "System Core Role" : "Custom User Role"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Role Identifier",
      dataIndex: "id",
      key: "id",
      render: (text: string) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-card-border dark:border-card-border-dark">
          <IconLock size={12} className="text-text-sub" />
          {text}
        </span>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_: any, record: RoleWithPermissions) => (
        <span
          className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full font-mono ${
            record.isSystem
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
          }`}
        >
          {record.isSystem ? "SYSTEM BUILT-IN" : "CUSTOM ROLE"}
        </span>
      ),
    },
    {
      title: "Granted Access",
      key: "permissions",
      render: (_: any, record: RoleWithPermissions) => {
        const count = record.permissions.length;

        return (
          <div className="space-y-1 font-mono max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-main dark:text-text-main-dark">
                {count} Permissions
              </span>
              <span className="text-[10px] text-text-sub">Granted</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {record.permissions.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 text-[9px] font-medium rounded-md bg-slate-50 dark:bg-slate-800/60 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark"
                >
                  {p}
                </span>
              ))}
              {count > 3 && (
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                  +{count - 3} MORE
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right" as const,
      render: (_: any, record: RoleWithPermissions) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Role & Permissions",
            onClick: () => navigate(`/roles/${record.id}`),
          },
          ...(!record.isSystem
            ? [
                {
                  type: "divider" as const,
                },
                {
                  key: "delete",
                  icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
                  label: <span className="font-semibold text-rose-600 dark:text-rose-400">Delete Role</span>,
                  onClick: () => handleDelete(record.id, record.name),
                },
              ]
            : []),
        ];

        return (
          <div className="flex justify-end">
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border-none bg-transparent"
              >
                <IconDotsVertical size={16} />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer title="Roles & Permissions">
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Security Administration
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  Roles & Permissions
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {roles.length} Total Roles
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={() => navigate("/roles/create")}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            New Security Role
          </Button>
        </div>

        {/* Filter & Search Bar Strip */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-card-border dark:border-card-border-dark flex-1 w-full">
            <IconSearch size={16} className="text-text-sub shrink-0" />
            <Input
              placeholder="Search security roles by name or role identifier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="borderless"
              className="w-full text-xs font-medium placeholder-text-sub text-text-main dark:text-text-main-dark p-0"
              allowClear
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all border ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-text-sub border-card-border dark:border-card-border-dark"
              }`}
            >
              All ({roles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("SYSTEM")}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all border ${
                filterType === "SYSTEM"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-text-sub border-card-border dark:border-card-border-dark"
              }`}
            >
              System ({systemCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("CUSTOM")}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all border ${
                filterType === "CUSTOM"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-text-sub border-card-border dark:border-card-border-dark"
              }`}
            >
              Custom ({customCount})
            </button>

            {(searchTerm || filterType !== "ALL") && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-card-border dark:border-card-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-text-sub text-[11px] font-medium transition-all cursor-pointer font-mono ml-1"
              >
                <IconX size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center items-center">
              <Spinner size="large" tip="Loading Security Roles..." />
            </div>
          ) : (
            <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
              <Table
                scroll={{ x: 800 }}
                columns={columns}
                dataSource={filteredRoles}
                rowKey="id"
                pagination={false}
                locale={{
                  emptyText: (
                    <div className="py-16 text-center space-y-2">
                      <IconShieldLock size={36} className="text-text-sub mx-auto" />
                      <p className="text-xs font-bold text-text-sub font-mono">
                        No security roles match your filter criteria
                      </p>
                    </div>
                  ),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default RolesPage;

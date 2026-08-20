import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  IconPlus,
  IconDownload,
  IconFilter,
  IconSearch,
  IconX,
  IconEdit,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";
import { useAppSelector } from "@/lib/hooks";
import { User } from "@/model/User";
import { Role } from "@/model/Role";
import PageContainer from "../components/container/PageContainer";
import {
  getUsersV2Action,
  addNewUserAction,
  updateUserByIdAction,
  deleteUserByIdAction,
} from "@/actions/usersActions";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import ERPCredentialVerifyAndRequestAuthorizeForm from "@/components/ERPCredentialVerifyAndRequestAuthorizeForm";
import * as XLSX from "xlsx";
import { usePermission } from "@/hooks/usePermission";
import { auth } from "@/firebase/firebaseClient";
import { RootState } from "@/lib/store";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Row,
  Col,
  Switch,
  Dropdown,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { formatSLDate, dayjs } from "@/utils/dateUtils";

const { Option } = Select;

// ============ USER FORM MODAL ============
const UserForm = ({
  visible,
  onClose,
  user,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser: usr } = useAppSelector(
    (state: RootState) => state.authSlice,
  );
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (usr && visible) fetchRoles();
  }, [visible, usr]);

  useEffect(() => {
    if (visible) {
      if (user) {
        form.setFieldsValue({
          userId: user.userId,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          status: user.status ? "Active" : "Inactive",
          role: user.role,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          userId: "Auto Generated",
          status: "Active",
          role: "user",
        });
      }
    }
  }, [visible, user]);

  const fetchRoles = async () => {
    try {
      await auth.currentUser?.getIdToken();
      const res = await api.get("/api/v1/erp/users/roles");
      setRoles(res.data.roles || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);

      const usr: User = {
        userId: values.userId === "Auto Generated" ? "" : values.userId,
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        status: values.status === "Active",
        role: values.role,
        createdAt: user?.createdAt || dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
      };

      if (values.userId === "Auto Generated") {
        await addNewUserAction({ ...usr, userId: values.userId });
        toast.success("USER CREATED");
      } else {
        await updateUserByIdAction(usr);
        toast.success("USER UPDATED");
      }

      setTimeout(() => onSuccess(), 1500);
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="font-bold text-sm text-text-main dark:text-text-main-dark font-mono">
          {user ? "Modify User Account" : "New User Account"}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="py-2 space-y-3 font-mono text-xs">
        <Form.Item label="User ID" name="userId" className="!mb-3">
          <Input disabled className="bg-slate-100 dark:bg-slate-800 text-text-sub h-10 rounded-xl font-mono text-xs" />
        </Form.Item>
        <Form.Item
          label="Full Name"
          name="username"
          rules={[{ required: true, message: "Please enter name" }]}
          className="!mb-3"
        >
          <Input placeholder="Enter Name..." className="h-10 rounded-xl text-xs" />
        </Form.Item>
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: "Please enter email", type: "email" },
          ]}
          className="!mb-3"
        >
          <Input placeholder="Enter Email..." disabled={!!user} className="h-10 rounded-xl text-xs" />
        </Form.Item>
        <Form.Item
          label="Phone Number"
          name="phoneNumber"
          rules={[
            { required: true, message: "Please enter phone number" },
            { pattern: /^\+?[0-9]{10,15}$/, message: "Please enter a valid phone number (e.g. +94771234567)" }
          ]}
          className="!mb-3"
        >
          <Input placeholder="Enter Phone Number..." className="h-10 rounded-xl text-xs" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Account Status" name="status" className="!mb-3">
              <Select className="h-10">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Access Role" name="role" className="!mb-3">
              <Select className="h-10">
                {roles.map((r) => (
                  <Option key={r.id} value={r.id}>
                    {r.name.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <div className="flex justify-end gap-2 pt-3 border-t border-card-border dark:border-card-border-dark">
          <Button onClick={onClose} disabled={isLoading} className="h-10 px-4 rounded-xl text-xs font-semibold">
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading} className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 border-none h-10 px-6 rounded-xl font-bold text-xs">
            {user ? "Save Changes" : "Create Account"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ============ MAIN USERS PAGE ============
const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });
  const [showAnonymous, setShowAnonymous] = useState(false);

  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [authFormOpen, setAuthFormOpen] = useState(false);
  const [authSuccessCallback, setAuthSuccessCallback] = useState<(() => void) | null>(null);

  const { currentUser } = useAppSelector((state) => state.authSlice);
  const canManageUsers = usePermission("manage_users");
  const { showConfirmation } = useConfirmationDialog();
  const [form] = Form.useForm();

  const executeWithPermission = (callback: () => void) => {
    if (canManageUsers) {
      callback();
    } else {
      setAuthSuccessCallback(() => callback);
      setAuthFormOpen(true);
    }
  };

  const fetchUsers = useCallback(
    async (params?: { page?: number; size?: number }) => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const response = await getUsersV2Action({
          page: params?.page ?? pagination.current,
          size: params?.size ?? pagination.pageSize,
          search: filters.search,
          role: filters.role,
          status: filters.status,
        });
        setUsers(response.users);
        setPagination((prev) => ({
          ...prev,
          total: response.total,
          current: params?.page ?? prev.current,
          pageSize: params?.size ?? prev.pageSize,
        }));
      } catch (e: any) {
        console.error(e);
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    },
    [
      currentUser,
      pagination.current,
      pagination.pageSize,
      filters.search,
      filters.role,
      filters.status,
    ],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterSubmit = (values: any) => {
    setFilters(values);
    setLoading(true);
    getUsersV2Action({
      page: 1,
      size: pagination.pageSize,
      search: values.search || "",
      role: values.role,
      status: values.status,
    })
      .then((res) => {
        setUsers(res.users);
        setPagination((prev) => ({ ...prev, total: res.total, current: 1 }));
        setLoading(false);
      })
      .catch((e) => {
        toast.error(e.message);
        setLoading(false);
      });
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({ search: "", role: "all", status: "all" });
    setPagination((prev) => ({ ...prev, current: 1 }));
    getUsersV2Action({
      page: 1,
      size: pagination.pageSize,
      search: "",
      role: "all",
      status: "all",
    }).then((res) => {
      setUsers(res.users);
      setPagination((prev) => ({ ...prev, total: res.total, current: 1 }));
      setLoading(false);
    });
  };

  const handleTableChange = (newPagination: any) => {
    fetchUsers({ page: newPagination.current, size: newPagination.pageSize });
  };

  const handleDelete = async (userId: string) => {
    showConfirmation({
      title: "Delete User Account?",
      message: "This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete Account",
      onSuccess: async () => {
        try {
          await deleteUserByIdAction(userId);
          toast.success("USER DELETED");
          setTimeout(() => fetchUsers(), 1500);
        } catch (e: any) {
          toast.error(e.message);
        }
      },
    });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const isAnonymousUser = (u: User) =>
    u.role === "Pending" || u.email?.includes("anonymous") || !u.email;

  const displayedUsers = showAnonymous
    ? users.filter(isAnonymousUser)
    : users.filter((u) => !isAnonymousUser(u));

  const handleRowExport = (user: User) => {
    const exportData = [
      {
        "User ID": user.userId,
        Username: user.username,
        Email: user.email,
        Status: user.status ? "Active" : "Inactive",
        Role: user.role,
        "Created At": user.createdAt,
        "Updated At": user.updatedAt,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User");
    XLSX.writeFile(
      wb,
      `user_${user.username.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("EXPORT COMPLETE");
  };

  const columns: ColumnsType<User> = [
    {
      title: "User Details",
      key: "details",
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-text-main dark:text-text-main-dark">{record.username}</span>
          <span className="text-xs text-text-sub dark:text-slate-400">{record.email}</span>
          {record.phoneNumber && (
            <span className="text-xs text-text-sub dark:text-slate-500 font-mono">{record.phoneNumber}</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      align: "center",
      render: (_, record) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono ${
            record.status
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-card-border dark:border-card-border-dark"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              record.status ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {record.status ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      title: "Role",
      key: "role",
      align: "center",
      render: (_, record) => (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-card-border dark:border-card-border-dark font-mono">
          {record.role}
        </span>
      ),
    },
    {
      title: "Joined",
      key: "joined",
      align: "center",
      render: (_, record) => (
        <span className="text-xs font-mono text-text-sub dark:text-slate-400">
          {formatSLDate(record.createdAt)}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      align: "right",
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <IconEdit size={14} />,
            label: "Edit Account",
            onClick: () => executeWithPermission(() => handleEdit(record)),
          },
          {
            key: "export",
            icon: <IconDownload size={14} />,
            label: "Export User Data",
            onClick: () => handleRowExport(record),
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            icon: <IconTrash size={14} className="text-rose-600 dark:text-rose-400" />,
            label: <span className="font-semibold text-rose-600 dark:text-rose-400">Delete Account</span>,
            onClick: () => executeWithPermission(() => handleDelete(record.userId)),
          },
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
    <PageContainer title="Users">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                System Administration
              </span>
              <div className="flex items-center gap-2 font-mono">
                <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                  User Accounts
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-400 border border-card-border dark:border-card-border-dark">
                  {pagination.total} Accounts
                </span>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={() => {
              executeWithPermission(() => {
                setSelectedUser(null);
                setShowUserForm(true);
              });
            }}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
          >
            New User
          </Button>
        </div>

        {/* Filter Panel */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-xl p-4">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ role: "all", status: "all" }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-text-sub" />}
                placeholder="Search by name or email..."
                allowClear
                className="rounded-xl h-10"
              />
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-36">
              <Select className="h-10">
                <Option value="all">All Status</Option>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item name="role" className="!mb-0 w-36">
              <Select className="h-10">
                <Option value="all">All Roles</Option>
                <Option value="ADMIN">ADMIN</Option>
                <Option value="USER">USER</Option>
              </Select>
            </Form.Item>
            <Form.Item className="!mb-0">
              <div className="flex items-center h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-card-border dark:border-card-border-dark gap-2">
                <Switch
                  checked={showAnonymous}
                  onChange={setShowAnonymous}
                  size="small"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub font-mono whitespace-nowrap">
                  {showAnonymous ? "Anonymous" : "Registered"}
                </span>
              </div>
            </Form.Item>
            <Form.Item className="!mb-0">
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                  className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={15} />}
                  onClick={handleReset}
                  className="h-10 px-4 rounded-xl border-card-border dark:border-card-border-dark text-text-sub text-xs font-medium cursor-pointer"
                >
                  Clear
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>

        {/* Table Container */}
        <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark rounded-2xl shadow-xs overflow-hidden">
          <div className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead>tr>th]:!bg-slate-50/80 [&_.ant-table-thead>tr>th]:dark:!bg-slate-800/60 [&_.ant-table-thead>tr>th]:!text-text-sub [&_.ant-table-thead>tr>th]:!font-bold [&_.ant-table-thead>tr>th]:!text-[11px] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-b [&_.ant-table-thead>tr>th]:!border-card-border [&_.ant-table-thead>tr>th]:dark:!border-card-border-dark [&_.ant-table-tbody>tr]:hover:!bg-slate-50/60 [&_.ant-table-tbody>tr]:dark:hover:!bg-slate-800/40 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-card-border [&_.ant-table-tbody>tr>td]:dark:!border-card-border-dark [&_.ant-table-tbody>tr>td]:!py-3.5">
            <Table
              scroll={{ x: 800 }}
              columns={columns}
              dataSource={displayedUsers}
              rowKey="userId"
              pagination={{ ...pagination, position: ["bottomRight"] }}
              loading={loading}
              onChange={handleTableChange}
            />
          </div>
        </div>
      </div>

      <UserForm
        visible={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => fetchUsers()}
      />

      <ERPCredentialVerifyAndRequestAuthorizeForm
        open={authFormOpen}
        requiredPermission="manage_users"
        onCancel={() => {
          setAuthFormOpen(false);
          setAuthSuccessCallback(null);
        }}
        onSuccess={() => {
          setAuthFormOpen(false);
          if (authSuccessCallback) {
            authSuccessCallback();
            setAuthSuccessCallback(null);
          }
        }}
      />
    </PageContainer>
  );
};

export default UsersPage;

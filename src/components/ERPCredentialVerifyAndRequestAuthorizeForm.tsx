import React, { useState, useEffect } from "react";
import { Modal, Input, Button } from "antd";
import { IconLock, IconUser } from "@tabler/icons-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ERPCredentialVerifyAndRequestAuthorizeFormProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  requiredPermission?: string;
}

export default function ERPCredentialVerifyAndRequestAuthorizeForm({
  open,
  onCancel,
  onSuccess,
  title = "Verify Credentials",
  description = "Please enter credentials of a user with required permissions to authorize this action.",
  requiredPermission,
}: ERPCredentialVerifyAndRequestAuthorizeFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
    }
  }, [open]);

  const handleVerify = async () => {
    if (!username) {
      toast.error("Please enter username or email");
      return;
    }
    if (!password) {
      toast.error("Please enter password");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/v1/erp/auth/verify", {
        username,
        password,
        requiredPermission,
      });

      if (response.data && response.data.success) {
        toast.success("Verification successful!");
        setPassword("");
        onSuccess();
      } else {
        throw new Error(response.data?.message || "Verification failed");
      }
    } catch (error: any) {
      console.error("Verification failed:", error);
      const friendlyMsg = error.response?.data?.message || error.message || "Verification failed.";
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        setPassword("");
        onCancel();
      }}
      footer={null}
      width={400}
      title={null}
      zIndex={3000}
      className="[&_.ant-modal-content]:!rounded-3xl [&_.ant-modal-content]:!p-0 overflow-hidden"
    >
      <div className="border-b border-gray-100 bg-gray-50/50 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <IconLock size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Access Authorization Required
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600 font-medium">
          {description}
        </p>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
            Username or Email
          </label>
          <Input
            size="large"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin or admin@neverbe.com"
            prefix={<IconUser size={18} className="text-gray-400 mr-2" />}
            className="h-12 rounded-xl border-gray-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
            Password
          </label>
          <Input.Password
            size="large"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-xl border-gray-200"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVerify();
            }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-50">
          <Button
            onClick={() => {
              setPassword("");
              onCancel();
            }}
            className="h-12 px-6 rounded-xl hover:bg-gray-100 border-transparent text-gray-600 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleVerify}
            className="h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 border-none shadow-md shadow-emerald-500/20"
          >
            Authorize
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconMail,
  IconPhone,
  IconLock,
  IconKey,
  IconArrowLeft,
  IconRobot,
  IconCheck,
  IconDeviceMobile,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Card, Form, Input, Button, Typography, Steps } from "antd";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [step, setStep] = useState<"request" | "verify_email" | "verify_phone" | "success">("request");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [form] = Form.useForm();

  const handleRequestOTP = async (values: any) => {
    if (!isVerified) {
      toast.error("Please complete human verification.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/api/v1/erp/auth/reset-password/request", {
        email: values.email,
        phoneNumber: values.phoneNumber,
      });
      if (res.data.success) {
        setEmail(values.email);
        setPhoneNumber(values.phoneNumber);
        toast.success("Verification code sent to your email!");
        setStep("verify_email");
      } else {
        toast.error(res.data.message || "Failed to send code.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || e.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (values: any) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/v1/erp/auth/reset-password/verify-email", {
        email,
        otp: values.emailOtp,
      });
      if (res.data.success) {
        toast.success("Email code verified! SMS code sent to your phone.");
        setStep("verify_phone");
      } else {
        toast.error(res.data.message || "Invalid email verification code.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || e.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/api/v1/erp/auth/reset-password/reset", {
        email,
        phoneNumber,
        phoneOtp: values.phoneOtp,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      if (res.data.success) {
        toast.success("Password reset completed successfully!");
        setStep("success");
      } else {
        toast.error(res.data.message || "Reset failed.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || e.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepIndex = () => {
    if (step === "request") return 0;
    if (step === "verify_email") return 1;
    if (step === "verify_phone") return 2;
    return 3;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <figure className="mb-4">
            <img src="/logo.png" alt="Logo" className="w-28 h-28" />
          </figure>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Reset Access
          </h2>
          <p className="mt-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-widest">
            Two-Step Identity Verification
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card
          className="bg-white py-10 px-4 shadow-xl shadow-green-900/5 sm:rounded-3xl border border-gray-100"
          style={{ borderRadius: "1rem" }}
        >
          <div className="mb-8">
            <Steps
              current={currentStepIndex()}
              size="small"
              items={[
                { title: "Identify" },
                { title: "Email OTP" },
                { title: "SMS OTP" },
              ]}
              className="px-2"
            />
          </div>

          {step === "request" && (
            <Form
              layout="vertical"
              onFinish={handleRequestOTP}
              size="large"
              requiredMark={false}
              className="space-y-6"
            >
              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Registered Email
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: "Please enter your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input
                  prefix={<IconMail size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="admin@neverbe.com"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Registered Phone Number
                  </span>
                }
                name="phoneNumber"
                rules={[
                  { required: true, message: "Please enter your phone number!" },
                  { pattern: /^\+?[0-9]{10,15}$/, message: "Please enter a valid phone number (e.g. +94771234567)" }
                ]}
              >
                <Input
                  prefix={<IconPhone size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="+94771234567"
                />
              </Form.Item>

              {/* Human Verification */}
              <div
                onClick={() => setIsVerified(!isVerified)}
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all mb-0! ${
                  isVerified
                    ? "border-gray-200 bg-green-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 border rounded-md flex items-center justify-center ${isVerified ? "bg-green-600 border-gray-200" : "border-gray-300 bg-white"}`}
                  >
                    {isVerified && (
                      <IconCheck size={16} className="text-white" stroke={3} />
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold uppercase tracking-wide ${isVerified ? "text-green-700" : "text-gray-700"}`}
                  >
                    Human Verification
                  </span>
                </div>
                <IconRobot
                  size={24}
                  className={isVerified ? "text-green-600" : "text-gray-400"}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                  disabled={!isVerified}
                  className="btn-fluid-primary"
                >
                  Send Verification Code
                </Button>
              </div>
            </Form>
          )}

          {step === "verify_email" && (
            <Form
              layout="vertical"
              onFinish={handleVerifyEmail}
              size="large"
              requiredMark={false}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <Text type="secondary" className="text-sm">
                  We've sent a 6-digit confirmation code to <strong className="text-gray-900">{email}</strong>. Please enter it below.
                </Text>
              </div>

              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Email Verification Code
                  </span>
                }
                name="emailOtp"
                rules={[
                  { required: true, message: "Please enter the 6-digit OTP!" },
                  { len: 6, message: "Verification code must be 6 digits!" }
                ]}
              >
                <Input
                  prefix={<IconKey size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-center text-lg font-bold"
                  placeholder="000000"
                  maxLength={6}
                />
              </Form.Item>

              <div className="pt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                  className="btn-fluid-primary"
                >
                  Verify Email Code
                </Button>
              </div>
            </Form>
          )}

          {step === "verify_phone" && (
            <Form
              layout="vertical"
              onFinish={handleResetPassword}
              size="large"
              requiredMark={false}
              className="space-y-5"
            >
              <div className="text-center mb-4">
                <Text type="secondary" className="text-sm">
                  SMS code sent to <strong className="text-gray-900">{phoneNumber.slice(0, -4) + "****"}</strong>. Enter the SMS code and choose your new password.
                </Text>
              </div>

              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    SMS Verification Code
                  </span>
                }
                name="phoneOtp"
                rules={[
                  { required: true, message: "Please enter the SMS code!" },
                  { len: 6, message: "SMS code must be 6 digits!" }
                ]}
              >
                <Input
                  prefix={<IconDeviceMobile size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-center text-lg font-bold"
                  placeholder="000000"
                  maxLength={6}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    New Password
                  </span>
                }
                name="password"
                rules={[
                  { required: true, message: "Please enter your new password!" },
                  { min: 6, message: "Password must be at least 6 characters!" }
                ]}
              >
                <Input.Password
                  prefix={<IconLock size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="New Password"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Confirm New Password
                  </span>
                }
                name="confirmPassword"
                rules={[
                  { required: true, message: "Please confirm your new password!" }
                ]}
              >
                <Input.Password
                  prefix={<IconLock size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="Confirm Password"
                />
              </Form.Item>

              <div className="pt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                  className="btn-fluid-primary"
                >
                  Reset Password & Activate
                </Button>
              </div>
            </Form>
          )}

          {step === "success" && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <IconCheck size={40} stroke={3} />
              </div>
              <div className="space-y-2">
                <Title level={3} className="mb-0!">
                  Password Updated
                </Title>
                <Text type="secondary" className="block text-sm">
                  Your new credentials are now active. You can log in with your new password.
                </Text>
              </div>
              <div className="pt-4">
                <Link to="/login">
                  <Button className="btn-fluid-primary w-full" type="primary">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {step !== "success" && (
            <div className="text-center mt-6">
              <Link to="/login">
                <Text
                  className="flex items-center justify-center gap-2 cursor-pointer hover:underline text-green-600 hover:text-green-700 font-semibold"
                >
                  <IconArrowLeft size={16} /> Back to Login
                </Text>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

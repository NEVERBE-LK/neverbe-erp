import { useEffect, useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { IconLock, IconUser } from "@tabler/icons-react";
import { authenticateUserAction, signInWithGoogleAction } from "@/actions/authActions";
import { setUser } from "@/lib/authSlice/authSlice";
import { User } from "@/model/User";
import { Card, Form, Input, Button, Typography, Spin, Divider } from "antd";
import toast from "react-hot-toast";
import PageContainer from "../components/container/PageContainer";
import { FcGoogle } from "react-icons/fc";

const { Text } = Typography;

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const handleRedirect = (user: User) => {
    // Redirect all management roles directly to dashboard
    if (
      user.role.toUpperCase() === "ADMIN" ||
      user.role.toUpperCase() === "OWNER" ||
      user.role.toUpperCase() === "MANAGER"
    ) {
      navigate("/dashboard");
    } else if (user.role.toUpperCase() === "POS") {
      // If a POS user accidentally logs into ERP, we can either redirect to POS or show unauthorized
      // Given the request to remove POS related things, we'll redirect to POS external if possible,
      // or just /dashboard if they have access. For now, let's just go to /dashboard as default.
      navigate("/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const onFinish = async (values: any) => {
    setIsLoading(true);
    try {
      const user: User = await authenticateUserAction(
        values.email,
        values.password,
      );
      dispatch(setUser(user));
      window.localStorage.setItem("nvrUser", JSON.stringify(user));
      handleRedirect(user);
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user: User = await signInWithGoogleAction();
      dispatch(setUser(user));
      window.localStorage.setItem("nvrUser", JSON.stringify(user));
      toast.success("Signed in with Google");
      handleRedirect(user);
    } catch (e: any) {
      console.log(e);
      // Special handling for 404 (user not in system)
      if (e.message.includes("404") || e.message.toLowerCase().includes("not found")) {
        toast.error("ERP account not found. Please contact administration.");
      } else {
        toast.error(e.message || "Google sign-in failed");
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const userStr = window.localStorage.getItem("nvrUser");
      if (userStr) {
        const user = JSON.parse(userStr);
        handleRedirect(user);
      } else {
        setTimeout(() => setIsLoading(false), 0);
      }
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
      setTimeout(() => setIsLoading(false), 0);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageContainer title="Login" description="Login to your account">
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center flex-col items-center">
            <figure className="mb-4">
              <img src="/logo.png" alt="Logo" className="w-28 h-28" />
            </figure>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
              NEVERBE ERP Login
            </h2>
            <p className="mt-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-widest">
              Enter your credentials
            </p>
          </div>
        </div>

        <div className="mt-8  sm:mx-auto sm:w-full sm:max-w-md">
          <Card
            className="bg-white py-16 px-4 shadow-xl shadow-green-900/5 sm:rounded-3xl border border-gray-100"
            style={{ borderRadius: "1rem" }}
          >
            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              size="large"
              requiredMark={false}
              className="space-y-6"
            >
              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Email Address
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
                className="mb-0!"
              >
                <Input
                  prefix={<IconUser size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="admin@neverbe.com"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Password
                  </span>
                }
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
                className="mb-0!"
              >
                <Input.Password
                  prefix={<IconLock size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="••••••••"
                />
              </Form.Item>

              <Form.Item className="mb-0! mt-8!">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                  className="btn-fluid-primary"
                >
                  Sign In
                </Button>
              </Form.Item>

              <Divider plain>
                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                  Or
                </span>
              </Divider>

              <Button
                onClick={handleGoogleLogin}
                icon={<FcGoogle size={22} />}
                block
                className="h-14 rounded-xl border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-bold shadow-sm mb-4"
              >
                Continue with Google
              </Button>

              <div className="text-center mt-4">
                <Link to="/reset-password">
                  <Text
                    type="success"
                    className="cursor-pointer hover:underline text-green-600 font-semibold"
                  >
                    Forgot your password?
                  </Text>
                </Link>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Login;

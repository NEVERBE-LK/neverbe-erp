import { useState, useEffect, useRef } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { useNavigate, Link } from "react-router-dom";
import {
  IconLock,
  IconMail,
  IconArrowRight,
  IconLayoutDashboard,
  IconChartBar,
  IconPackage,
} from "@tabler/icons-react";
import {
  authenticateUserAction,
  signInWithGoogleAction,
} from "@/actions/authActions";
import { setUser } from "@/lib/authSlice/authSlice";
import { User } from "@/model/User";
import toast from "react-hot-toast";
import PageContainer from "../components/container/PageContainer";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleRedirect = () => {
    navigate("/dashboard");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const user: User = await authenticateUserAction(email, password);
      dispatch(setUser(user));
      window.localStorage.setItem("nvrUser", JSON.stringify(user));
      handleRedirect();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Invalid credentials");
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      const user: User = await signInWithGoogleAction();
      dispatch(setUser(user));
      window.localStorage.setItem("nvrUser", JSON.stringify(user));
      toast.success("Signed in with Google");
      handleRedirect();
    } catch (e: any) {
      console.error(e);
      if (
        e.message?.includes("404") ||
        e.message?.toLowerCase().includes("not found")
      ) {
        toast.error("ERP account not found. Please contact administration.");
      } else {
        toast.error(e.message || "Google sign-in failed");
      }
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Sign In — Neverbe ERP">
      <div className="min-h-screen flex">
        {/* LEFT PANEL — Branding & Illustration */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-slate-950">
          {/* Abstract background pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.15),transparent_60%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_80%_20%,rgba(168,85,247,0.1),transparent_60%)]" />
            <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_50%_100%,rgba(14,165,233,0.08),transparent_50%)]" />
            {/* Subtle grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            {/* Top — Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Neverbe"
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <span className="text-white font-extrabold text-lg tracking-tight">
                  NEVERBE
                </span>
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em] font-mono -mt-0.5">
                  Enterprise Resource Planning
                </span>
              </div>
            </div>

            {/* Center — Hero text */}
            <div className="max-w-md space-y-6">
              <h1 className="text-4xl font-extrabold text-white leading-[1.15] tracking-tight">
                Everything you
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">
                  need to operate
                </span>
                <br />
                in one platform.
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Streamline operations, track performance, and make data-driven
                decisions — all from a single unified workspace.
              </p>

              {/* Feature cards */}
              <div className="space-y-3 pt-4">
                {[
                  {
                    icon: IconLayoutDashboard,
                    label: "Live Dashboard",
                    sub: "Key metrics at a glance",
                  },
                  {
                    icon: IconPackage,
                    label: "Operations Management",
                    sub: "End-to-end workflow control",
                  },
                  {
                    icon: IconChartBar,
                    label: "Analytics & Reports",
                    sub: "Actionable business insights",
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <f.icon size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        {f.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {f.sub}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom — Footer */}
            <div>
              <span className="text-[10px] text-slate-600 font-mono">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-white dark:bg-slate-950">
          {/* Mobile logo (hidden on lg+) */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img
              src="/logo.png"
              alt="Neverbe"
              className="w-14 h-14 rounded-xl mb-3"
            />
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              NEVERBE
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] font-mono">
              Enterprise Resource Planning
            </span>
          </div>

          <div className="w-full max-w-[380px]">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Sign in to your workspace to continue
              </p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                or sign in with email
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <IconMail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@neverbe.com"
                    autoComplete="email"
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-300 dark:focus:border-slate-700 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <Link
                    to="/reset-password"
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <IconLock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-300 dark:focus:border-slate-700 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider cursor-pointer select-none bg-transparent border-none"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 mt-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50 shadow-sm border-none"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <IconArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-[11px] text-slate-400 mt-8">
              Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Login;

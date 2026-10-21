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
import BrandLogo from "@/components/BrandLogo";

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
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#0a0a0a]">
          {/* Abstract background pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_40%,rgba(255,255,255,0.06),transparent_60%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_80%_80%,rgba(16,185,129,0.05),transparent_60%)]" />
            {/* Subtle athletic technical grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            {/* Top — Logo */}
            <div className="flex items-center gap-3">
              <BrandLogo variant="full" className="h-6 w-auto text-white" />
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-white text-black font-mono">
                ERP
              </span>
            </div>

            {/* Center — Hero text */}
            <div className="max-w-md space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Enterprise Operations System
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.08] tracking-tight uppercase">
                Core Operations.
                <br />
                <span className="text-zinc-500">Total Velocity.</span>
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                Unifying omnichannel inventory, real-time fulfillment, POS terminal sync, and financial analytics across NEVERBE retail.
              </p>

              {/* Feature cards */}
              <div className="space-y-2.5 pt-2">
                {[
                  {
                    icon: IconLayoutDashboard,
                    label: "Live Command Dashboard",
                    sub: "Real-time metrics, margins, and sales pulse",
                  },
                  {
                    icon: IconPackage,
                    label: "Inventory & Fulfillment",
                    sub: "Multi-stock location sync and tracking",
                  },
                  {
                    icon: IconChartBar,
                    label: "Financial Analytics & P&L",
                    sub: "Automated cashflow and accounting exports",
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <f.icon size={18} className="text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block">
                        {f.label}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {f.sub}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom — Footer */}
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                © {new Date().getFullYear()} NEVERBE &middot; Internal Operating System
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-white dark:bg-[#0a0a0a]">
          {/* Mobile logo (hidden on lg+) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <BrandLogo variant="full" className="h-7 w-auto text-black dark:text-white mb-2.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500 font-mono">
              Enterprise Resource Planning
            </span>
          </div>

          <div className="w-full max-w-[380px]">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight uppercase">
                Welcome back
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Sign in to your authorized workspace
              </p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] hover:bg-zinc-50 dark:hover:bg-[#1c1c1c] text-zinc-800 dark:text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
                or sign in with email
              </span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <IconMail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@neverbe.com"
                    autoComplete="email"
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <Link
                    to="/reset-password"
                    className="text-[11px] font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <IconLock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full h-12 pl-10 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] text-zinc-900 dark:text-white text-sm font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 uppercase tracking-wider cursor-pointer select-none bg-transparent border-none"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 mt-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all cursor-pointer disabled:opacity-50 shadow-sm border-none"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <IconArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 mt-8 font-mono">
              Authorized NEVERBE personnel only.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Login;

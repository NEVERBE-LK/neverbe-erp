import React from "react";
import { IconSparkles, IconArrowUpRight, IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { useAppSelector } from "@/lib/hooks";

const AIOperationalInsights = () => {
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const username = currentUser?.username || currentUser?.email?.split("@")[0] || "operator";

  return (
    <div className="relative overflow-hidden rounded-xl border border-card-border dark:border-card-border-dark bg-linear-to-r from-panel via-panel/30 to-panel dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-6 text-text-main dark:text-white shadow-sm transition-all hover:shadow-md">
      {/* Background Decorative Sparkle */}
      <div className="absolute right-[-20px] top-[-20px] opacity-10 blur-2xl">
        <div className="h-40 w-40 rounded-full bg-blue-500"></div>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
            <IconSparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-main dark:text-white tracking-tight m-0">
              {getGreeting()}, {username}
            </h3>
            <p className="text-xs text-text-sub dark:text-slate-400 font-normal mt-0.5 m-0">
              AI-generated operational overview for today
            </p>
          </div>
        </div>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 uppercase tracking-wider">
          System Active
        </span>
      </div>
 
      {/* Insight Bullet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1: Sales performance */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card dark:bg-slate-900/50 border border-card-border dark:border-slate-800/60 transition-all hover:border-text-sub/30 dark:hover:border-slate-800">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <IconArrowUpRight size={14} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-main dark:text-slate-200 m-0">Revenue Growth</h4>
            <p className="text-xs text-text-sub dark:text-slate-400 font-normal mt-1 leading-relaxed m-0">
              Sales performance shows steady growth this week, driven mostly by digital web transactions. Net sales are on track.
            </p>
          </div>
        </div>
 
        {/* Insight 2: Inventory status */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card dark:bg-slate-900/50 border border-card-border dark:border-slate-800/60 transition-all hover:border-text-sub/30 dark:hover:border-slate-800">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
            <IconAlertTriangle size={14} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-main dark:text-slate-200 m-0">Inventory Status</h4>
            <p className="text-xs text-text-sub dark:text-slate-400 font-normal mt-1 leading-relaxed m-0">
              Some key items are approaching restock thresholds. Reordering processes should be initiated to avoid potential stockouts.
            </p>
          </div>
        </div>
 
        {/* Insight 3: Integrity verification */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card dark:bg-slate-900/50 border border-card-border dark:border-slate-800/60 transition-all hover:border-text-sub/30 dark:hover:border-slate-800">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <IconCheck size={14} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-main dark:text-slate-200 m-0">System Integrity</h4>
            <p className="text-xs text-text-sub dark:text-slate-400 font-normal mt-1 leading-relaxed m-0">
              Order integrity check verification successfully retired. Database collections and runtime processes are running optimally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIOperationalInsights;

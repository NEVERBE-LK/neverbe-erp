import React from "react";

interface SpinnerProps {
  spinning?: boolean;
  tip?: string;
  size?: "small" | "medium" | "large";
  fullscreen?: boolean;
  children?: React.ReactNode;
}

const Spinner = ({
  spinning = true,
  tip,
  size = "medium",
  fullscreen = false,
  children,
}: SpinnerProps) => {
  if (!spinning && children) {
    return <>{children}</>;
  }

  const sizeClasses = {
    small: "h-5 w-5 border-2",
    medium: "h-8 w-8 border-[3px]",
    large: "h-12 w-12 border-[4px]",
  };

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse */}
        <div className="absolute h-full w-full rounded-full bg-brand/10 dark:bg-brand-dark/10 animate-ping opacity-75" />
        {/* Main rotating track */}
        <div
          className={`${sizeClasses[size]} rounded-full border-card-border dark:border-slate-800 border-t-brand dark:border-t-brand-dark animate-spin`}
        />
      </div>
      {tip && (
        <span className="text-[10px] font-mono font-bold tracking-widest text-text-sub dark:text-slate-500 uppercase animate-pulse">
          {tip}
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md transition-all duration-300">
        {spinnerElement}
      </div>
    );
  }

  if (children) {
    return (
      <div className="relative w-full h-full min-h-[100px]">
        {/* Wrapped content with opacity overlay */}
        <div className={`w-full h-full transition-all duration-300 ${spinning ? "opacity-25 pointer-events-none select-none blur-[1px]" : ""}`}>
          {children}
        </div>
        {spinning && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {spinnerElement}
          </div>
        )}
      </div>
    );
  }

  return spinnerElement;
};

export default Spinner;

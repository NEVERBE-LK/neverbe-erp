import React from "react";
import { Card } from "antd";

type Props = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  headtitle?: React.ReactNode;
  headsubtitle?: React.ReactNode;
  children?: React.ReactNode;
  middlecontent?: React.ReactNode;
  className?: string;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  headtitle,
  headsubtitle,
  middlecontent,
  className,
}: Props) => {
  const displayTitle = headtitle || title;
  const displaySubtitle = headsubtitle || subtitle;

  return (
    <Card
      title={
        displayTitle ? (
          <div className="flex flex-col py-0">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950/40 leading-none mb-1">
              {displayTitle}
            </span>
            {displaySubtitle && (
              <span className="text-[9px] font-bold text-gray-300 mt-0 uppercase tracking-widest leading-none">
                {displaySubtitle}
              </span>
            )}
          </div>
        ) : null
      }
      extra={action}
      className={`h-full shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] border border-gray-100/50 transition-all duration-500 hover:shadow-emerald-950/10 hover:border-emerald-100 ${className?.includes('bg-') ? '' : 'bg-white/80 backdrop-blur-md'} ${className || ""}`}
      style={{ borderRadius: "2rem" }}
      bodyStyle={{ padding: "2rem", height: "100%" }}
      bordered={false}
    >
      <div className="flex flex-col h-full">
        {middlecontent && <div className="mb-4">{middlecontent}</div>}
        <div className="flex-1">{children}</div>
        {footer && (
          <div className="mt-6 pt-4 border-t border-gray-100">{footer}</div>
        )}
      </div>
    </Card>
  );
};

export default DashboardCard;

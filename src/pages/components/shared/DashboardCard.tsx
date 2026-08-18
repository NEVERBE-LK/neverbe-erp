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
          <div className="flex flex-col py-1">
            <span className="text-sm font-semibold text-text-main dark:text-text-main-dark tracking-tight leading-snug">
              {displayTitle}
            </span>
            {displaySubtitle && (
              <span className="text-xs text-text-sub dark:text-text-sub-dark font-normal mt-0.5 tracking-normal leading-normal">
                {displaySubtitle}
              </span>
            )}
          </div>
        ) : null
      }
      extra={action}
      className={`h-full shadow-sm hover:shadow-md rounded-xl border border-card-border dark:border-card-border-dark transition-all duration-300 ${className?.includes('bg-') ? '' : 'bg-card dark:bg-card-dark'} ${className || ""}`}
      style={{ borderRadius: "12px" }}
      bodyStyle={{ padding: "1.5rem", height: "100%" }}
      bordered={false}
    >
      <div className="flex flex-col h-full text-text-main dark:text-text-main-dark">
        {middlecontent && <div className="mb-4">{middlecontent}</div>}
        <div className="flex-1">{children}</div>
        {footer && (
          <div className="mt-6 pt-4 border-t border-card-border dark:border-card-border-dark">{footer}</div>
        )}
      </div>
    </Card>
  );
};

export default DashboardCard;

import React from "react";
import { Card, Statistic, Spin } from "antd";

const HeaderCard = ({
  title,
  value,
  startDate,
  endDate,
  isLoading,
  invoices,
}: {
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  invoices: number;
}) => {
  return (
    <Card className="h-full shadow-sm border-gray-200" size="small" bordered>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-gray-600">
            {title}{" "}
            <span className="text-xs text-gray-400 font-normal">
              ({invoices})
            </span>
          </span>
        </div>

        <div className="mt-1">
          {isLoading ? (
            <div className="h-8 flex items-center">
              <Spin size="small" />
            </div>
          ) : (
            <span className="text-2xl font-bold text-gray-900">
              LKR{" "}
              {value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-gray-400">
              From
            </span>
            <span>{startDate}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-semibold text-gray-400">
              To
            </span>
            <span>{endDate}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HeaderCard;

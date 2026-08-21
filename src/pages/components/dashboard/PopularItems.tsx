import { PopularItem } from "@/model/PopularItem";
import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getPopularItemsAction } from "@/actions/inventoryActions";
import PopularItemCard from "@/pages/components/dashboard/PopularItemCard";
import { useDashboardSummary } from "./DashboardContext";
import {
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { Button, Select, Divider } from "antd";
import Spinner from "../shared/Spinner";
import { dayjs } from "@/utils/dateUtils";

const PopularItems = () => {
  const { data: summaryData } = useDashboardSummary();
  const [items, setItems] = useState<PopularItem[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // State for Month and Size
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [fetchSize, setFetchSize] = useState(10); // Default to Top 10

  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (summaryData?.popularItems && selectedMonth === dayjs().month() && fetchSize === 10) {
      setItems(summaryData.popularItems);
      setIsLoading(false);
    }
  }, [summaryData, selectedMonth, fetchSize]);

  const months = [
    { value: 0, label: "JANUARY" },
    { value: 1, label: "FEBRUARY" },
    { value: 2, label: "MARCH" },
    { value: 3, label: "APRIL" },
    { value: 4, label: "MAY" },
    { value: 5, label: "JUNE" },
    { value: 6, label: "JULY" },
    { value: 7, label: "AUGUST" },
    { value: 8, label: "SEPTEMBER" },
    { value: 9, label: "OCTOBER" },
    { value: 10, label: "NOVEMBER" },
    { value: 11, label: "DECEMBER" },
  ];

  const sizeOptions = [
    { value: 5, label: "TOP 5" },
    { value: 10, label: "TOP 10" },
    { value: 20, label: "TOP 20" },
    { value: 50, label: "TOP 50" },
  ];

  // Re-fetch when User, Month, OR Size changes
  useEffect(() => {
    if (!currentUser) return;

    fetchPopularItems(true);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchPopularItems(false);
      }
    }, 30000); // 30 seconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchPopularItems(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, selectedMonth, fetchSize]);

  const fetchPopularItems = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const currentYear = dayjs().year();

      const items: PopularItem[] = await getPopularItemsAction(
        fetchSize, // Pass the dynamic size here
        selectedMonth,
        currentYear,
      );
      setItems(items);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 240;
      sliderRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="py-2 flex flex-col h-[350px]">
      <div className="flex flex-wrap items-center justify-between gap-y-3 mb-4 pb-3 border-b border-card-border dark:border-card-border-dark shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-sub dark:text-slate-400">
            Top Performing Products
          </span>
          <div className="flex items-center bg-panel dark:bg-slate-800/60 rounded-lg p-0.5 border border-card-border dark:border-card-border-dark">
            <Button
              type="text"
              size="small"
              icon={<IconChevronLeft size={14} />}
              onClick={() => scrollSlider("left")}
              className="hover:bg-card dark:hover:bg-slate-700 text-text-sub hover:text-brand dark:hover:text-brand-dark"
            />
            <Button
              type="text"
              size="small"
              icon={<IconChevronRight size={14} />}
              onClick={() => scrollSlider("right")}
              className="hover:bg-card dark:hover:bg-slate-700 text-text-sub hover:text-brand dark:hover:text-brand-dark"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Size Selector */}
          <Select
            value={fetchSize}
            onChange={setFetchSize}
            options={sizeOptions}
            className="w-24 h-8 text-xs"
            popupClassName="rounded-xl border-none shadow-2xl"
          />

          {/* Month Selector */}
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={months}
            className="w-32 h-8 text-xs"
            popupClassName="rounded-xl border-none shadow-2xl"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex items-center min-h-0">
        <Spinner spinning={isLoading}>
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory w-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items?.map((item: PopularItem) => (
              <div key={item.item.productId} className="snap-start shrink-0">
                <PopularItemCard item={item} />
              </div>
            ))}

            {!isLoading && items?.length === 0 && (
              <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-card-border dark:border-slate-800 rounded-lg">
                <p className="text-sm font-semibold text-text-sub m-0">
                  No Data For Selected Month
                </p>
              </div>
            )}
          </div>
        </Spinner>
      </div>
    </div>
  );
};

export default PopularItems;

import { PopularItem } from "@/model/PopularItem";
import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getPopularItemsAction } from "@/actions/inventoryActions";
import DashboardCard from "@/pages/components/shared/DashboardCard";
import PopularItemCard from "@/pages/components/dashboard/PopularItemCard";
import {
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { Button, Select, Spin, Divider } from "antd";

const PopularItems = () => {
  const [items, setItems] = useState<PopularItem[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // State for Month and Size
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [fetchSize, setFetchSize] = useState(10); // Default to Top 10

  const sliderRef = useRef<HTMLDivElement>(null);

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
    if (currentUser) {
      fetchPopularItems();
    }
  }, [currentUser, selectedMonth, fetchSize]);

  const fetchPopularItems = async () => {
    try {
      setIsLoading(true);
      const currentYear = new Date().getFullYear();

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
      setIsLoading(false);
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
    <DashboardCard>
      <div className="mb-2">
        <div className="flex flex-wrap items-center justify-between gap-y-4 mb-6 pb-4 border-b border-green-600">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <h4 className="text-xl font-black text-black m-0 leading-none tracking-tight">
              Trending Products
            </h4>

            <div className="flex items-center gap-2">
              <Button
                size="small"
                icon={<IconRefresh size={16} />}
                onClick={fetchPopularItems}
                className="border-gray-200 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
              />
              <Divider type="vertical" className="h-4 bg-gray-200" />
              <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                <Button
                  type="text"
                  size="small"
                  icon={<IconChevronLeft size={16} />}
                  onClick={() => scrollSlider("left")}
                  className="hover:bg-white text-gray-400 hover:text-emerald-600"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<IconChevronRight size={16} />}
                  onClick={() => scrollSlider("right")}
                  className="hover:bg-white text-gray-400 hover:text-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Size Selector */}
            <Select
              value={fetchSize}
              onChange={setFetchSize}
              options={sizeOptions}
              className="flex-1 md:w-28 h-9"
              popupClassName="rounded-xl border-none shadow-2xl"
            />

            {/* Month Selector */}
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={months}
              className="flex-[1.5] md:w-36 h-9"
              popupClassName="rounded-xl border-none shadow-2xl"
            />
          </div>
        </div>

        <Spin spinning={isLoading}>
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items?.map((item: PopularItem) => (
              <div key={item.item.productId} className="snap-start">
                <PopularItemCard item={item} />
              </div>
            ))}

            {!isLoading && items?.length === 0 && (
              <div className="w-full py-12 flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-gray-100">
                <p className="text-sm font-bold m-0">
                  No Data For Selected Month
                </p>
              </div>
            )}
          </div>
        </Spin>
      </div>
    </DashboardCard>
  );
};

export default PopularItems;

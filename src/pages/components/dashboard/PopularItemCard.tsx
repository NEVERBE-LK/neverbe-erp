import { PopularItem } from "@/model/PopularItem";

const PopularItemCard = ({ item }: { item: PopularItem }) => {
  return (
    <div className="min-w-[220px] w-[220px] bg-card dark:bg-card-dark rounded-xl shadow-sm border border-card-border dark:border-card-border-dark relative group select-none overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
      {/* Image Container */}
      <div className="relative h-[180px] w-full overflow-hidden bg-panel dark:bg-slate-950/40">
        <img
          src={item.item.thumbnail.url}
          alt={item.item.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
        />
        {/* Manufacturer Badge */}
        <div className="absolute top-2 left-2 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md rounded-md px-2.5 py-1 shadow-sm">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-none block">
            {item.item.brand}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 text-left">
        <h5 className="font-semibold text-sm text-text-main dark:text-text-main-dark truncate tracking-tight mb-3">
          {item.item.name}
        </h5>

        {/* Technical Spec Label for Sales */}
        <div className="flex items-center justify-between bg-panel dark:bg-slate-950/20 border border-card-border dark:border-card-border-dark rounded-lg px-3 py-2">
          <span className="text-[9px] font-semibold text-text-sub dark:text-slate-500 uppercase tracking-wider">
            Units Sold
          </span>
          <span className="text-sm font-semibold text-brand dark:text-brand-dark">
            {item.soldCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PopularItemCard;

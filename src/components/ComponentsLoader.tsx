import React from "react";
import Spinner from "@/pages/components/shared/Spinner";

const ComponentsLoader = ({
  title = "LOADING",
  position = "absolute",
}: {
  title?: string;
  position?: "fixed" | "absolute" | "relative";
}) => {
  return (
    <div
      className="flex flex-col justify-center items-center bg-canvas dark:bg-canvas-dark gap-3"
      style={{
        position: position,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9999,
      }}
    >
      <Spinner size="large" />
      <span className="text-text-main dark:text-text-main-dark font-black text-[10px] tracking-widest uppercase font-mono">
        {title}
      </span>
    </div>
  );
};

export default ComponentsLoader;

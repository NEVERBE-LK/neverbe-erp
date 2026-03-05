import React, { createContext, useContext, useState, ReactNode } from "react";

interface AIChatContextType {
  contextData: Record<string, unknown>;
  setContextData: (data: Record<string, unknown>) => void;
  contextTitle: string;
  setContextTitle: (title: string) => void;
  clearContext: () => void;
}

const DEFAULT_CONTEXT: Record<string, unknown> = {
  system: "NeverBe ERP",
  description:
    "You are an intelligent assistant embedded in the NeverBe ERP platform.",
};

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const AIChatProvider = ({ children }: { children: ReactNode }) => {
  const [contextData, setContextData] =
    useState<Record<string, unknown>>(DEFAULT_CONTEXT);
  const [contextTitle, setContextTitle] = useState<string>("Global ERP");

  const clearContext = () => {
    setContextData(DEFAULT_CONTEXT);
    setContextTitle("Global ERP");
  };

  return (
    <AIChatContext.Provider
      value={{
        contextData,
        setContextData,
        contextTitle,
        setContextTitle,
        clearContext,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return context;
};

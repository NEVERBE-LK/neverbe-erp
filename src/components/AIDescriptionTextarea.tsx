import React, { useState } from "react";
import { Button, Spin, Input } from "antd";
import { IconSparkles } from "@tabler/icons-react";
import {
  generateProductDescription,
  type GenerateDescriptionInput,
} from "@/actions/aiActions";
import toast from "react-hot-toast";

interface AIDescriptionTextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  aiContext: GenerateDescriptionInput;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
}

const AIDescriptionTextarea: React.FC<AIDescriptionTextareaProps> = ({
  value = "",
  onChange,
  aiContext,
  disabled,
  rows = 4,
  placeholder = "Write a description, or click ✨ Generate with AI...",
  className,
}) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiContext.name) {
      toast.error("Please fill in the name field first");
      return;
    }
    setGenerating(true);
    try {
      const desc = await generateProductDescription(aiContext);

      // Optional: Clean up markdown from the response if the LLM still returns some
      // For plain text areas, we might want to strip **, #, etc.
      let plainDesc = desc;
      // Remove bold tags
      plainDesc = plainDesc.replace(/\*\*(.*?)\*\*/g, "$1");
      // Remove italic tags
      plainDesc = plainDesc.replace(/_(.*?)_/g, "$1");
      // Remove headings
      plainDesc = plainDesc.replace(/^#+\s+/gm, "");
      // Remove unordered lists
      plainDesc = plainDesc.replace(/^[*\-]\s+/gm, "");

      onChange?.(plainDesc.trim());
      toast.success("Description generated!");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message ?? "Failed to generate description");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors ${className || ""}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-end px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <Button
          type="primary"
          size="small"
          icon={generating ? <Spin size="small" /> : <IconSparkles size={13} />}
          onClick={handleGenerateAI}
          disabled={disabled || generating}
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ background: "#000", borderColor: "#000" }}
        >
          {generating ? "Generating..." : "✨ Generate with AI"}
        </Button>
      </div>

      {/* Textarea */}
      <Input.TextArea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || generating}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm text-gray-800 bg-white resize-none outline-none disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-400 border-none"
        style={{
          lineHeight: 1.5,
          boxShadow: "none",
        }}
        variant="borderless"
      />

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
        <span className="text-[10px] text-gray-400">
          {value?.length ?? 0} chars
        </span>
      </div>
    </div>
  );
};

export default AIDescriptionTextarea;

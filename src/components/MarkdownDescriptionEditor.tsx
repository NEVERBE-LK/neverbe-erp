import React, { useRef, useState } from "react";
import { Button, Tooltip, Spin } from "antd";
import {
  IconBold,
  IconItalic,
  IconList,
  IconSparkles,
} from "@tabler/icons-react";
import {
  generateProductDescription,
  type GenerateDescriptionInput,
} from "@/actions/aiActions";
import toast from "react-hot-toast";

interface MarkdownDescriptionEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  productContext: GenerateDescriptionInput;
  disabled?: boolean;
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  linePrefix?: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const full = textarea.value;
  const selected = full.substring(start, end);

  let replacement: string;
  let cursorOffset: number;

  if (linePrefix) {
    // Prefix each selected line
    const lines = selected ? selected.split("\n") : [""];
    replacement = lines.map((l) => `${linePrefix}${l}`).join("\n");
    cursorOffset = replacement.length;
  } else {
    replacement = `${before}${selected}${after}`;
    cursorOffset = before.length + selected.length;
  }

  const newValue = full.substring(0, start) + replacement + full.substring(end);
  return {
    newValue,
    selectionStart: start + cursorOffset,
    selectionEnd: start + cursorOffset,
  };
}

const MarkdownDescriptionEditor: React.FC<MarkdownDescriptionEditorProps> = ({
  value = "",
  onChange,
  productContext,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [generating, setGenerating] = useState(false);

  const applyFormat = (before: string, after: string, linePrefix?: string) => {
    const ta = textareaRef.current;
    if (!ta || disabled) return;

    const { newValue, selectionStart, selectionEnd } = insertAtCursor(
      ta,
      before,
      after,
      linePrefix,
    );
    onChange?.(newValue);

    // Restore focus and cursor
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleGenerateAI = async () => {
    if (!productContext.name) {
      toast.error("Please fill in the product name first");
      return;
    }
    setGenerating(true);
    try {
      const desc = await generateProductDescription(productContext);
      const disclaimer =
        '\n\n<u style="color:red; font-weight:bold;">Disclaimer: This is a high-quality replica product, not a genuine original.</u>';
      const hasDisclaimer = value?.includes("high-quality replica product");
      const finalDesc = hasDisclaimer ? desc + disclaimer : desc;

      onChange?.(finalDesc);
      toast.success("Description generated!");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message ?? "Failed to generate description");
    } finally {
      setGenerating(false);
    }
  };

  const toolbarButtons = [
    {
      label: "Bold",
      icon: <IconBold size={14} />,
      action: () => applyFormat("**", "**"),
    },
    {
      label: "Italic",
      icon: <IconItalic size={14} />,
      action: () => applyFormat("_", "_"),
    },
    {
      label: "Bullet List",
      icon: <IconList size={14} />,
      action: () => applyFormat("", "", "- "),
    },
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {toolbarButtons.map((btn) => (
          <Tooltip key={btn.label} title={btn.label}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Keep textarea focus
                btn.action();
              }}
              disabled={disabled || generating}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {btn.icon}
            </button>
          </Tooltip>
        ))}

        <div className="flex-1" />

        <Button
          type="primary"
          size="small"
          icon={generating ? <Spin size="small" /> : <IconSparkles size={13} />}
          onClick={handleGenerateAI}
          disabled={disabled || generating}
          className="flex items-center gap-1 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-100 h-8 px-4 rounded-xl transition-all hover:scale-[1.02]"
        >
          {generating ? "ORCHESTRATING..." : "Generate with AI"}
        </Button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || generating}
        rows={7}
        placeholder="Write a product description, or click ✨ Generate with AI..."
        className="w-full px-3 py-2.5 text-sm font-mono text-gray-800 bg-white resize-none outline-none disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-400"
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 1.7,
        }}
      />

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          Markdown supported · **bold** · _italic_ · - list
        </span>
        <span className="text-[10px] text-gray-400">
          {value?.length ?? 0} chars
        </span>
      </div>
    </div>
  );
};

export default MarkdownDescriptionEditor;

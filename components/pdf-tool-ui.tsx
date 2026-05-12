"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  LoaderIcon,
} from "lucide-react";

type GeneratePdfFormArgs = {
  title?: string;
  subtitle?: string;
  filename?: string;
  fields?: Array<{
    label: string;
    value?: string;
    type?: "text" | "heading" | "divider" | "table_row";
  }>;
};

type PdfToolSuccess = {
  success: true;
  filename: string;
  base64: string;
  mimeType: "application/pdf";
  pageCount?: number;
  fieldCount?: number;
};

type ParsedPdfResult =
  | { type: "success"; data: PdfToolSuccess }
  | { type: "failure"; message: string }
  | { type: "pending" };

function parsePdfResult(result: unknown): ParsedPdfResult {
  if (result == null) return { type: "pending" };

  let value: unknown = result;

  // If it's a LangChain ToolMessage, extract the artifact
  if (
    typeof result === "object" &&
    result !== null &&
    "kwargs" in result &&
    typeof (result as Record<string, unknown>).kwargs === "object"
  ) {
    const kwargs = (result as Record<string, unknown>).kwargs as Record<
      string,
      unknown
    >;
    if ("artifact" in kwargs) {
      value = kwargs.artifact;
    } else if ("content" in kwargs) {
      // Fallback: try to parse content as JSON if artifact is missing
      value =
        typeof kwargs.content === "string"
          ? safeJsonParse(kwargs.content)
          : kwargs.content;
    }
  } else if (typeof result === "string") {
    // If it's a string, try to parse as JSON
    value = safeJsonParse(result);
  }

  console.log("[PDF UI] Extracted value:", value);

  if (!value || typeof value !== "object") {
    return {
      type: "failure",
      message: "The PDF tool returned an unreadable result.",
    };
  }

  const obj = value as Record<string, unknown>;

  console.log("[PDF UI] Checking object:", {
    hasSuccess: "success" in obj,
    hasBase64: "base64" in obj,
    hasFilename: "filename" in obj,
    base64Length:
      "base64" in obj && typeof obj.base64 === "string"
        ? obj.base64.length
        : 0,
    allKeys: Object.keys(obj),
  });

  if ("success" in obj && obj.success === false) {
    const error =
      "error" in obj && typeof obj.error === "string"
        ? obj.error
        : "PDF generation failed.";
    return { type: "failure", message: error };
  }

  if (
    "success" in obj &&
    obj.success === true &&
    "base64" in obj &&
    typeof obj.base64 === "string" &&
    "filename" in obj &&
    typeof obj.filename === "string"
  ) {
    return {
      type: "success",
      data: {
        success: true,
        filename: obj.filename,
        base64: obj.base64,
        mimeType:
          "mimeType" in obj && obj.mimeType === "application/pdf"
            ? "application/pdf"
            : "application/pdf",
        pageCount:
          "pageCount" in obj && typeof obj.pageCount === "number"
            ? obj.pageCount
            : 1,
        fieldCount:
          "fieldCount" in obj && typeof obj.fieldCount === "number"
            ? obj.fieldCount
            : 0,
      },
    };
  }

  if ("error" in obj && typeof obj.error === "string") {
    return { type: "failure", message: obj.error };
  }

  return {
    type: "failure",
    message: "The PDF was generated, but the download payload was missing.",
  };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function downloadPdf(pdf: PdfToolSuccess) {
  const base64 = pdf.base64.includes(",")
    ? pdf.base64.slice(pdf.base64.indexOf(",") + 1)
    : pdf.base64;
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: pdf.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = pdf.filename || "document.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const GeneratePdfFormToolUI = makeAssistantToolUI<
  GeneratePdfFormArgs,
  unknown
>({
  toolName: "generate_pdf_form",
  render: ({ args, result, status }) => {
    const parsed = parsePdfResult(result);
    const title = args.title || args.filename || "PDF document";

    if (status.type === "running" || parsed.type === "pending") {
      return (
        <PdfCard>
          <div className="flex items-center gap-3">
            <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium text-sm">Generating PDF</p>
              <p className="truncate text-muted-foreground text-sm">{title}</p>
            </div>
          </div>
        </PdfCard>
      );
    }

    if (status.type === "incomplete" || parsed.type === "failure") {
      const message =
        parsed.type === "failure"
          ? parsed.message
          : "The PDF generation tool did not complete.";

      return (
        <PdfCard className="border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="font-medium text-destructive text-sm">
                PDF generation failed
              </p>
              <p className="break-words text-muted-foreground text-sm">
                {message}
              </p>
            </div>
          </div>
        </PdfCard>
      );
    }

    const pdf = parsed.data;

    return (
      <PdfCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-md border bg-background p-2">
              <FileTextIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-emerald-600" />
                <p className="font-medium text-sm">PDF ready</p>
              </div>
              <p className="truncate text-muted-foreground text-sm">
                {pdf.filename}
              </p>
              {typeof pdf.fieldCount === "number" && (
                <p className="text-muted-foreground text-xs">
                  {pdf.fieldCount} content block
                  {pdf.fieldCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            className="w-full gap-2 sm:w-auto"
            onClick={() => downloadPdf(pdf)}
          >
            <DownloadIcon className="size-4" />
            Download PDF
          </Button>
        </div>
      </PdfCard>
    );
  },
});

function PdfCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "my-2 w-full rounded-lg border bg-muted/20 p-4 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

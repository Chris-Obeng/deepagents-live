import { tool } from "langchain";
import { vectorStore } from "../vectorStore/supabase";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

const retrieveShchema = z.object({
  query: z.string(),
});

// retrieval tool
export const retrieve = tool(
  async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 5);

    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`,
      )
      .join("\n");
    return [serialized, retrievedDocs];
  },
  {
    name: "retrieve_context",
    description:
      "Searches the knowledge base for documents semantically relevant to the given query. " +
      "Pass a focused natural language query. Call multiple times in parallel for multi-part questions.",
    schema: retrieveShchema,
    responseFormat: "content_and_artifact",
  },
);

// web search tool
export const webSearchTool = tool(
  async ({
    query,
    maxResults = 5,
    topic = "general",
    includeRawContent = false,
  }: {
    query: string;
    maxResults?: number;
    topic?: "general" | "news" | "finance";
    includeRawContent?: boolean;
  }) => {
    const tavilySearch = new TavilySearch({
      maxResults,
      tavilyApiKey: process.env.TAVILY_API_KEY,
      includeRawContent,
      topic,
    });
    return await tavilySearch._call({ query });
  },
  {
    name: "internet_search",
    description:
      "Searches the internet for current or external information. " +
      "Use this for news, recent events, prices, laws, schedules, product specs, " +
      "API or model documentation, niche facts, recommendations, and answers that need source links. " +
      "Use focused queries and choose topic 'news' or 'finance' when relevant.",
    schema: z.object({
      query: z.string().describe("A focused search query."),
      maxResults: z.number().optional().default(5),
      topic: z
        .enum(["general", "news", "finance"])
        .optional()
        .default("general"),
      includeRawContent: z.boolean().optional().default(false),
    }),
  },
);

// ─────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────

const FieldTypeSchema = z.enum(["text", "heading", "divider", "table_row"]);

const FormFieldSchema = z.object({
  label: z
    .string()
    .describe("The label or key. For table_row this is the left cell."),
  value: z
    .string()
    .optional()
    .describe(
      "The value for the field. For table_row this is the right cell. Omit for headings and dividers.",
    ),
  type: FieldTypeSchema.default("text").describe(
    "'text' = labelled input box, 'heading' = bold section header, " +
      "'divider' = horizontal rule, 'table_row' = two-column key/value row",
  ),
});

export type FormField = z.infer<typeof FormFieldSchema>;

// ─────────────────────────────────────────────
// Tool result type (what the UI will parse)
// ─────────────────────────────────────────────

export interface PdfToolResult {
  success: true;
  filename: string;
  base64: string;
  mimeType: "application/pdf";
  pageCount: number;
  fieldCount: number;
}

export interface PdfToolError {
  success: false;
  error: string;
}

// ─────────────────────────────────────────────
// PDF layout helpers
// ─────────────────────────────────────────────

const A4 = { width: 595, height: 842 };
const MARGIN = 50;
const CONTENT_W = A4.width - MARGIN * 2;

interface DrawCtx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
}

function ensureSpace(ctx: DrawCtx, needed: number): DrawCtx {
  if (ctx.y - needed < 60) {
    const newPage = ctx.doc.addPage([A4.width, A4.height]);
    return { ...ctx, page: newPage, y: A4.height - 60 };
  }
  return ctx;
}

function drawHeading(ctx: DrawCtx, text: string): DrawCtx {
  ctx = ensureSpace(ctx, 40);
  ctx.page.drawText(text, {
    x: MARGIN,
    y: ctx.y,
    size: 13,
    font: ctx.bold,
    color: rgb(0.12, 0.12, 0.12),
  });
  // underline
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y - 4 },
    end: { x: MARGIN + ctx.bold.widthOfTextAtSize(text, 13), y: ctx.y - 4 },
    thickness: 1.2,
    color: rgb(0.3, 0.5, 0.9),
  });
  return { ...ctx, y: ctx.y - 28 };
}

function drawDivider(ctx: DrawCtx): DrawCtx {
  ctx = ensureSpace(ctx, 20);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: A4.width - MARGIN, y: ctx.y },
    thickness: 0.6,
    color: rgb(0.82, 0.82, 0.82),
  });
  return { ...ctx, y: ctx.y - 14 };
}

function drawTextField(ctx: DrawCtx, label: string, value = ""): DrawCtx {
  ctx = ensureSpace(ctx, 54);

  // Label
  ctx.page.drawText(label, {
    x: MARGIN,
    y: ctx.y,
    size: 9,
    font: ctx.bold,
    color: rgb(0.35, 0.35, 0.35),
  });
  ctx.y -= 16;

  // Box
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 22,
    width: CONTENT_W,
    height: 26,
    color: rgb(0.975, 0.975, 0.985),
    borderColor: rgb(0.8, 0.8, 0.85),
    borderWidth: 0.8,
  });

  // Value
  if (value) {
    ctx.page.drawText(value, {
      x: MARGIN + 8,
      y: ctx.y - 10,
      size: 10,
      font: ctx.regular,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: CONTENT_W - 16,
    });
  }

  return { ...ctx, y: ctx.y - 36 };
}

function drawTableRow(
  ctx: DrawCtx,
  key: string,
  value = "",
  shade: boolean,
): DrawCtx {
  ctx = ensureSpace(ctx, 24);
  const rowH = 22;
  const colW = CONTENT_W / 2;

  if (shade) {
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - rowH + 4,
      width: CONTENT_W,
      height: rowH,
      color: rgb(0.96, 0.96, 0.98),
    });
  }

  ctx.page.drawText(key, {
    x: MARGIN + 6,
    y: ctx.y - 8,
    size: 9.5,
    font: ctx.bold,
    color: rgb(0.3, 0.3, 0.3),
    maxWidth: colW - 12,
  });

  ctx.page.drawText(value, {
    x: MARGIN + colW + 6,
    y: ctx.y - 8,
    size: 9.5,
    font: ctx.regular,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: colW - 12,
  });

  // row border
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y - rowH + 4 },
    end: { x: MARGIN + CONTENT_W, y: ctx.y - rowH + 4 },
    thickness: 0.4,
    color: rgb(0.88, 0.88, 0.9),
  });

  return { ...ctx, y: ctx.y - rowH };
}

// ─────────────────────────────────────────────
// Main PDF builder
// ─────────────────────────────────────────────

async function buildPdf(
  title: string,
  subtitle: string | undefined,
  fields: FormField[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Set document metadata
  doc.setTitle(title);
  doc.setCreator("AI Assistant");
  doc.setCreationDate(new Date());

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── First page
  const firstPage = doc.addPage([A4.width, A4.height]);

  // Header band
  firstPage.drawRectangle({
    x: 0,
    y: A4.height - 80,
    width: A4.width,
    height: 80,
    color: rgb(0.18, 0.35, 0.75),
  });

  // Title
  firstPage.drawText(title, {
    x: MARGIN,
    y: A4.height - 48,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
    maxWidth: CONTENT_W - 20,
  });

  // Subtitle / date strip
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  firstPage.drawText(subtitle ?? dateStr, {
    x: MARGIN,
    y: A4.height - 66,
    size: 9,
    font: regular,
    color: rgb(0.78, 0.88, 1),
    maxWidth: CONTENT_W - 80,
  });

  // Date on the right
  firstPage.drawText(subtitle ? dateStr : "", {
    x: A4.width - MARGIN - 90,
    y: A4.height - 57,
    size: 8,
    font: regular,
    color: rgb(0.78, 0.88, 1),
  });

  let ctx: DrawCtx = {
    doc,
    page: firstPage,
    y: A4.height - 100,
    regular,
    bold,
  };

  let tableRowIndex = 0;

  for (const field of fields) {
    switch (field.type) {
      case "heading":
        ctx = drawHeading(ctx, field.label);
        tableRowIndex = 0;
        break;
      case "divider":
        ctx = drawDivider(ctx);
        break;
      case "table_row":
        ctx = drawTableRow(
          ctx,
          field.label,
          field.value ?? "",
          tableRowIndex % 2 === 0,
        );
        tableRowIndex++;
        break;
      default: // "text"
        ctx = drawTextField(ctx, field.label, field.value ?? "");
        tableRowIndex = 0;
        break;
    }
  }

  // ── Footer on every page
  const pages = doc.getPages();
  const total = pages.length;
  pages.forEach((p, i) => {
    // Footer line
    p.drawLine({
      start: { x: MARGIN, y: 44 },
      end: { x: A4.width - MARGIN, y: 44 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    p.drawText(`Generated by AI Assistant  ·  ${dateStr}`, {
      x: MARGIN,
      y: 30,
      size: 7.5,
      font: regular,
      color: rgb(0.55, 0.55, 0.55),
    });

    p.drawText(`Page ${i + 1} of ${total}`, {
      x: A4.width - MARGIN - 42,
      y: 30,
      size: 7.5,
      font: regular,
      color: rgb(0.55, 0.55, 0.55),
    });
  });

  return doc.save();
}

// ─────────────────────────────────────────────
// The LangChain tool — plug this into createAgent()
// ─────────────────────────────────────────────

export const generatePdfFormTool = tool(
  async ({ title, subtitle, filename, fields }) => {
    try {
      const pdfBytes = await buildPdf(title, subtitle, fields);
      const base64 = Buffer.from(pdfBytes).toString("base64");

      const safeFilename =
        filename ??
        `${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}.pdf`;

      const result: PdfToolResult = {
        success: true,
        filename: safeFilename,
        base64,
        mimeType: "application/pdf",
        pageCount: base64.length > 0 ? 1 : 0,
        fieldCount: fields.length,
      };

      console.log("[PDF Tool] Generated PDF:", {
        filename: safeFilename,
        base64Length: base64.length,
        fieldCount: fields.length,
      });

      return [
        `PDF generated: ${safeFilename} (${fields.length} fields)`,
        result,
      ];
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown PDF generation error";
      console.error("[PDF Tool] Error:", errorMsg);
      const result: PdfToolError = {
        success: false,
        error: errorMsg,
      };
      return [errorMsg, result];
    }
  },
  {
    name: "generate_pdf_form",

    description:
      "Generates a styled, downloadable PDF document. " +
      "Use this whenever the user asks to create a form, report, invoice, summary, " +
      "contract, or any content they want to download as a PDF file. " +
      "The frontend renders this tool result as a PDF download card; do not paste the base64 payload in your final response. " +
      "Mix field types to build rich layouts: headings to organise sections, " +
      "text fields for labelled inputs, table_row pairs for key/value summaries, " +
      "and dividers to separate sections.",

    schema: z.object({
      title: z
        .string()
        .describe(
          "Main title shown in the PDF header (e.g. 'Patient Intake Form')",
        ),

      subtitle: z
        .string()
        .optional()
        .describe("Optional subtitle or description shown below the title"),

      filename: z
        .string()
        .optional()
        .describe(
          "Download filename including .pdf extension (e.g. 'intake-form.pdf'). " +
            "Derived from title if omitted.",
        ),

      fields: z
        .array(FormFieldSchema)
        .min(1)
        .describe(
          "Ordered list of content blocks. " +
            "Use 'heading' for section titles, 'text' for labelled input boxes, " +
            "'table_row' for two-column key/value pairs, 'divider' for horizontal rules.",
        ),
    }),
    responseFormat: "content_and_artifact",
  },
);

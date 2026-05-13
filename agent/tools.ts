import { tool } from "langchain";
import { vectorStore } from "../vectorStore/supabase";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";

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

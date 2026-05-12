import { createDeepAgent } from "deepagents";
import { model } from "@/agent/model";
import { systemPrompt } from "@/agent/systemPrompt";
import { agentMiddlewares } from "@/agent/agentMiddleware";
import { researchSubAgentTool } from "@/agent/researchSubgent";
import { retrieve, webSearchTool, generatePdfFormTool } from "./tools";

export const agent = createDeepAgent({
  name: "aurelia",
  model,
  systemPrompt,
  tools: [researchSubAgentTool, retrieve, webSearchTool, generatePdfFormTool],
  middleware: agentMiddlewares,
});

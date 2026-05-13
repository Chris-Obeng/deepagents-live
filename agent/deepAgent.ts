import { model } from "@/agent/model";
import { systemPrompt } from "@/agent/systemPrompt";
import { agentMiddlewares } from "@/agent/agentMiddleware";
import { researchSubAgentTool } from "@/agent/researchSubgent";
import { retrieve, webSearchTool } from "./tools";
import {
  createDeepAgent,
  CompositeBackend,
  StateBackend,
  StoreBackend,
} from "deepagents";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";

const store = new InMemoryStore();
const checkpointer = new MemorySaver();

export const agent = createDeepAgent({
  name: "aurelia",
  model,
  systemPrompt,
  tools: [researchSubAgentTool, retrieve, webSearchTool],
  middleware: agentMiddlewares,
  backend: new CompositeBackend(new StateBackend(), {
    "/memories/": new StoreBackend(),
  }),
  store,
  checkpointer,
});

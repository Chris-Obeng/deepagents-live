import { ChatOpenAI } from "@langchain/openai";

// Previous Inception Labs model config kept for quick rollback.
// export const model = new ChatOpenAI({
//   model: "mercury-2",
//   apiKey: process.env.INCEPTION_API_KEY,
//   configuration: {
//     baseURL: "https://api.inceptionlabs.ai/v1",
//   },
//   temperature: 0,
//   maxTokens: 8192,
//   reasoning: {
//     effort: "xhigh",
//   },
// });

export const model = new ChatOpenAI({
  model: "MiniMax-M2.7",
  apiKey: process.env.MINIMAX_API_KEY,
  configuration: {
    baseURL: "https://api.minimax.io/v1",
  },
  temperature: 0,
  maxTokens: 64000,
  modelKwargs: {
    reasoning_split: true,
  },
});

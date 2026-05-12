import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CohereEmbeddings } from "@langchain/cohere";

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!,
);

const embeddings = new CohereEmbeddings({
  model: "embed-v4.0",
  apiKey: process.env.COHERE_API_KEY,
});

export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: "documents",
  queryName: "match_documents",
});

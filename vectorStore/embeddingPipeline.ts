import { vectorStore } from "./supabase";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
const pdfPath = "";
const loader = new PDFLoader(pdfPath);
const text = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chucks = await splitter.splitDocuments(text);
console.log(`got ${chucks.length} chucks`);

await vectorStore.addDocuments(chucks);
console.log(`added ${chucks.length} chucks to vector store`);

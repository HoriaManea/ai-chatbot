import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
  try {
    const body = await req.json(); // ✅ o singură dată
    const { prompt, messages } = body;
    const latestMessage = messages?.[messages.length - 1]?.content;

    console.log("🧪 Primim prompt:", prompt);
    console.log("💬 Ultimul mesaj:", latestMessage);

    let docContext = "";

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
      });

      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);

      docContext = JSON.stringify(docsMap);
    } catch (err) {
      console.error("⚠️ Eroare la interogarea Astra DB:", err);
      docContext = "";
    }

    const templateMessage = {
      role: "system",
      content: `You are an AI assistant ... \n\nCONTEXT:\n${docContext}\n\nQUESTION: ${latestMessage}`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      messages: [templateMessage, ...messages],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (err: any) {
    console.error("💥 Eroare în /api/chat:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

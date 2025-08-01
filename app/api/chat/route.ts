import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, messages } = body;
    const latestMessage = messages?.[messages.length - 1]?.content;

    console.log("🧪 Primim prompt:", prompt);
    console.log("💬 Ultimul mesaj:", latestMessage);

    let docContext = "";

    // 👉 Înlocuiește embeddings din SDK cu fetch
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: latestMessage,
        encoding_format: "float",
      }),
    });

    const embeddingJson = await embeddingRes.json();
    const vector = embeddingJson.data[0].embedding;

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: {
          $vector: vector,
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

    const systemMessage = {
      role: "system",
      content: `You are an AI assistant...\n\nCONTEXT:\n${docContext}\n\nQUESTION: ${latestMessage}`,
    };

    // 👉 Facem request direct către OpenAI completions
    const completionRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          stream: true,
          messages: [systemMessage, ...messages],
        }),
      }
    );

    const stream = OpenAIStream(completionRes);
    return new StreamingTextResponse(stream);
  } catch (err: any) {
    console.error("💥 Eroare în /api/chat:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

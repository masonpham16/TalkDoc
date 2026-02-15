import Groq from "groq-sdk";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing GROQ_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages = [] } = await req.json();

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are TalkDoc. Give safe general health info. No diagnosis." },
      ...messages,
    ],
  });

  const reply = completion.choices?.[0]?.message?.content ?? "No reply";
  return new Response(JSON.stringify({ ok: true, reply }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

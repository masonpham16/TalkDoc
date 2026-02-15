import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ ok: false, error: "Missing text" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return NextResponse.json(
        { ok: false, error: "Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID" },
        { status: 500 }
      );
    }

    // Try newer models first (older v1 models are deprecated on free tier)
    const modelCandidates = ["eleven_turbo_v2_5", "eleven_turbo_v2", "eleven_multilingual_v2"];

    let audioBuffer: ArrayBuffer | null = null;
    let lastErrorText = "";

    for (const model_id of modelCandidates) {
      const elevenRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (elevenRes.ok) {
        audioBuffer = await elevenRes.arrayBuffer();
        break;
      } else {
        lastErrorText = await elevenRes.text();
      }
    }

    // As a final fallback, try WITHOUT specifying a model_id (let ElevenLabs choose)
    if (!audioBuffer) {
      const elevenRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!elevenRes.ok) {
        const details = await elevenRes.text();
        return NextResponse.json(
          {
            ok: false,
            error: "ElevenLabs request failed",
            details,
            last_tried_details: lastErrorText,
          },
          { status: 500 }
        );
      }

      audioBuffer = await elevenRes.arrayBuffer();
    }

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

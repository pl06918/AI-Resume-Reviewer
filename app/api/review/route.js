import OpenAI from "openai";

function countMatches(base, words) {
  const text = base.toLowerCase();
  return words.filter((w) => text.includes(w.toLowerCase()));
}

function heuristicReview(resumeText, jdText) {
  const jdWords = Array.from(
    new Set(
      jdText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4)
    )
  ).slice(0, 30);

  const matches = countMatches(resumeText, jdWords);
  const missing = jdWords.filter((w) => !matches.includes(w)).slice(0, 8);
  const matchScore = jdWords.length ? Math.round((matches.length / jdWords.length) * 100) : 65;
  const overall = Math.min(100, Math.max(40, Math.round(55 + matchScore * 0.45)));

  return {
    overallScore: overall,
    strengths: [
      "Resume has baseline structure and readable sections.",
      "Key terms are partially aligned with the job description.",
      "Content is concise enough for quick screening."
    ],
    weaknesses: [
      "Some JD-specific keywords are missing.",
      "Impact metrics can be more explicit.",
      "Bullets can start with stronger action verbs."
    ],
    improvements: [
      "Add measurable outcomes to each major bullet.",
      "Mirror JD phrasing where accurate to improve ATS match.",
      "Move strongest technical projects near top of experience section.",
      "Make skills list explicit by tools/framework/cloud stack.",
      "Tighten weak bullets to one impact-focused sentence each."
    ],
    rewrittenBullets: [
      "Built an internal dashboard that reduced weekly reporting time by 35%.",
      "Implemented automated data checks that lowered production incidents by 22%."
    ],
    missingKeywords: missing
  };
}

export async function POST(request) {
  try {
    const { resumeText, jdText } = await request.json();

    if (!resumeText || resumeText.trim().length < 40) {
      return Response.json({ error: "Resume text is too short." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(heuristicReview(resumeText, jdText || ""));
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `Review this resume against the job description and return JSON only.

Required JSON fields:
- overallScore: number (0-100)
- strengths: string[] (3 items)
- weaknesses: string[] (3 items)
- improvements: string[] (5 items)
- rewrittenBullets: string[] (2 items)
- missingKeywords: string[] (max 10)

Resume:\n${resumeText.slice(0, 8000)}\n\nJob Description:\n${(jdText || "").slice(0, 4000)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a strict resume reviewer. Output valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return Response.json({
      overallScore: Number(parsed.overallScore || 70),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      rewrittenBullets: Array.isArray(parsed.rewrittenBullets) ? parsed.rewrittenBullets : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : []
    });
  } catch (error) {
    return Response.json({ error: error.message || "Review failed." }, { status: 500 });
  }
}

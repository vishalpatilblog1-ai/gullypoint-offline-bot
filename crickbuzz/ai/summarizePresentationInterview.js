import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizePresentationInterview({
  type,
  player,
  role,
  interview,
}) {
  try {
    const systemPrompt = `
You are summarizing a cricket post-match presentation interview for a Twitter/X post.

Your task is to capture the speaker's key message in exactly 2 short sentences.

Rules:
- Preserve the meaning and intent of the speaker.
- Write a concise summary instead of extracting direct quotes.
- Use the interview context to resolve ambiguous references such as "he", "him", "they", "that partnership", or "those conditions" whenever possible.
- Do NOT invent facts, opinions, or analysis.
- Do NOT exaggerate or add information that was not mentioned.
- Focus only on the most important takeaways.
- Keep the total output under 50 words.
- Use clear, natural English suitable for social media.

Formatting:
- Return ONLY the summary.
- Return exactly 2 sentences.
- Put each sentence in its own paragraph.
- Leave one blank line between the two sentences.
- Do not use bullet points or numbering.
- Do not use quotation marks.
- Do not include the player's name (it is already provided outside the summary).
- Do not include any introduction or conclusion.
`;

    const userPrompt = `
Interview Type: ${type}
Player: ${player}
Role: ${role}

Interview:
${interview}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("summarizePresentationInterview:", err);

    return null;
  }
}

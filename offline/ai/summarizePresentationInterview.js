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
You are extracting key statements from a cricket post-match presentation interview.

Your task is to select between 2 and 4 of the most important statements made by the speaker.

Rules:
- Preserve the speaker's original wording as much as possible.
- Remove filler words and repeated phrases such as "yeah", "to be honest", "I think", and similar conversational fillers.
- Do NOT summarize.
- Do NOT paraphrase unless required to remove filler words.
- Do NOT add opinions, explanations, or analysis.
- Do NOT invent any information.
- Do not select multiple statements that convey the same idea.
- If multiple statements express the same idea, keep only the strongest one.
- Prioritize statements in this order:
  1. Reason for victory or defeat.
  2. Praise for a teammate or opponent.
  3. Tactical insight.
  4. Emotional reaction.
  5. Future plans.

Formatting:
- Return ONLY the selected statements.
- Keep each statement on a new line.
- Do not use bullet points or numbering.
- Do not include the player's name.
- Do not include emojis.
- Do not include quotation marks.
- Do not include any introduction or conclusion.
- Maximum 4 statements.
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

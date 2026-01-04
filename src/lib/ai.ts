import axios from 'axios';

export interface ScoringResult {
  bullshitScore: number;
  reasoning: string;
  tags: string[];
}

export async function scoreClaim(title: string, snippet: string): Promise<ScoringResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing, using default score');
    return {
      bullshitScore: 5,
      reasoning: "AI scoring unavailable (API key missing)",
      tags: ["unscored"]
    };
  }

  const prompt = `
    You are a BS detector for Tesla and Elon Musk news. 
    Analyze this news claim and score its "ridiculousness" or "absurdity" on a scale of 1-10.
    1 = Boring, factual, verified corporate news.
    5 = Sensationalized, clickbaity, or exaggerated.
    10 = Completely absurd, false, or wildly speculative bullshit.

    Title: "${title}"
    Snippet: "${snippet}"

    Respond ONLY with JSON in this format:
    {
      "bullshitScore": <number 1-10>,
      "reasoning": "<1 sentence explanation of why it is ridiculous>",
      "tags": ["<tag1>", "<tag2>"]
    }
    
    Limit tags to 2-3 items like: cybertruck, stock, fsd, elon, space, etc.
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
        }
      }
    );

    const resultText = response.data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(resultText);

    return {
      bullshitScore: Math.min(10, Math.max(1, parsed.bullshitScore || 5)),
      reasoning: parsed.reasoning || "No reasoning provided.",
      tags: parsed.tags || []
    };
  } catch (error) {
    console.error("AI Scoring Error:", error);
    return {
      bullshitScore: 5,
      reasoning: "Error analyzing with AI.",
      tags: ["error"]
    };
  }
}


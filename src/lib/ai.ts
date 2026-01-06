import axios from 'axios';

export interface ScoringResult {
  bullshitScore: number;
  reasoning: string;
  tags: string[];
}

// Check if news is relevant to Tesla/Elon before scoring
export async function isRelevantToTesla(title: string, description: string): Promise<boolean> {
  // Always do keyword check first (faster and free)
  const text = `${title} ${description}`.toLowerCase();
  const keywords = ['tesla', 'elon', 'musk', 'cybertruck', 'model 3', 'model y', 'model s', 'model x', 'fsd', 'full self driving', 'spacex', 'starlink', 'neuralink', 'boring company', 'tesla stock', 'tsla'];
  const hasKeyword = keywords.some(keyword => text.includes(keyword));
  
  // If keyword check passes, skip AI check to save API calls
  if (hasKeyword) {
    return true;
  }

  // Only use AI if keyword check fails (might be edge case)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return false; // No keywords and no API key = not relevant
  }

  const prompt = `Is this news article directly related to Tesla, Elon Musk, SpaceX, or their companies? Answer with only "yes" or "no".

Title: "${title}"
Description: "${description}"`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      },
      { timeout: 10000 }
    );

    const resultText = response.data.candidates[0].content.parts[0].text.toLowerCase().trim();
    return resultText.includes('yes');
  } catch (error) {
    console.error("Relevance check error:", error);
    // If AI check fails, default to false (strict filtering)
    return false;
  }
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

  const prompt = `You are a BS detector for Tesla and Elon Musk news. 
Analyze this news claim and score its "ridiculousness" or "absurdity" on a scale of 1-10.
1 = Boring, factual, verified corporate news.
5 = Sensationalized, clickbaity, or exaggerated.
10 = Completely absurd, false, or wildly speculative bullshit.

Title: "${title}"
Snippet: "${snippet}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "bullshitScore": <number 1-10>,
  "reasoning": "<1-2 sentence explanation of why it is ridiculous or not>",
  "tags": ["<tag1>", "<tag2>"]
}

Limit tags to 2-3 items like: cybertruck, stock, fsd, elon, spacex, starlink, model3, modely, autopilot, etc.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.3,
        }
      },
      { timeout: 30000 }
    );

    if (!response.data.candidates || !response.data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    let resultText = response.data.candidates[0].content.parts[0].text;
    
    // Clean up JSON if wrapped in markdown
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(resultText);

    return {
      bullshitScore: Math.min(10, Math.max(1, parsed.bullshitScore || 5)),
      reasoning: parsed.reasoning || "No reasoning provided.",
      tags: parsed.tags || []
    };
  } catch (error: any) {
    console.error("AI Scoring Error:", error);
    console.error("Error details:", error.response?.data || error.message);
    return {
      bullshitScore: 5,
      reasoning: `Error analyzing with AI: ${error.message || 'Unknown error'}`,
      tags: ["error"]
    };
  }
}


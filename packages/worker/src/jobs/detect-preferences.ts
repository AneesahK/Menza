import type { Job } from "bullmq";
import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { userMemoryTable } from "@demo/db/schema";
import type { JobData, JobReturn } from "@demo/queue/jobs";
import { MemoryService } from "@demo/llm/services/memory-service";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PREFERENCE_DETECTION_PROMPT = `Analyze the following user message and extract any preferences, instructions, or context that should be remembered for future conversations.

Extract preferences like:
- Units and formatting preferences (e.g., "use GBP", "show dates in DD/MM/YYYY")
- Custom business definitions (e.g., "active customers are those who ordered in last 90 days")
- Data filters or constraints (e.g., "exclude test accounts", "only show UK data")
- Communication preferences (e.g., "be concise", "always explain the SQL")
- Any other persistent context

Only extract clear, actionable preferences. Ignore one-time requests or questions.

Respond with JSON:
{
  "preferences": [
    {
      "content": "exact preference text to store",
      "category": "units|definitions|filters|communication|other",
      "confidence": 0.0-1.0
    }
  ]
}

If no preferences are found, return {"preferences": []}.`;

interface PreferenceExtraction {
  preferences: Array<{
    content: string;
    category: string;
    confidence: number;
  }>;
}

/**
 * Process a detect-preferences job.
 * Uses Claude to extract preferences from a user message and store them.
 */
export async function processDetectPreferences(
  job: Job<
    JobData<"detect-preferences">,
    JobReturn<"detect-preferences">,
    "detect-preferences"
  >,
): Promise<JobReturn<"detect-preferences">> {
  const { userId, orgId, messageId, messageContent } = job.data;

  console.log("=== Detecting preferences ===");
  console.log(`Detect-preferences context: user=${userId} org=${orgId} message=${messageId}`);

  try {
    // Use Claude to extract preferences from the message
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${PREFERENCE_DETECTION_PROMPT}\n\nUser message:\n${messageContent}`,
        },
      ],
    });

    // Extract the JSON response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      console.log("No text content in preference detection response");
      return { success: true, preferencesDetected: 0 };
    }

    // Parse the JSON response
    let extraction: PreferenceExtraction;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = textContent.text.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : textContent.text;
      extraction = JSON.parse(jsonText ?? "{}") as PreferenceExtraction;
    } catch (parseError) {
      console.error("Failed to parse preference extraction JSON:", parseError);
      return { success: true, preferencesDetected: 0 };
    }

    // Filter preferences by confidence threshold
    const validPreferences = extraction.preferences.filter(
      (p) => p.confidence >= 0.7,
    );

    console.log(`Found ${extraction.preferences.length} preferences, ${validPreferences.length} above confidence threshold`);

    if (validPreferences.length === 0) {
      console.log("No high-confidence preferences detected");
      return { success: true, preferencesDetected: 0 };
    }

    // Store each preference
    const memoryService = new MemoryService(db);
    let stored = 0;

    for (const pref of validPreferences) {
      try {
        const existingMemory = await db.query.userMemoryTable.findFirst({
          where: and(
            eq(userMemoryTable.userId, userId),
            eq(userMemoryTable.orgId, orgId),
            eq(userMemoryTable.content, pref.content),
          ),
          columns: {
            id: true,
          },
        });

        if (existingMemory) {
          console.log(`Skipping duplicate preference (category: ${pref.category}, confidence: ${pref.confidence})`);
          continue;
        }

        await memoryService.storeMemory({
          userId,
          orgId,
          content: pref.content,
          metadata: {
            confidence: pref.confidence,
            category: pref.category,
            source: "automatic",
          },
        });
        stored++;
        console.log(`Stored preference (category: ${pref.category}, confidence: ${pref.confidence})`);
      } catch (error) {
        console.error("Failed to store preference:", error);
      }
    }

    return { success: true, preferencesDetected: stored };
  } catch (error) {
    console.error("Error in detect-preferences job:", error);
    return { success: false, preferencesDetected: 0 };
  }
}

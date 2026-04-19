import { and, eq, isNotNull, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { type UserMemory, type UserMemoryInsert, type UserMemoryMetadata, userMemoryTable } from "@demo/db/schema";
import { createID } from "@demo/db/utils";
import { cosineSimilarity, embed } from "../helpers/embeddings.js";

interface SearchResult extends UserMemory {
  similarity: number;
}

export class MemoryService {
  constructor(private readonly db: NodePgDatabase<any>) {}

  /**
   * Store a new memory for a user.
   */
  async storeMemory(params: {
    userId: string;
    orgId: string;
    content: string;
    metadata: UserMemoryMetadata;
  }): Promise<UserMemory> {
    const embedding = await embed(params.content);

    const memory: UserMemoryInsert = {
      id: createID("memory"),
      userId: params.userId,
      orgId: params.orgId,
      content: params.content,
      embedding,
      metadata: params.metadata,
    };

    const [inserted] = await this.db
      .insert(userMemoryTable)
      .values(memory)
      .returning();

    if (!inserted) {
      throw new Error("Failed to insert memory");
    }

    return inserted;
  }

  /**
   * Search for relevant memories using cosine similarity.
   * Returns memories sorted by relevance (highest similarity first).
   */
  async searchMemories(params: {
    userId: string;
    query: string;
    limit?: number;
  }): Promise<Array<SearchResult>> {
    const { userId, query, limit = 10 } = params;

    const queryEmbedding = await embed(query);

    // Fetch all memories for this user
    const memories = await this.db
      .select()
      .from(userMemoryTable)
      .where(
        and(
          eq(userMemoryTable.userId, userId),
          isNotNull(userMemoryTable.embedding),
        ),
      );

    // Calculate similarity scores in-memory
    const memoriesWithSimilarity: Array<SearchResult> = memories
      .map((memory) => {
        if (!memory.embedding || !Array.isArray(memory.embedding)) {
          return null;
        }

        const similarity = cosineSimilarity(
          queryEmbedding,
          memory.embedding as Array<number>,
        );

        return {
          ...memory,
          similarity,
        };
      })
      .filter((m): m is SearchResult => m !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return memoriesWithSimilarity;
  }

  /**
   * Format memories for injection into the LLM prompt.
   * Returns a formatted string with memories, respecting the token limit.
   */
  formatForPrompt(memories: Array<UserMemory>, maxTokens = 500): string {
    if (memories.length === 0) {
      return "";
    }

    const lines: Array<string> = ["<user_context>"];
    let estimatedTokens = 5; // for the opening and closing tags

    for (const memory of memories) {
      // Rough estimate: 1 token ≈ 4 characters
      const memoryTokens = Math.ceil((memory.content.length + 3) / 4);

      if (estimatedTokens + memoryTokens > maxTokens) {
        break;
      }

      lines.push(`- ${memory.content}`);
      estimatedTokens += memoryTokens;
    }

    lines.push("</user_context>");

    return lines.join("\n");
  }

  /**
   * Get all memories for a user (for UI display).
   */
  async getAllMemories(params: {
    userId: string;
    orgId: string;
  }): Promise<Array<UserMemory>> {
    return this.db
      .select()
      .from(userMemoryTable)
      .where(
        and(
          eq(userMemoryTable.userId, params.userId),
          eq(userMemoryTable.orgId, params.orgId),
        ),
      )
      .orderBy(sql`${userMemoryTable.createdAt} DESC`);
  }

  /**
   * Update a memory's content and regenerate its embedding.
   */
  async updateMemory(params: {
    id: string;
    userId: string;
    content: string;
  }): Promise<UserMemory> {
    const embedding = await embed(params.content);

    const [existing] = await this.db
      .select({
        metadata: userMemoryTable.metadata,
      })
      .from(userMemoryTable)
      .where(
        and(
          eq(userMemoryTable.id, params.id),
          eq(userMemoryTable.userId, params.userId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error("Memory not found or update failed");
    }

    const [updated] = await this.db
      .update(userMemoryTable)
      .set({
        content: params.content,
        embedding,
        metadata: {
          confidence: existing.metadata?.confidence ?? 1,
          ...(existing.metadata?.category
            ? { category: existing.metadata.category }
            : {}),
          source: "manual",
        },
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userMemoryTable.id, params.id),
          eq(userMemoryTable.userId, params.userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new Error("Memory not found or update failed");
    }

    return updated;
  }

  /**
   * Delete a memory.
   */
  async deleteMemory(params: {
    id: string;
    userId: string;
  }): Promise<void> {
    await this.db
      .delete(userMemoryTable)
      .where(
        and(
          eq(userMemoryTable.id, params.id),
          eq(userMemoryTable.userId, params.userId),
        ),
      );
  }
}

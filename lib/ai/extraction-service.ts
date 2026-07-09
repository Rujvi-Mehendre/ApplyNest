import { ZodError } from "zod"
import { ExtractionResultSchema, type ExtractionResult } from "./extraction-schemas"
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "./extraction-prompts"

export type { ExtractionContext } from "./extraction-prompts"
import type { ExtractionContext } from "./extraction-prompts"

export type ExtractionError =
  | { code: "API_ERROR"; message: string; status?: number }
  | { code: "PARSE_ERROR"; raw: string }
  | { code: "INVALID_RESPONSE"; issues: string[]; raw: string }
  | { code: "NO_KEY" }

export class ExtractionServiceError extends Error {
  constructor(public readonly detail: ExtractionError) {
    super(detail.code)
  }
}

type Provider = "anthropic" | "openai"

function detectProvider(): Provider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic"
  if (process.env.OPENAI_API_KEY) return "openai"
  throw new ExtractionServiceError({ code: "NO_KEY" })
}

async function extractViaAnthropic(inputText: string, context: ExtractionContext): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6"

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildExtractionUserPrompt(inputText, context) }],
    })
    const block = response.content[0]
    return block.type === "text" ? block.text : ""
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    // Parse human-readable message out of Anthropic's JSON error strings
    let message = e?.message ?? "Anthropic API error"
    try {
      const parsed = JSON.parse(message)
      message = parsed?.error?.message ?? message
    } catch { /* not JSON, use as-is */ }
    throw new ExtractionServiceError({ code: "API_ERROR", message, status: e?.status })
  }
}

async function extractViaOpenAI(inputText: string, context: ExtractionContext): Promise<string> {
  const OpenAI = (await import("openai")).default
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  })
  const model = process.env.OPENAI_MODEL ?? "gpt-4o"

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: buildExtractionUserPrompt(inputText, context) },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    })
    return completion.choices[0]?.message?.content ?? ""
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    throw new ExtractionServiceError({
      code: "API_ERROR",
      message: e?.message ?? "OpenAI API error",
      status: e?.status,
    })
  }
}

export async function extractFromText(
  inputText: string,
  context: ExtractionContext,
): Promise<ExtractionResult & { provider: Provider }> {
  const provider = detectProvider()
  const rawContent = provider === "anthropic"
    ? await extractViaAnthropic(inputText, context)
    : await extractViaOpenAI(inputText, context)

  // Claude sometimes wraps in ```json ... ``` — strip it
  const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new ExtractionServiceError({ code: "PARSE_ERROR", raw: rawContent })
  }

  try {
    return { ...ExtractionResultSchema.parse(parsed), provider }
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ExtractionServiceError({
        code: "INVALID_RESPONSE",
        issues: err.issues.map(i => `${i.path.join(".")}: ${i.message}`),
        raw: rawContent,
      })
    }
    throw err
  }
}

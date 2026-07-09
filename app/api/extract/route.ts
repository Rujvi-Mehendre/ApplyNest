import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractFromText, ExtractionServiceError } from "@/lib/ai/extraction-service"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: {
    saved_program_id: string
    input_text: string
    source_url?: string
    source_type: string
    university_name: string
    program_name: string
    degree_type: string
    user_notes?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { saved_program_id, input_text, source_url, source_type, university_name, program_name, degree_type, user_notes } = body

  if (!saved_program_id || !input_text?.trim()) {
    return NextResponse.json({ error: "saved_program_id and input_text are required" }, { status: 400 })
  }

  // Verify ownership — prevent IDOR
  const { data: sp } = await supabase
    .from("saved_programs")
    .select("id")
    .eq("id", saved_program_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!sp) return NextResponse.json({ error: "Program not found" }, { status: 404 })

  const model = process.env.OPENAI_MODEL ?? "gpt-4o"

  // Insert extraction run — optional, gracefully skipped if table doesn't exist yet
  const { data: run } = await supabase
    .from("ai_extraction_runs")
    .insert({
      user_id: user.id,
      saved_program_id,
      input_text,
      source_url: source_url || null,
      source_type,
      model_used: model,
      extraction_status: "extracting",
    })
    .select()
    .single()
  const runId = run?.id ?? null

  try {
    const result = await extractFromText(input_text, {
      university_name,
      program_name,
      degree_type,
      source_url,
      source_type,
      user_notes,
    })

    // Mark run as completed
    await supabase.from("ai_extraction_runs").update({
      extraction_status: "completed",
      extracted_json: result as unknown as Record<string, unknown>,
      model_used: model,
    }).eq("id", runId ?? "")

    // Bulk-insert extracted items (only if run table exists)
    if (runId) {
      const now = new Date().toISOString()
      const items = [
        ...result.requirements.map(r => ({
          extraction_run_id: runId,
          user_id: user.id,
          saved_program_id,
          item_type: "requirement" as const,
          extracted_json: r as unknown as Record<string, unknown>,
          confidence_score: r.confidence_score,
          status: "pending" as const,
        })),
        ...result.essays.map(e => ({
          extraction_run_id: runId,
          user_id: user.id,
          saved_program_id,
          item_type: "essay" as const,
          extracted_json: e as unknown as Record<string, unknown>,
          confidence_score: e.confidence_score,
          status: "pending" as const,
        })),
      ]
      if (items.length > 0) {
        await supabase.from("ai_extracted_items").insert(items)
      }
    }

    return NextResponse.json({
      run_id: runId,
      requirements: result.requirements,
      essays: result.essays,
      summary: result.summary,
    })
  } catch (err) {
    let message = "Extraction failed"
    if (err instanceof ExtractionServiceError) {
      if (err.detail.code === "NO_KEY") {
        message = "No AI API key configured. Add ANTHROPIC_API_KEY (recommended) or OPENAI_API_KEY to .env.local and restart the dev server."
      } else if (err.detail.code === "API_ERROR") {
        const detail = err.detail as { code: "API_ERROR"; message: string; status?: number }
        if (detail.status === 429 || (detail.status === 400 && detail.message.toLowerCase().includes("credit"))) {
          message = "Your AI API account has no credits. Add credits at console.anthropic.com/settings/billing (for Claude) or platform.openai.com/settings/billing (for OpenAI), then try again."
        } else {
          message = detail.message
        }
      } else {
        message = "AI returned an unexpected response format"
      }
    }

    if (runId) {
      await supabase.from("ai_extraction_runs").update({
        extraction_status: "failed",
        error_message: message,
      }).eq("id", runId)
    }

    const status = err instanceof ExtractionServiceError && err.detail.code === "NO_KEY" ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

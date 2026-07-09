export const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting structured college and graduate school application requirements from admissions text.

Your task is to read the provided text and extract:
1. Application requirements (transcripts, test scores, letters of recommendation, resume, portfolio, etc.)
2. Essay prompts (statement of purpose, personal statement, diversity essay, why school, short answers, etc.)

CRITICAL RULES:
- Return ONLY valid JSON matching the schema exactly. No markdown, no code fences, no preamble.
- Extract ONLY information explicitly stated or clearly implied in the provided text.
- Do NOT invent, assume, or fabricate any requirement not supported by the text.
- PRESERVE exact essay prompt wording verbatim — never paraphrase or summarize a prompt.
- If an essay type is mentioned but the exact prompt text is not provided, set exact_prompt to null.
- If the text indicates a prompt is only visible after creating an application account, set portal_only: true and exact_prompt: null.
- Include source_excerpt for EVERY item — copy the exact verbatim text fragment from the input that supports the extraction.
- Set deadline to null if no specific date is mentioned.
- Use null for any field where the information is not available in the text.

CONFIDENCE SCORING (confidence_score, 0.0–1.0):
- 0.90–1.00: Directly and unambiguously stated in the text
- 0.75–0.89: Clearly implied, no ambiguity about what is required
- 0.50–0.74: Mentioned but details are unclear or partially specified
- 0.25–0.49: Inferred from context, not explicitly stated
- 0.00–0.24: Very uncertain, text is vague or contradictory

When confidence_score < 0.75, set extraction_notes to explain the uncertainty.

REQUIREMENT TYPES (use the closest match):
- transcript: Official academic transcripts
- test_score: Standardized test scores (GRE, GMAT, TOEFL, IELTS, etc.)
- lor: Letters of recommendation / recommendation letters
- sop: Statement of purpose (when treated as a requirement, not an essay)
- resume: Resume, CV, curriculum vitae
- portfolio: Portfolio, writing sample, work samples
- other: Application fee, interview, prerequisites, international documents, etc.

ESSAY TYPES (use the closest match):
- sop: Statement of purpose, research statement, academic goals
- personal_statement: Personal statement, background essay
- diversity: Diversity statement, inclusion essay
- why_school: Why this program, why this school, program fit
- short_answer: Short answer questions, additional information
- other: Career goals, scholarship essays, video essays, any other essay type

The output JSON must match this structure exactly:
{
  "requirements": [...],
  "essays": [...],
  "summary": "1-2 sentence summary of what was found"
}`

export interface ExtractionContext {
  university_name: string
  program_name: string
  degree_type: string
  source_url?: string
  source_type: string
  user_notes?: string
}

export function buildExtractionUserPrompt(inputText: string, context: ExtractionContext): string {
  const lines = [
    `University: ${context.university_name}`,
    `Program: ${context.program_name}`,
    `Degree type: ${context.degree_type}`,
    `Source type: ${context.source_type}`,
  ]
  if (context.source_url) lines.push(`Source URL: ${context.source_url}`)
  if (context.user_notes) lines.push(`User notes: ${context.user_notes}`)

  lines.push(
    "",
    "--- TEXT TO EXTRACT FROM ---",
    inputText.trim(),
    "--- END OF TEXT ---",
    "",
    'Return a JSON object with keys "requirements", "essays", and "summary".',
    "Only extract what is present in the text above.",
  )

  return lines.join("\n")
}

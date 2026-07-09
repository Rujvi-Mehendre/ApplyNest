// TODO: Replace with a real EssaySimilarityProvider backed by
// semantic embeddings (e.g. Anthropic or sentence-transformers) (see lib/providers/index.ts).

import type { EssaySimilarityProvider } from "../interfaces"
import type { PromptGroup } from "../types"
import type { EssayRequirement } from "@/lib/supabase/types"

// 7 canonical theme groups and their detection rules
const THEME_DEFINITIONS = [
  {
    theme_key: "why_school",
    group_name: "Why This Program?",
    match: (e: EssayRequirement) => e.essay_type === "why_school",
    suggested_base: "Write a core 'why us' narrative focusing on 3 specific draws: a faculty member whose work resonates with yours, a program feature (curriculum, industry partners, research lab), and the city/culture. Customize [FACULTY], [PROGRAM FEATURE], and [UNIQUE HOOK] for each school.",
    adaptation_notes: "Swap faculty names, research group names, and specific curriculum details per school. Keep the structure identical — only 20–30% should change per application.",
    similarity_score: 0.88,
  },
  {
    theme_key: "sop",
    group_name: "Statement of Purpose",
    match: (e: EssayRequirement) => e.essay_type === "sop",
    suggested_base: "Develop a master SOP with 5 sections: (1) Hook — a concrete research moment or problem you care about, (2) Academic journey — relevant coursework and projects, (3) Research/work highlights — your top 2 accomplishments with quantified impact, (4) Why this program — faculty, labs, curriculum, (5) Future goals. Sections 1–3 stay consistent; section 4 is always customized.",
    adaptation_notes: "Section 4 must be unique to each school: name specific faculty you want to work with, mention a lab or research center, and explain how the program structure fits your goals. Avoid generic statements like 'your program is renowned.'",
    similarity_score: 0.85,
  },
  {
    theme_key: "personal_statement",
    group_name: "Personal Statement",
    match: (e: EssayRequirement) => e.essay_type === "personal_statement",
    suggested_base: "Draft a personal statement that opens with a specific, vivid moment that reveals your core motivation. Then trace how your background, challenges, and choices led you to this field. Keep the narrative personal and authentic — this essay is about who you are, not just what you've done.",
    adaptation_notes: "This essay typically stays consistent across schools. Minor customization: mention the program name and 1–2 specific draws in the closing paragraph.",
    similarity_score: 0.82,
  },
  {
    theme_key: "diversity",
    group_name: "Diversity & Inclusion",
    match: (e: EssayRequirement) => e.essay_type === "diversity",
    suggested_base: "Write a diversity statement that goes beyond demographics — focus on a perspective, experience, or background that has shaped how you think, collaborate, and contribute. Describe a specific situation, what you did, and how it will enrich the program community.",
    adaptation_notes: "Core narrative stays the same. Adjust the closing 1–2 sentences to connect your diverse perspective to the program's specific community or stated values.",
    similarity_score: 0.79,
  },
  {
    theme_key: "research",
    group_name: "Research Interests",
    match: (e: EssayRequirement) => {
      const text = (e.prompt_text ?? "").toLowerCase()
      return e.essay_type === "sop" && (text.includes("research") || text.includes("dissertation") || text.includes("faculty"))
    },
    suggested_base: "Articulate your research agenda in 3 layers: (1) The problem space you're excited about and why it matters, (2) The methodological approach you prefer and why, (3) How this program's faculty/resources are uniquely positioned to advance your work. Be specific about at least 2 faculty members whose work connects to yours.",
    adaptation_notes: "Always name specific faculty and their relevant publications. This is the most important customization — generic research statements are disqualifying at top programs.",
    similarity_score: 0.76,
  },
  {
    theme_key: "leadership",
    group_name: "Leadership & Impact",
    match: (e: EssayRequirement) => {
      const text = (e.prompt_text ?? "").toLowerCase()
      return text.includes("leader") || text.includes("led") || text.includes("team") || text.includes("impact") || text.includes("community")
    },
    suggested_base: "Use the STAR-L format: Situation (context), Task (your responsibility), Action (specific steps you took), Result (measurable impact), Learning (what this taught you). Choose an example where you drove meaningful change — not just participated.",
    adaptation_notes: "Core story stays the same. Adjust the framing based on whether the program emphasizes academic leadership, community building, or industry/entrepreneurial impact.",
    similarity_score: 0.72,
  },
  {
    theme_key: "short_answer",
    group_name: "Short Answers & Additional Info",
    match: (e: EssayRequirement) => e.essay_type === "short_answer" || e.essay_type === "other",
    suggested_base: "Short answers should be direct and specific — no introductory fluff. State your answer in sentence 1, support it with one concrete example or detail, and close with a one-sentence connection to the program. Every word must earn its place.",
    adaptation_notes: "Each short answer is unique to its prompt. Draft each from scratch rather than adapting a longer essay.",
    similarity_score: 0.60,
  },
]

export class MockEssaySimilarityProvider implements EssaySimilarityProvider {
  // TODO: Replace with semantic embedding similarity clustering
  detectSimilarPrompts(essayRequirements: EssayRequirement[]): PromptGroup[] {
    return this.createPromptGroups(essayRequirements)
  }

  // TODO: Replace with vector clustering of essay prompt embeddings
  createPromptGroups(essayRequirements: EssayRequirement[]): PromptGroup[] {
    const groups: PromptGroup[] = []

    for (const def of THEME_DEFINITIONS) {
      const matches = essayRequirements.filter(def.match)
      if (matches.length === 0) continue

      // Track unique programs for this group
      const programs = [...new Set(matches.map(e => e.saved_program_id))]

      groups.push({
        group_name: def.group_name,
        theme_key: def.theme_key,
        essay_ids: matches.map(e => e.id),
        programs,
        prompts: matches.map(e => e.prompt_text ?? "(Portal only — prompt not yet captured)"),
        suggested_base: def.suggested_base,
        adaptation_notes: def.adaptation_notes,
        similarity_score: def.similarity_score,
      })
    }

    return groups
  }

  // TODO: Replace with LLM draft generation based on applicant profile + prompt
  suggestReusableDrafts(promptGroups: PromptGroup[]): Record<string, string> {
    const drafts: Record<string, string> = {}
    for (const group of promptGroups) {
      drafts[group.theme_key] = `[Draft template for "${group.group_name}"]\n\n${group.suggested_base}\n\n---\nReplace bracketed placeholders with program-specific details before submitting.`
    }
    return drafts
  }

  generateAdaptationNotes(promptGroup: PromptGroup): string {
    return promptGroup.adaptation_notes
  }
}

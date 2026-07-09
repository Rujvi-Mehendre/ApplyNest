import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { castSavedPrograms } from "@/lib/supabase/db"
import { ProgramsClient } from "@/components/programs/ProgramsClient"
import type { SavedProgram, Program } from "@/lib/supabase/types"

export default async function ProgramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("saved_programs")
    .select("*, program:programs(*)")
    .eq("user_id", user.id)
    .order("deadline")

  const programs = castSavedPrograms(data) as (SavedProgram & { program: Program })[]

  return <ProgramsClient programs={programs} />
}

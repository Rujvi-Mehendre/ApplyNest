"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save, FileText, PenLine, Paperclip, Upload, X } from "lucide-react"
import type { EssayDraft } from "@/lib/supabase/types"

interface Props {
  essayId: string
  promptText: string | null
  essayType: string
  wordLimit: number | null
  characterLimit: number | null
  initialStatus: string
  attachedFileUrl: string | null
  attachedFileName: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

const ESSAY_STATUSES = ["not_started", "outline", "draft_1", "revised", "final", "submitted"]
const BUCKET = "essay-files"
const MAX_MB = 20

export function DraftEditorDialog({
  essayId, promptText, essayType, wordLimit, characterLimit, initialStatus,
  attachedFileUrl, attachedFileName, open, onOpenChange,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<"write" | "file">(attachedFileUrl ? "file" : "write")

  // Write tab state
  const [content, setContent] = useState("")
  const [draftId, setDraftId] = useState<string | null>(null)
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)

  // File tab state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [currentFileUrl, setCurrentFileUrl] = useState(attachedFileUrl)
  const [currentFileName, setCurrentFileName] = useState(attachedFileName)
  const fileRef = useRef<HTMLInputElement>(null)

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length
  const overWordLimit = wordLimit && wordCount > wordLimit
  const overCharLimit = characterLimit && charCount > characterLimit

  const loadDraft = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from("essay_drafts")
      .select("*")
      .eq("essay_requirement_id", essayId)
      .eq("user_id", user.id)
      .eq("is_current", true)
      .maybeSingle()
    const draft = data as EssayDraft | null
    if (draft) {
      setContent(draft.content)
      setDraftId(draft.id)
    }
    setLoading(false)
  }, [essayId, supabase])

  useEffect(() => {
    if (open) {
      loadDraft()
      setCurrentFileUrl(attachedFileUrl)
      setCurrentFileName(attachedFileName)
      setTab(attachedFileUrl ? "file" : "write")
      setFile(null)
    }
  }, [open, loadDraft, attachedFileUrl, attachedFileName])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    if (draftId) {
      await supabase.from("essay_draft_versions").insert({
        essay_draft_id: draftId,
        content,
        word_count: wordCount,
      })
      const { error } = await supabase
        .from("essay_drafts")
        .update({ content, word_count: wordCount })
        .eq("id", draftId)
      if (error) { toast.error("Failed to save draft"); setSaving(false); return }
    } else {
      const { data, error } = await supabase
        .from("essay_drafts")
        .insert({
          essay_requirement_id: essayId,
          user_id: user.id,
          content,
          word_count: wordCount,
          version_label: "v1",
          is_current: true,
        })
        .select("id")
        .single()
      if (error || !data) { toast.error("Failed to save draft"); setSaving(false); return }
      setDraftId(data.id)
    }

    setSaving(false)
    toast.success("Draft saved")
    router.refresh()
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus)
    setStatusSaving(true)
    const { error } = await supabase
      .from("essay_requirements")
      .update({ status: newStatus })
      .eq("id", essayId)
    setStatusSaving(false)
    if (error) { toast.error("Failed to update status"); setStatus(initialStatus); return }
    toast.success("Status updated")
    router.refresh()
  }

  async function handleUpload() {
    if (!file) return
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB} MB`)
      return
    }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const path = `${user.id}/${essayId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
    if (uploadError) {
      if (uploadError.message.toLowerCase().includes("bucket")) {
        toast.error("Storage bucket not found. In Supabase → Storage → create a bucket named 'essay-files' (public).")
      } else {
        toast.error(`Upload failed: ${uploadError.message}`)
      }
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const { error: dbError } = await supabase
      .from("essay_requirements")
      .update({ attached_file_url: publicUrl, attached_file_name: file.name })
      .eq("id", essayId)

    if (dbError) { toast.error("File uploaded but failed to save link"); setUploading(false); return }

    setCurrentFileUrl(publicUrl)
    setCurrentFileName(file.name)
    setFile(null)
    setUploading(false)
    toast.success("File attached")
    router.refresh()
  }

  async function handleRemoveFile() {
    setRemoving(true)
    const { error } = await supabase
      .from("essay_requirements")
      .update({ attached_file_url: null, attached_file_name: null })
      .eq("id", essayId)
    setRemoving(false)
    if (error) { toast.error("Failed to remove file"); return }
    setCurrentFileUrl(null)
    setCurrentFileName(null)
    setFile(null)
    toast.success("File removed")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-sand rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-rust font-extrabold flex items-center gap-2">
            <FileText className="w-5 h-5 text-copper" />
            <span className="capitalize">{essayType.replace(/_/g, " ")}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-cream rounded-xl p-1 border border-sand/60">
          <button
            onClick={() => setTab("write")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-all ${tab === "write" ? "bg-card shadow text-rust" : "text-sienna/60 hover:text-sienna"}`}
          >
            <PenLine className="w-3.5 h-3.5" />Write draft
          </button>
          <button
            onClick={() => setTab("file")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-all ${tab === "file" ? "bg-card shadow text-rust" : "text-sienna/60 hover:text-sienna"}`}
          >
            <Paperclip className="w-3.5 h-3.5" />Attach file
            {currentFileUrl && <span className="w-1.5 h-1.5 rounded-full bg-olive inline-block" />}
          </button>
        </div>

        {promptText && (
          <div className="bg-cream rounded-xl border border-sand/40 p-3.5 text-sm text-sienna/80 italic leading-relaxed">
            &ldquo;{promptText}&rdquo;
          </div>
        )}

        {/* WRITE TAB */}
        {tab === "write" && (
          <>
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              {wordLimit && <span className="bg-sand/20 px-2 py-0.5 rounded-full">📏 {wordLimit} word limit</span>}
              {characterLimit && <span className="bg-sand/20 px-2 py-0.5 rounded-full">📏 {characterLimit} char limit</span>}
              <div className="ml-auto flex items-center gap-2">
                <span className={`font-semibold ${overWordLimit ? "text-red-600" : overCharLimit ? "text-red-600" : "text-sienna"}`}>
                  {wordLimit ? `${wordCount}/${wordLimit} words` : characterLimit ? `${charCount}/${characterLimit} chars` : `${wordCount} words`}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-copper" />
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Start writing your essay here…"
                className={`min-h-[300px] rounded-xl border-sand bg-cream/50 text-sm leading-relaxed resize-none focus:ring-copper ${overWordLimit || overCharLimit ? "border-red-300" : ""}`}
              />
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-sand/40">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Status:</span>
                <Select value={status} onValueChange={handleStatusChange} disabled={statusSaving}>
                  <SelectTrigger className="h-8 text-xs rounded-lg border-sand bg-cream w-[120px]">
                    {statusSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-sand bg-card">
                    {ESSAY_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="text-xs capitalize rounded-lg">
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-sand text-sienna text-xs h-8">
                  Close
                </Button>
                <Button onClick={handleSave} disabled={saving || loading || !content.trim()}
                  className="gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 text-xs h-8">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1" />Save Draft</>}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* FILE TAB */}
        {tab === "file" && (
          <div className="space-y-4">
            {currentFileUrl ? (
              <div className="bg-olive/10 border border-olive/20 rounded-xl p-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-olive flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-olive truncate">{currentFileName ?? "Attached file"}</p>
                  <a href={currentFileUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-copper hover:text-sienna underline">
                    Open file ↗
                  </a>
                </div>
                <Button size="icon" variant="ghost" onClick={handleRemoveFile} disabled={removing}
                  className="h-7 w-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                  {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No file attached yet.</p>
            )}

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-sand rounded-xl p-8 text-center cursor-pointer hover:border-copper hover:bg-copper/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-sand mx-auto mb-2" />
              <p className="text-sm font-semibold text-sienna">
                {file ? file.name : currentFileUrl ? "Replace file" : "Click to select a file"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX — up to {MAX_MB} MB</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Requires an <strong>essay-files</strong> bucket in Supabase Storage (Storage → New bucket → name: essay-files → Public).
            </p>

            <div className="flex gap-2 pt-1 border-t border-sand/40">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border-sand text-sienna text-xs h-9">
                Close
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}
                className="flex-1 gradient-copper text-white border-0 rounded-xl font-bold shadow-warm hover:opacity-90 text-xs h-9">
                {uploading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Uploading…</>
                  : <><Upload className="w-3.5 h-3.5 mr-1" />{currentFileUrl ? "Replace" : "Upload"}</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

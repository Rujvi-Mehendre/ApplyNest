import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

const RELEVANT_KEYWORDS = [
  "admission", "requirement", "apply", "application",
  "how-to-apply", "prospective", "graduate", "program", "certificate",
  "degree", "credential", "enroll", "deadline", "funding", "tuition",
]
// If the URL path already contains one of these, it's already a specific leaf page — don't crawl further
const LEAF_KEYWORDS = ["how-to-apply", "admissions", "admission", "requirements", "requirement", "apply", "enroll"]
const MAX_SUBPAGES = 8
const MAX_CROSS_DOMAIN_EDU = 3   // allow up to 3 linked .edu sub-pages from different domains
const FETCH_TIMEOUT_MS = 10000
const MAX_TEXT_CHARS = 24000

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function getRootDomain(hostname: string): string {
  const parts = hostname.split(".")
  return parts.length >= 2 ? parts.slice(-2).join(".") : hostname
}

interface SubLink {
  url: string
  sameDomain: boolean
}

function extractSubLinks(html: string, baseUrl: string): SubLink[] {
  const base = new URL(baseUrl)
  const baseRoot = getRootDomain(base.hostname)
  const seen = new Set<string>()
  const results: SubLink[] = []
  const regex = /href="([^"#][^"]*)"/g
  let match

  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1]
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue
      const resolved = new URL(href, baseUrl)
      const resolvedRoot = getRootDomain(resolved.hostname)
      const clean = resolved.href.split("#")[0]

      if (clean === baseUrl.split("#")[0]) continue
      if (seen.has(clean)) continue
      seen.add(clean)

      const path = (resolved.hostname + resolved.pathname).toLowerCase()
      const isRelevant = RELEVANT_KEYWORDS.some(kw => path.includes(kw))
      if (!isRelevant) continue

      const sameDomain = resolvedRoot === baseRoot
      // Allow cross-domain .edu links (e.g. grad.uw.edu linked from cs.washington.edu)
      const isCrossEdu = !sameDomain && resolved.hostname.endsWith(".edu")

      if (sameDomain || isCrossEdu) {
        results.push({ url: clean, sameDomain })
      }
    } catch { /* ignore */ }
  }

  return results
}

async function safeFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ApplyNest/1.0; admissions research tool)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const ct = res.headers.get("content-type") ?? ""
    if (!ct.includes("html")) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(c => cookieStore.set(c)),
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let url: string
  try {
    const body = await req.json()
    url = body.url
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Valid URL required" }, { status: 400 })
  }

  const mainHtml = await safeFetch(url)
  if (!mainHtml) {
    return NextResponse.json(
      { error: "Could not fetch that URL. The page may block automated access — try pasting the text instead." },
      { status: 400 }
    )
  }

  const pagesFetched: string[] = [url]
  const texts: string[] = [`[Source: ${url}]\n${htmlToText(mainHtml)}`]

  // If the URL already points to a specific admissions/requirements page, don't crawl sub-links
  const urlPath = new URL(url).pathname.toLowerCase()
  const isLeafPage = LEAF_KEYWORDS.some(kw => urlPath.includes(kw))

  if (!isLeafPage) {
    const subLinks = extractSubLinks(mainHtml, url)
    // Same-domain first, then cross-.edu; cap totals
    const sameDomain = subLinks.filter(l => l.sameDomain).slice(0, MAX_SUBPAGES)
    const crossEdu = subLinks.filter(l => !l.sameDomain).slice(0, MAX_CROSS_DOMAIN_EDU)
    const toFetch = [...sameDomain, ...crossEdu]

    await Promise.all(
      toFetch.map(async ({ url: link }) => {
        const html = await safeFetch(link)
        if (html) {
          texts.push(`[Source: ${link}]\n${htmlToText(html)}`)
          pagesFetched.push(link)
        }
      })
    )
  }

  const combined = texts.join("\n\n---\n\n")
  const trimmed = combined.length > MAX_TEXT_CHARS
    ? combined.slice(0, MAX_TEXT_CHARS) + "\n\n[Content trimmed]"
    : combined

  return NextResponse.json({ text: trimmed, pages_fetched: pagesFetched })
}

import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role !== "therapist") return Response.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const response = await fetch(`${process.env.BACKEND_URL}/therapist/link-requests?${searchParams.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.userId,
    },
  })
  const data = await response.json()
  return Response.json(data, { status: response.status })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role !== "therapist") return Response.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.text();
  const response = await fetch(`${process.env.BACKEND_URL}/therapist/link-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.userId,
    },
    body,
  })
  const data = await response.json()
  return Response.json(data, { status: response.status })
}

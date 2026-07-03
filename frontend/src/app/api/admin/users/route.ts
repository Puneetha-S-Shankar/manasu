import { getSession } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  
  const response = await fetch(`${process.env.BACKEND_URL}/admin/users?${searchParams.toString()}`, {
    
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.userId,
    },
    
  })
  const data = await response.json()
  return Response.json(data, { status: response.status })
}

import { getSession } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: any }) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (session.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 })

  
  const body = await req.text();
  const response = await fetch(`${process.env.BACKEND_URL}/admin/link-requests/${params.id}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.userId,
    },
    body,
  })
  const data = await response.json()
  return Response.json(data, { status: response.status })
}

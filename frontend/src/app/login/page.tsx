import { redirect } from "next/navigation";

// All login traffic is handled at the app root (/)
export default function LoginPage() {
  redirect("/");
}

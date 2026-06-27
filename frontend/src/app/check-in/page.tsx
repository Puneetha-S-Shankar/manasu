import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CheckIn from "./CheckIn";

export const metadata = {
  title: "Check In — Manasu",
  description: "Log how you're feeling right now",
};

export default async function CheckInPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <CheckIn />;
}

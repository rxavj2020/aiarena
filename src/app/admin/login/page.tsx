import { redirect } from "next/navigation";

export default function AdminLoginAlias() {
  redirect("/platform/login?next=/dashboard");
}

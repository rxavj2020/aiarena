import { redirect } from "next/navigation";

/** Compatibility alias for the SaaS owner login. */
export default function AdminLoginAlias() {
  redirect("/login?next=/admin");
}

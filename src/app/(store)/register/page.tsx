import { redirect } from "next/navigation";

export const metadata = { title: "Create an Aurelia Studio account" };

/** SaaS owner signup alias. */
export default function RegisterPage() {
  redirect("/platform/signup");
}

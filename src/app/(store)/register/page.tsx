import { AuthForm } from "@/components/store/AuthForm";
export const metadata = { title: "Create account" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthForm mode="register" next={(await searchParams).next} />;
}

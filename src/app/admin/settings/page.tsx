import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
export default async function SettingsPage() {
  const s = await getSettings();
  return <div><PageHeader title="Store settings" subtitle="Shipping, taxes, notifications and regional settings." /><SettingsEditor settings={s} /></div>;
}

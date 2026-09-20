import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { ContentEditor } from "@/components/admin/ContentEditor";
export default async function ContentPage() {
  const s = await getSettings();
  return <div><PageHeader title="Content & Design" subtitle="Control everything customers see: branding, homepage, navigation, announcement bar." /><ContentEditor settings={s} /></div>;
}

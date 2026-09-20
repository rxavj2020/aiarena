import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/store/ContactForm";
import { Mail, Phone, MapPin } from "lucide-react";
export const metadata = { title: "Contact" };
export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="container-x py-14 grid md:grid-cols-2 gap-12 max-w-5xl">
      <div>
        <h1 className="font-display text-4xl font-semibold">Get in touch</h1>
        <p className="text-gray-600 mt-3">Questions about an order, a product, or a partnership? We usually reply within a few hours.</p>
        <ul className="mt-8 space-y-4 text-sm">
          <li className="flex gap-3"><Mail className="h-5 w-5 text-gray-400" /> <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a></li>
          <li className="flex gap-3"><Phone className="h-5 w-5 text-gray-400" /> {s.supportPhone}</li>
          <li className="flex gap-3"><MapPin className="h-5 w-5 text-gray-400" /> {s.address}</li>
        </ul>
      </div>
      <div className="card p-6"><ContactForm /></div>
    </div>
  );
}

import { getSettings } from "@/lib/settings";
import { WishlistView } from "@/components/store/WishlistView";

export const metadata = {
  title: "My Wishlist",
  description: "View and manage your saved items",
};

export default async function WishlistPage() {
  const s = await getSettings();
  return <WishlistView currency={s.currency} />;
}

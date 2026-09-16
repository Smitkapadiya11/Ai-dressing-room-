import Mirror from "@/components/Mirror";
import { GARMENTS, SHOP } from "@/lib/garments";

export const dynamic = "force-dynamic";

export default function KioskPage() {
  return <Mirror garments={GARMENTS} shop={SHOP} />;
}

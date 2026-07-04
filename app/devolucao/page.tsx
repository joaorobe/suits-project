import { getReturnOrders } from "../../lib/data";
import DevolucaoClient from "./DevolucaoClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DevolucaoPage() {
  const initialOrders = await getReturnOrders();
  return <DevolucaoClient initialOrders={initialOrders} />;
}

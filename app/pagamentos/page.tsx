import { getPayments } from "../../lib/data";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PaymentsPage() {
  const initialPayments = await getPayments();
  return <PaymentsClient initialPayments={initialPayments} />;
}

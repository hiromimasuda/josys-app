import { CaseNewForm } from "./CaseNewForm";

// §5.4 受付・トリアージ(Gate 1: ローカル下書きのみ)
export default async function CaseNewPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return <CaseNewForm initialEventId={event ?? ""} />;
}

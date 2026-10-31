import ReportThread from "@/components/reports/ReportThread";

export default async function ReportDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await Promise.resolve(params);
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Trust & Safety Investigation</h1>
        <p className="text-sm text-zinc-400">Review violation details, take enforcement action, or resolve this incident.</p>
      </div>
      
      <ReportThread reportId={resolvedParams.id} />
    </div>
  );
}

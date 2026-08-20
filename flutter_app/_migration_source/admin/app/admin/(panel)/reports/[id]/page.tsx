import ReportThread from "@/components/reports/ReportThread";

export default function ReportDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fraud Investigation</h1>
        <p className="text-sm text-gray-500">Communicate with the user and take action on this report.</p>
      </div>
      
      <ReportThread reportId={params.id} />
    </div>
  );
}

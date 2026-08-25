export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-zinc-300">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <p className="mb-6 text-sm text-zinc-500">Effective Date: May 5, 2026</p>

      <section className="space-y-6">
        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">1. Commitment to Anonymity</h2>
          <p>
            Friendoo is designed as an anonymity-first platform. We do not require or collect your real name, 
            government-issued identification (except where required by financial laws for hosts), or real-world photographs. 
            All user interactions occur under system-generated aliases.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">2. AI-Driven Safety Monitoring</h2>
          <p className="mb-4">
            To maintain a safe environment while preserving your privacy, we employ an automated AI moderation system:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>Message Scanning:</strong> All messages are automatically scanned by an AI system for policy violations (toxicity, harassment, PII sharing) before delivery.</li>
            <li><strong>No Human Review:</strong> No human administrator reads your private messages unless a specific report is submitted by a participant in the conversation.</li>
            <li><strong>Automated Blocking:</strong> Messages identified as harmful may be blocked automatically by the AI system.</li>
          </ul>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">3. Data Collection & Usage (DPDPA 2023)</h2>
          <p className="mb-4">
            In compliance with the Digital Personal Data Protection Act (DPDPA) 2023, we collect the following limited data:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>Phone Number:</strong> Collected solely for account verification (OTP) and administrative oversight.</li>
            <li><strong>Call Metadata:</strong> We log call durations and timestamps for billing and quality assurance. We do NOT record or listen to live audio sessions.</li>
            <li><strong>Behavioral Analytics:</strong> If you provide consent, we track platform usage (clicks, page views) to improve our services and detect fraud.</li>
            <li><strong>Financial Data:</strong> For hosts, we collect UPI IDs and encrypted KYC data as required by PMLA regulations for payouts.</li>
          </ul>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">4. Your Rights</h2>
          <p>
            You have the right to access your data, request corrections, or withdraw your consent for tracking at any time through the application settings.
          </p>
        </div>
      </section>
      
      <footer className="mt-20 pt-8 border-t border-[#242424] text-center text-zinc-600 text-xs">
        &copy; 2026 Friendoo Social. All rights reserved. Compliant with DPDPA 2023.
      </footer>
    </div>
  );
}

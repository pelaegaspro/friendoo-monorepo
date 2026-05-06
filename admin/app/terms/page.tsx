export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-zinc-300">
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
      <p className="mb-6 text-sm text-zinc-500">Last Updated: May 5, 2026</p>

      <section className="space-y-6">
        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Friendoo, you agree to be bound by these Terms of Service. If you do not agree to these terms, 
            you may not use the platform.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">2. Age Requirement & Eligibility</h2>
          <p className="mb-4">
            You must be at least 18 years of age to use Friendoo.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-300 text-sm">
            <strong>Liability Warning:</strong> Users are strictly prohibited from misrepresenting their age. By using this platform, 
            you assume all legal liability for your age declaration. Friendoo reserves the right to terminate accounts immediately 
            if a user is found to be under 18.
          </div>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">3. Prohibited Conduct</h2>
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Harass, abuse, or threaten other users.</li>
            <li>Share personally identifiable information (PII) including phone numbers, addresses, or social media handles.</li>
            <li>Use the platform for any illegal activities or to promote fraud.</li>
            <li>Attempt to bypass our automated AI moderation systems.</li>
          </ul>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">4. Content Moderation</h2>
          <p>
            We use AI-driven scanning and user reporting to enforce these terms. We reserve the right to remove content, 
            block messages, or ban users who violate our community standards. Decisions made by our moderation system 
            are final.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">5. Financial Transactions</h2>
          <p>
            All financial transactions (host earnings and payouts) are processed via RazorpayX. Users and hosts agree 
            to comply with all applicable tax and anti-money laundering (PMLA) regulations in India.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#242424] p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4">6. Safety & Platform Model</h2>
          <p>
            Friendoo is a voice-based social entertainment platform. All interactions are between consenting adults (18+). The platform does not facilitate or endorse any physical meetings, exchange of personal contact information, or services beyond anonymous audio conversation. Sharing personal contact details during calls is a violation of platform rules and may result in immediate account suspension.
          </p>
        </div>
      </section>
      
      <footer className="mt-20 pt-8 border-t border-[#242424] text-center text-zinc-600 text-xs">
        &copy; 2026 Friendoo Social. All rights reserved.
      </footer>
    </div>
  );
}

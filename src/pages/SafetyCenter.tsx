import { ShieldAlert, ShieldCheck, Heart, UserX, MessageSquareWarning } from 'lucide-react';
import { M3Card, M3CardHeader, M3CardTitle, M3CardDescription, M3CardContent } from '@/components/m3/M3Card';
import '@/styles/m3-theme.css';

export default function SafetyCenter() {
  const guidelines = [
    {
      title: "Keep it platonic",
      icon: Heart,
      content: "Friendoo is for making friends, not dating. Respect boundaries and keep the conversation friendly."
    },
    {
      title: "Privacy first",
      icon: ShieldCheck,
      content: "Don't share sensitive PII (phone number, address, bank details) in early conversations. Use our in-app chat."
    },
    {
      title: "Blocked users",
      icon: UserX,
      content: "If someone makes you uncomfortable, use the 'Block' feature immediately. They won't be notified, and you won't see each other again."
    },
    {
      title: "Reporting harassment",
      icon: MessageSquareWarning,
      content: "Report any behavior that violates our community standards. Our moderators review every report within 24 hours."
    }
  ];

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-[var(--md-sys-color-primary)]" />
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sentence-case">Safety center</h1>
      </div>

      <M3Card variant="elevated" padding="medium" className="mb-8 bg-[var(--md-sys-color-primary)]/5">
        <M3CardHeader>
          <M3CardTitle>Community trust program</M3CardTitle>
          <M3CardDescription>We're building a safe space together.</M3CardDescription>
        </M3CardHeader>
        <M3CardContent className="text-sm space-y-2">
          <p className="text-[var(--text-primary)] sentence-case">Friendoo uses a <strong>Trust Score</strong> system. Being a good friend, having verified info, and receiving positive feedback increases your visibility in Discover.</p>
        </M3CardContent>
      </M3Card>

      <div className="space-y-4">
        {guidelines.map((g, i) => (
          <M3Card key={i} variant="outlined" padding="medium">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--md-sys-color-secondary-container)] rounded-lg text-[var(--md-sys-color-on-secondary-container)] shrink-0">
                <g.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] sentence-case mb-2">{g.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm sentence-case">{g.content}</p>
              </div>
            </div>
          </M3Card>
        ))}
      </div>

      <div className="mt-12 text-center text-xs text-[var(--text-hint)]">
        <p className="sentence-case">Need urgent help? Reach out to support@friendoo.com</p>
      </div>
    </div>
  );
}

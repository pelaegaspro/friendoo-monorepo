import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { M3Button } from '@/components/m3/M3Button';
import { M3Card, M3CardHeader, M3CardTitle, M3CardDescription, M3CardContent, M3CardFooter } from '@/components/m3/M3Card';
import { M3Badge } from '@/components/m3/M3Badge';
import { M3Avatar } from '@/components/m3/M3Avatar';
import { MapPin, UserPlus, Loader2, ShieldAlert, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { handleAppError } from '@/lib/error-handler';
import { compatibilityScore } from '@/lib/compatibility';
import '@/styles/m3-theme.css';

export default function Discover() {
  const { user } = useAuthStore();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [pendingOutgoing, setPendingOutgoing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, 'users'), where('onboarded', '==', true), limit(40));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const filtered = snapshot.docs
            .map((d) => d.data())
            .filter((u: any) => u.uid !== user.uid);
          setSuggestedUsers(filtered);
          setLoading(false);
        } catch (err: unknown) {
          handleAppError(err, 'Suggested Users Sync');
          setLoading(false);
        }
      },
      (error) => {
        handleAppError(error, 'Suggested Users Connection');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'blocks'), where('blockerUid', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const ids = new Set<string>();
        snap.docs.forEach((d) => {
          const blockedUid = (d.data() as { blockedUid?: string }).blockedUid;
          if (blockedUid) ids.add(blockedUid);
        });
        setBlockedIds(ids);
      },
      (e) => handleAppError(e, 'Blocks sync'),
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', user.uid),
      where('status', '==', 'pending'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const ids = new Set<string>();
        snap.docs.forEach((d) => {
          const toUid = (d.data() as { toUid?: string }).toUid;
          if (toUid) ids.add(toUid);
        });
        setPendingOutgoing(ids);
      },
      (e) => handleAppError(e, 'Outgoing requests sync'),
    );
    return () => unsub();
  }, [user]);

  const visibleUsers = useMemo(() => {
    if (!user) return [];
    return suggestedUsers.filter((u: any) => !blockedIds.has(u.uid));
  }, [suggestedUsers, blockedIds, user]);

  const handleConnect = async (targetUid: string) => {
    if (!user) return;

    setPendingRequests((prev) => ({ ...prev, [targetUid]: true }));
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUid: user.uid,
        toUid: targetUid,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      toast.success('Connection request sent!');
    } catch (err: unknown) {
      handleAppError(err, 'Sending Connection Request');
      setPendingRequests((prev) => ({ ...prev, [targetUid]: false }));
    }
  };

  const openReport = (u: any) => {
    setReportTarget(u);
    setReportReason('');
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!user || !reportTarget) return;
    const reason = reportReason.trim();
    if (reason.length < 5) {
      toast.error('Please add a bit more detail (at least 5 characters).');
      return;
    }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: user.uid,
        targetUid: reportTarget.uid,
        reason,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      toast.success('Report submitted. Thank you for helping keep Friendoo safe.');
      setReportOpen(false);
      setReportTarget(null);
    } catch (err: unknown) {
      handleAppError(err, 'Submit report');
    }
  };

  const handleBlock = async (targetUid: string) => {
    if (!user) return;
    const blockDocId = `${user.uid}_${targetUid}`;
    try {
      const ref = doc(db, 'blocks', blockDocId);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        toast.error('Already blocked');
        return;
      }
      await setDoc(ref, {
        blockerUid: user.uid,
        blockedUid: targetUid,
        createdAt: serverTimestamp(),
      });
      toast.success('Blocked. You will not see each other in Discover.');
    } catch (err: unknown) {
      handleAppError(err, 'Block user');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--md-sys-color-primary)]" />
        <p className="text-[var(--text-secondary)] animate-pulse sentence-case">Finding tribes near you...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sentence-case">Discover</h1>
          <p className="text-[var(--text-secondary)] text-sm sentence-case">Interest & language aware suggestions</p>
        </div>
        <M3Badge variant="secondary" className="mb-1">
          {visibleUsers.length} people
        </M3Badge>
      </div>

      {reportOpen && reportTarget && (
        <M3Card variant="outlined" padding="medium" className="mb-6">
          <M3CardHeader>
            <M3CardTitle>Report {reportTarget.displayName || 'user'}</M3CardTitle>
            <M3CardDescription>Reports are reviewed by moderators. Only submit truthful information.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent>
            <input
              placeholder="What happened?"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
          </M3CardContent>
          <M3CardFooter className="gap-2">
            <M3Button variant="outlined" onClick={() => setReportOpen(false)}>
              Cancel
            </M3Button>
            <M3Button onClick={submitReport}>
              Submit report
            </M3Button>
          </M3CardFooter>
        </M3Card>
      )}

      <div className="grid gap-6">
        {visibleUsers.length === 0 ? (
          <div className="text-center py-20 bg-[var(--md-sys-color-surface-variant)]/20 rounded-3xl border-2 border-dashed border-[var(--border-primary)]">
            <p className="font-bold text-[var(--text-primary)] sentence-case">No one here yet!</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1 sentence-case">Check back later or invite friends.</p>
          </div>
        ) : (
          visibleUsers.map((u: any) => {
            const score = user ? compatibilityScore(user, u) : 0;
            const initial = (u.displayName || u.username || '?')[0];
            const alreadySent = pendingOutgoing.has(u.uid) || pendingRequests[u.uid];

            return (
              <M3Card
                key={u.uid}
                variant="elevated"
                padding="medium"
                className="hover:shadow-[var(--elevation-3)] transition-all"
              >
                <M3CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-4 min-w-0">
                      <M3Avatar
                        avatarSeed={u.avatarSeed || u.id || initial}
                        size="large"
                        isOnline={u.isOnline}
                      />
                      <div className="min-w-0">
                        <M3CardTitle className="text-xl flex items-center gap-2 truncate sentence-case">
                          {u.displayName}
                          {u.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />}
                        </M3CardTitle>
                        <M3CardDescription className="flex items-center gap-1 mt-1 sentence-case">
                          <MapPin className="w-3 h-3 shrink-0" /> {u.city}
                        </M3CardDescription>
                      </div>
                    </div>
                    <M3Badge variant="secondary" className="rounded-full shrink-0">
                      {score}% match
                    </M3Badge>
                  </div>
                </M3CardHeader>
                <M3CardContent>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed sentence-case">
                    {u.bio || 'This user prefers to stay mysterious.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {u.interests?.map((i: string) => (
                      <M3Badge key={i} variant="secondary" className="rounded-full bg-[var(--bg-secondary)]">
                        {i}
                      </M3Badge>
                    ))}
                  </div>
                </M3CardContent>
                <M3CardFooter className="bg-[var(--md-sys-color-surface-variant)]/30 p-4 gap-2 flex-wrap">
                  <M3Button
                    disabled={alreadySent}
                    onClick={() => handleConnect(u.uid)}
                    className="flex-1 min-w-[140px] gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> {alreadySent ? 'Request sent' : 'Connect'}
                  </M3Button>
                  <M3Button
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={() => openReport(u)}
                    aria-label="Report user"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </M3Button>
                  <M3Button
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={() => handleBlock(u.uid)}
                    aria-label="Block user"
                  >
                    <Ban className="w-4 h-4" />
                  </M3Button>
                </M3CardFooter>
              </M3Card>
            );
          })
        )}
      </div>
    </div>
  );
}

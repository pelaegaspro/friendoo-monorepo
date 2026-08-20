import { adminDb } from "@/lib/firebaseAdmin";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CallLog {
  id: string;
  callerUid: string;
  callId: string;
  channelName: string;
  latencyMs?: number;
  createdAt: { toDate: () => Date } | null;
}

async function getCallLogs(): Promise<CallLog[]> {
  try {
    const snapshot = await adminDb.collection("call_logs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CallLog[];
  } catch (error) {
    console.error("Failed to fetch call logs server-side:", error);
    return [];
  }
}

export default async function CallLogsPage() {
  const logs = await getCallLogs();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Call Logs & Latency</h1>
        <p className="text-muted-foreground">
          Monitor WebRTC signaling handshake times and recent calls in real-time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Connections</CardTitle>
          <CardDescription>
            Showing the last 50 WebRTC token generation events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Caller UID</TableHead>
                <TableHead>Agora Channel</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No call logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.callId}</TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[120px]">{log.callerUid}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.channelName}</TableCell>
                    <TableCell>
                      {log.latencyMs ? (
                        <Badge variant={log.latencyMs < 300 ? "default" : "danger"}>
                          {log.latencyMs}ms
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

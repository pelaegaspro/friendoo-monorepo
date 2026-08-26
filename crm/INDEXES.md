# Supabase Query Indexes for Friendoo

Operational indexes are defined and reviewed in the Supabase PostgreSQL
migrations under `supabase/migrations/`. This file is retained as a placeholder
for future Postgres index notes.

1. Collection: `users`
- `isHost` ASC + `isOnline` ASC + `lastActive` DESC
- `isHost` ASC + `hostStatus` ASC + `createdAt` DESC
- `isBanned` ASC + `lastActive` DESC

2. Collection: `calls`
- `fromUserId` ASC + `createdAt` DESC
- `toUserId` ASC + `createdAt` DESC
- `status` ASC + `createdAt` DESC

3. Collection: `coinTransactions`
- `userId` ASC + `type` ASC + `createdAt` DESC
- `type` ASC + `createdAt` DESC + `status` ASC

4. Collection: `supportTickets`
- `status` ASC + `priority` ASC + `createdAt` DESC
- `userId` ASC + `createdAt` DESC

5. Collection: `fraudAlerts`
- `status` ASC + `severity` ASC + `createdAt` DESC

6. Collection: `hostApplications`
- `status` ASC + `submittedAt` DESC

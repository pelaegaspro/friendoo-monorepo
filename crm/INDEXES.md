# Firestore Composite Indexes for Friendoo

Create these composite indexes in Firebase Console (Firestore -> Indexes -> Composite) or keep them in `D:\Friendoo\firestore.indexes.json`.

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

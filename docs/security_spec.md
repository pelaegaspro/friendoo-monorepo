# Friendoo Security Specification

## 1. Data Invariants
- A user cannot set themselves as a moderator via client SDK.
- A friend request cannot be accepted by the person who sent it.
- Messages can only be read by participants of the specific conversation.
- No one can delete a message once it is sent (immutability of history).

## 2. The "Dirty Dozen" Payloads (Red Team Audit)
1. **Identity Theft:** `{"uid": "OTHER_USER_ID", "displayName": "Attacker"}` sent to `/users/MY_UID`.
2. **Ghost Permissions:** `{"isAdmin": true}` sent to `/users/MY_UID`.
3. **Friend Spam:** Sending a friend request with `fromUid` set to some other user.
4. **Self-Accept:** Updating a friend request you sent to `status: "accepted"`.
5. **ID Poisoning:** Document ID with 1MB emoji string.
6. **Eavesdropping:** Querying `/conversations` without being a participant.
7. **Message Spoofing:** Sending a message with `senderUid` set to the other participant.
8. **Time Travel:** Setting `timestamp` to a future date or past date manually.
9. **Mass Scraping:** Attempting to `list` all users without a filter (blocked by rules requiring auth).
10. **Resource Exhaustion:** Sending 1000 characters for a `displayName`.
11. **State Shortcut:** Directly creating a `Friendship` document without a successful `FriendRequest`.
12. **PII Leak:** Attempting to read another user's private email (not stored in the public User entity).

## 3. Test Runner (Draft)
A comprehensive test suite in `src/tests/firestore.rules.test.ts` will verify these denials.

# PhishShield AI Security Specification

## 1. Data Invariants
- A Scan must belong to the authenticated user who created it (`userId == request.auth.uid`).
- Users can only read their own scans and reports.
- User profile documents (`/users/{uid}`) can only be written by the owner of that UID.
- Timestamps must be server-generated (`request.time`).
- Confidence scores must be between 0 and 100.
- Verdicts must be one of ['phishing', 'safe', 'suspicious'].

## 2. The Dirty Dozen Payloads (Targeting Firestore)

1. **Identity Theft: Create scan for another user**
   - Payload: `{ userId: "victim_uid", imageURL: "...", verdict: "safe" }`
   - Goal: `PERMISSION_DENIED`
2. **Ghost Field: Inject hidden verified flag**
   - Payload: `{ userId: "my_uid", imageURL: "...", isVerifiedAdmin: true }`
   - Goal: `PERMISSION_DENIED` (via `affectedKeys().hasOnly()`)
3. **Identity Spoofing: Change ownership of a scan**
   - Update scan `{ id: "scan123" }` with `{ userId: "other_uid" }`
   - Goal: `PERMISSION_DENIED`
4. **State Shortcut: Mark scan as completed without analysis**
   - Create scan as `{ status: "completed" }` directly
   - Goal: `PERMISSION_DENIED` (assuming status should start as pending or be set by system only) - *Note: In this specific app, the client might send the AI result directly if we do it purely client-side, but I'll implement some server-side checks or strict client validation.*
5. **PII Leak: Read another user's email/profile**
   - `get(/users/another_uid)`
   - Goal: `PERMISSION_DENIED`
6. **Denial of Wallet: Large ID injection**
   - `create(/scans/very_long_id_string_over_1.5kb)`
   - Goal: `PERMISSION_DENIED` (via `isValidId()`)
7. **Resource Exhaustion: Huge imageURL string**
   - Payload: `{ imageURL: "A" * 1000000 }`
   - Goal: `PERMISSION_DENIED`
8. **Invalid Verdict: Malicious string**
   - Payload: `{ verdict: "totally_safe_trust_me" }`
   - Goal: `PERMISSION_DENIED`
9. **Timestamp Manipulation: Backdated scan**
   - Payload: `{ timestamp: timestamp_from_1999 }`
   - Goal: `PERMISSION_DENIED`
10. **Query Scraper: List all scans**
    - `collection('scans').get()` without filter
    - Goal: `PERMISSION_DENIED` (Must have `where("userId", "==", uid)`)
11. **Report Forgery: Add report for scans not owned**
    - Payload: `{ scanIds: ["not_my_scan"], userId: "my_uid" }`
    - Goal: `PERMISSION_DENIED` (via `get()` check on scans)
12. **Self-Promotion: Set role to admin**
    - `update(/users/my_uid)` with `{ role: "admin" }`
    - Goal: `PERMISSION_DENIED`

## 3. Test Runner Plan
I will implement a robust ruleset that blocks these payloads.

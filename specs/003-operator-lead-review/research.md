# Research: Operator Leader Review

**Phase**: 1 (Design) | **Date**: 2026-06-22  
**Status**: Draft

## Overview

Research findings and technical validation for the Operator Leader Review feature, including security considerations, UI patterns, and implementation strategies.

---

## Technology Validation

### Password Authentication for Leader Review

**Question**: Should we use password re-authentication or session-based authentication?

**Options**:
1. **Password Re-authentication**: Leader enters password each time they review a job
2. **Session-Based**: Leader logs in once and reviews multiple jobs without re-authenticating
3. **Hybrid**: Leader logs in once, but re-authenticates after timeout or sensitive actions

**Analysis**:

**Option 1 (Password Re-authentication)**:
- ✅ Maximum security (each review requires authentication)
- ✅ Ensures deliberate action for each job
- ✅ Prevents unauthorized reviews if leader walks away
- ❌ More friction for leaders reviewing multiple jobs
- ❌ Slower workflow

**Option 2 (Session-Based)**:
- ✅ Better UX (less friction)
- ✅ Faster workflow for multiple reviews
- ❌ Security risk if leader walks away
- ❌ Less accountability (could be someone else reviewing)

**Option 3 (Hybrid)**:
- ✅ Balance of security and UX
- ✅ Session timeout prevents stale authentication
- ✅ Re-authentication for sensitive actions
- ⚠️ More complex implementation

**Decision**: **Option 1 (Password Re-authentication)**

**Rationale**: The feature requirement explicitly states "All operator leader review checkboxes must be completed before a jobsheet can be marked as complete" and emphasizes physical presence. Per-job authentication ensures:
1. Deliberate review of each job
2. Accountability (leader physically present for each review)
3. Security (no stale sessions)

This aligns with the use case where the leader physically stands next to the operator and reviews each job individually.

---

### Leader Review Storage

**Question**: Should leader review data be stored in `job_completions` table or a separate `leader_reviews` table?

**Options**:
1. **Single Table**: Add leader review columns to `job_completions`
2. **Separate Table**: Create new `leader_reviews` table with FK to `job_completions`
3. **JSON Column**: Store leader review data as JSON in `job_completions`

**Analysis**:

**Option 1 (Single Table)**:
- ✅ Simple schema (one table to manage)
- ✅ Efficient queries (no joins needed)
- ✅ Atomic updates (completion + review in one row)
- ✅ Easier to enforce constraints
- ❌ Table grows wider (more columns)
- ❌ Some rows may not have review data (nullable columns)

**Option 2 (Separate Table)**:
- ✅ Normalized schema (separate concerns)
- ✅ No nullable columns in `job_completions`
- ✅ Easier to extend (add more review metadata)
- ❌ More complex queries (joins needed)
- ❌ More database operations (insert/update two tables)
- ❌ Potential for orphaned records

**Option 3 (JSON Column)**:
- ✅ Flexible schema (easy to add fields)
- ✅ Compact storage (only store when needed)
- ❌ No type safety
- ❌ No foreign key constraints
- ❌ Harder to query and index
- ❌ SQLite JSON support is limited

**Decision**: **Option 1 (Single Table)**

**Rationale**: 
- Leader review is tightly coupled with job completion (one-to-one relationship)
- Simpler queries and updates
- SQLite handles nullable columns efficiently
- Easier to maintain and understand
- Performance benefits (no joins needed)

---

### Leader Review Timeout

**Question**: What should the timeout duration be for leader review dialogs?

**Options**:
1. **No Timeout**: Dialog stays open until user action
2. **Short Timeout**: 2-3 minutes
3. **Medium Timeout**: 5 minutes
4. **Long Timeout**: 10-15 minutes

**Analysis**:

**Option 1 (No Timeout)**:
- ✅ No frustration from unexpected timeouts
- ✅ Leader can take time to review documentation
- ❌ Security risk (stale authentication)
- ❌ Could leave modal open indefinitely

**Option 2 (Short Timeout: 2-3 minutes)**:
- ✅ Good security (quick timeout)
- ❌ Too short for careful review
- ❌ Frustrating for users

**Option 3 (Medium Timeout: 5 minutes)**:
- ✅ Balance of security and UX
- ✅ Enough time for careful review
- ✅ Prevents stale sessions
- ⚠️ May timeout during complex reviews

**Option 4 (Long Timeout: 10-15 minutes)**:
- ✅ Good UX (plenty of time)
- ❌ Security risk (longer stale sessions)
- ❌ Defeats purpose of per-job authentication

**Decision**: **Option 3 (Medium Timeout: 5 minutes)**

**Rationale**:
- 5 minutes is enough time for most reviews
- Prevents stale authentication sessions
- Clear error message explains timeout
- Easy to restart the review process
- Industry standard for sensitive actions (banking, healthcare)

---

## Security Considerations

### Password Handling

**Requirements**:
- Passwords MUST never be logged (server or client)
- Passwords MUST be transmitted over HTTPS only
- Passwords MUST be validated using existing bcrypt hashing
- Error messages MUST NOT reveal account existence

**Implementation**:
```typescript
// Server-side validation
async function validateLeaderCredentials(userId: string, password: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || user.role !== 'OperatorLeader') {
    // Don't reveal if user exists or not
    return false;
  }
  
  // Use bcrypt for secure password comparison
  return bcrypt.compare(password, user.password);
}
```

**Error Messages**:
- ✅ "Invalid password" (generic)
- ❌ "User not found" (reveals account existence)
- ❌ "Password is incorrect" (reveals account exists)

---

### IP Address Recording

**Requirements**:
- Record IP address for audit trail
- Mask IP address in logs (privacy)
- Don't block if IP unavailable

**Implementation**:
```typescript
// Record full IP in database
leader_review_ip = '192.168.1.100'

// Mask IP in logs
function maskIpAddress(ip: string): string {
  // Replace last octet with XXX
  return ip.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.XXX');
}

// Log masked IP
logger.info({
  action: 'LEADER_REVIEW_SUCCESS',
  ipAddress: maskIpAddress('192.168.1.100') // 192.168.1.XXX
});
```

---

### Rate Limiting

**Requirements**:
- Prevent brute force password attacks
- Allow legitimate retries
- Per-user, per-job limiting

**Implementation**:
```typescript
// Rate limiting: 5 attempts per 10 minutes per user per job
const RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
};

// Track attempts in memory (or Redis for distributed systems)
const attemptTracker = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, jobId: string): boolean {
  const key = `${userId}:${jobId}`;
  const attempts = attemptTracker.get(key);
  
  if (!attempts || Date.now() > attempts.resetAt) {
    // Reset counter
    attemptTracker.set(key, { count: 1, resetAt: Date.now() + RATE_LIMIT.windowMs });
    return true;
  }
  
  if (attempts.count >= RATE_LIMIT.maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  attempts.count++;
  return true;
}
```

---

## UI/UX Patterns

### Modal Dialog Patterns

**Best Practices**:
1. **Focus Management**: Trap focus within modal, return focus on close
2. **Keyboard Navigation**: Tab, Enter, Space, Escape support
3. **ARIA Labels**: Proper roles, labels, and live regions
4. **Error Handling**: Clear error messages with `aria-live`
5. **Timeout**: Clear notification on timeout with restart option

**Reference Implementation**:
```typescript
// Modal with proper accessibility
function LeaderReviewModal({ isOpen, onClose, onSubmit }: LeaderReviewModalProps) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Focus password field on open
  useEffect(() => {
    if (isOpen && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [isOpen]);
  
  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      
      if (e.key === 'Tab') {
        // Implement focus trap
        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
      className="modal-overlay"
    >
      <div className="modal-container">
        <h2 id="modal-title">Operator Leader Review Required</h2>
        
        <p>The Operator Leader must review and approve this job.</p>
        
        <div className="job-details">
          <p>Job: {jobName}</p>
          <p>Completed by: {operatorName}</p>
        </div>
        
        <label htmlFor="leader-password">Leader Password:</label>
        <input
          ref={passwordRef}
          id="leader-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'password-error' : undefined}
        />
        
        {error && (
          <div id="password-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}
        
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={!password || isLoading}
          >
            {isLoading ? 'Processing...' : 'Approve Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Accessibility Guidelines

### WCAG AA Requirements

**1.4.1 Use of Color**:
- Status indicators use color + icons + text
- Example: Yellow + ⚠️ + "Pending Review"
- Example: Green + ✓ + "Approved by Jane Leader"

**2.1.1 Keyboard**:
- All controls accessible via keyboard
- Tab: Move to next element
- Enter/Space: Activate button
- Escape: Close modal

**2.4.7 Focus Visible**:
- All focusable elements have visible focus indicator
- Use `:focus-visible` CSS pseudo-class
- Don't remove outline without replacement

**3.3.1 Error Identification**:
- Error messages clearly identify the problem
- Example: "Invalid password. Please try again."
- Use `role="alert"` and `aria-live="polite"`

**4.1.2 Name, Role, Value**:
- Modal has `role="dialog"` and `aria-modal="true"`
- Header has `aria-labelledby` pointing to title
- Form fields have associated labels

---

## Testing Strategies

### Unit Testing

**Coverage Goals**:
- Leader review validation logic
- Password authentication
- Leader review invalidation
- Rate limiting
- Timeout handling

**Example**:
```typescript
describe('Leader Review Service', () => {
  describe('validateLeaderCredentials', () => {
    it('should return true for valid credentials', async () => {
      const user = { id: 'user-001', role: 'OperatorLeader', password: hash('password123') };
      jest.spyOn(userModel, 'getUserById').mockResolvedValue(user);
      
      const result = await validateLeaderCredentials('user-001', 'password123');
      
      expect(result).toBe(true);
    });
    
    it('should return false for invalid password', async () => {
      const user = { id: 'user-001', role: 'OperatorLeader', password: hash('password123') };
      jest.spyOn(userModel, 'getUserById').mockResolvedValue(user);
      
      const result = await validateLeaderCredentials('user-001', 'wrongpassword');
      
      expect(result).toBe(false);
    });
    
    it('should return false for non-leader user', async () => {
      const user = { id: 'user-001', role: 'Operator', password: hash('password123') };
      jest.spyOn(userModel, 'getUserById').mockResolvedValue(user);
      
      const result = await validateLeaderCredentials('user-001', 'password123');
      
      expect(result).toBe(false);
    });
  });
});
```

---

### Integration Testing

**Test Scenarios**:
1. Leader review success flow
2. Leader review failure (invalid password)
3. Jobsheet completion with pending reviews
4. Leader review invalidation on job modification
5. Rate limiting enforcement

**Example**:
```typescript
describe('Leader Review API', () => {
  it('should successfully record leader review', async () => {
    const response = await request(app)
      .post('/api/execution/exec-001/jobs/job-001/leader-review')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.leaderReviewed).toBe(true);
    expect(response.body.data.leaderReviewedBy).toBe(leaderId);
  });
  
  it('should block jobsheet completion with pending reviews', async () => {
    const response = await request(app)
      .post('/api/execution/exec-001/complete')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send();
    
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('PENDING_LEADER_REVIEWS');
    expect(response.body.error.details.pendingReviews).toBeGreaterThan(0);
  });
});
```

---

### E2E Testing

**Test Scenarios**:
1. Complete user flow (operator completes job, leader reviews)
2. Timeout behavior
3. Jobsheet completion blocking
4. Keyboard navigation
5. Cross-browser testing

**Example (Playwright)**:
```typescript
test('leader review flow', async ({ page }) => {
  // Login as operator
  await page.goto('/login');
  await page.fill('input[type="email"]', 'operator@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Complete a job
  await page.click('[data-testid="job-completion-checkbox"]');
  
  // Leader review modal should appear
  await expect(page.locator('[data-testid="leader-review-modal"]')).toBeVisible();
  
  // Enter leader password
  await page.fill('input[type="password"]', 'leaderpassword123');
  await page.click('[data-testid="approve-button"]');
  
  // Modal should close, checkbox should be checked
  await expect(page.locator('[data-testid="leader-review-modal"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="job-completion-checkbox"]')).toBeChecked();
});
```

---

## Performance Considerations

### Database Query Optimization

**Indexes**:
```sql
-- Efficient leader review status queries
CREATE INDEX idx_job_completions_leader_reviewed 
ON job_completions(execution_id, leader_reviewed);

-- Efficient leader review lookups by approver
CREATE INDEX idx_job_completions_leader_reviewed_by 
ON job_completions(leader_reviewed_by);
```

**Query Patterns**:
```sql
-- Check if all jobs have leader review (fast with index)
SELECT 
  execution_id,
  COUNT(*) as total_jobs,
  SUM(CASE WHEN leader_reviewed = 1 THEN 1 ELSE 0 END) as reviewed_jobs
FROM job_completions
WHERE execution_id = ?
GROUP BY execution_id
HAVING total_jobs = reviewed_jobs;
```

---

### Frontend Performance

**Optimizations**:
- Lazy load leader review modal (code-split)
- Cache leader review status in React Query/SWR
- Debounce password input (optional)
- Virtualize job list if >20 jobs per jobsheet

**Example (React Query)**:
```typescript
// Cache leader review status
const { data: reviewStatus } = useQuery({
  queryKey: ['leaderReview', executionId, jobId],
  queryFn: () => getLeaderReviewStatus(executionId, jobId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Invalidate cache on successful review
useMutation({
  mutationFn: (password: string) => submitLeaderReview(executionId, jobId, password),
  onSuccess: () => {
    queryClient.invalidateQueries(['leaderReview', executionId]);
  },
});
```

---

## Open Questions

1. **Should there be an override mechanism for unavailable leaders?**
   - Impact: High (security vs. usability trade-off)
   - Decision: Defer to future feature (escalation workflow)

2. **Should leader review be required for all jobs or only critical jobs?**
   - Impact: Medium (scope and user experience)
   - Decision: All jobs for now (can be refined later)

3. **Should there be a "batch review" feature for leaders to review multiple jobs at once?**
   - Impact: Medium (complexity vs. usability)
   - Decision: Defer to future feature (per-job review first)

4. **Should IP address be required or optional?**
   - Impact: Low (privacy vs. audit trail)
   - Decision: Optional (record if available, don't block if not)

---

## References

### Industry Standards

- **OWASP Authentication Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **WCAG 2.1 AA Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Modal Dialog Pattern**: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

### Security Best Practices

- **Password Storage**: bcrypt with salt rounds ≥ 10
- **HTTPS Only**: TLS 1.2+ for all communications
- **Rate Limiting**: 5 attempts per 10 minutes per user per job
- **Session Timeout**: 5 minutes for sensitive actions

### Accessibility Resources

- **axe-core**: https://www.deque.com/axe/core-documentation/api-documentation/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Playwright**: https://playwright.dev/

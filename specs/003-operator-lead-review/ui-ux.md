# UI/UX Considerations: Operator Leader Review

**Phase**: 2 (Implementation) | **Date**: 2026-06-22  
**Status**: Draft

## Overview

Design guidelines for implementing the operator leader review feature in the frontend, ensuring accessibility, usability, and security.

---

## User Interface Components

### 1. Job Completion Checkbox with Leader Review Status

**Location**: Execution jobsheet view, within each job card

**States**:
- **Unchecked**: Job not completed by operator
- **Checked (Pending Review)**: Job completed by operator, awaiting leader review (yellow/orange highlight)
- **Checked (Reviewed)**: Job completed and leader-reviewed (green highlight, read-only)
- **Disabled**: Job modification invalidates review (checkbox becomes unchecked and editable)

**Visual Design**:
```
┌─────────────────────────────────────┐
│ ✓ Oil Change                        │
│   Status: Completed by John Operator│
│   ⚠️ Pending Leader Review          │  ← Yellow highlight
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✓ Filter Replacement                │
│   Status: Completed by John Operator│
│   ✓ Approved by Jane Leader         │  ← Green highlight
│   2026-06-22 08:50                  │
└─────────────────────────────────────┘
```

**Accessibility**:
- Checkbox MUST have `aria-label` describing state
- Color MUST be supplemented with text/icons (not color-only indication)
- Keyboard navigation: Tab to focus, Enter/Space to toggle (if editable)
- Screen reader announcement: "Job completed, pending leader review" or "Job completed, approved by Jane Leader on June 22, 2026 at 8:50 AM"

---

### 2. Leader Review Modal Dialog

**Trigger**: User clicks unchecked job completion checkbox

**Components**:
- Modal overlay (backdrop)
- Modal container with:
  - Header: "Operator Leader Review Required"
  - Message: "The Operator Leader must review and approve this job. Please have the leader enter their password."
  - Job details: Job name, operator name, completion timestamp
  - Password input field (type="password")
  - Submit button: "Approve Job"
  - Cancel button: "Cancel"
  - Close icon (X) in top-right corner

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ Operator Leader Review Required      ✕ │
├─────────────────────────────────────────┤
│                                         │
│ The Operator Leader must review and    │
│ approve this job. Please have the      │
│ leader enter their password.           │
│                                         │
│ Job: Oil Change                         │
│ Completed by: John Operator             │
│ Completed at: 2026-06-22 08:45         │
│                                         │
│ Leader Password:                        │
│ ┌───────────────────────────────────┐  │
│ │ ••••••••••                        │  │
│ └───────────────────────────────────┘  │
│                                         │
│              [Cancel]  [Approve Job]   │
└─────────────────────────────────────────┘
```

**Behavior**:
- Modal is centered on screen
- Password field auto-focused on modal open
- Escape key closes modal (cancels review)
- Clicking backdrop closes modal (cancels review)
- Submit button disabled until password entered (min 1 character)
- Loading spinner shown during API call
- Error message displayed below password field if authentication fails

**Accessibility**:
- Modal MUST have `role="dialog"` and `aria-modal="true"`
- Header MUST have `aria-labelledby` pointing to modal title
- Password field MUST have `aria-label` or associated label
- Error messages MUST use `aria-live="polite"` for screen reader announcement
- Focus MUST be trapped within modal while open
- Focus MUST return to trigger element on modal close
- Color contrast MUST meet WCAG AA (4.5:1 for text)

---

### 3. Jobsheet Completion Button with Validation

**Location**: Bottom of execution jobsheet view

**States**:
- **Enabled**: All jobs are completed and leader-reviewed
- **Disabled**: One or more jobs are incomplete or pending leader review
- **Tooltip**: Shows reason for disabled state (e.g., "2 jobs pending leader review")

**Visual Design**:
```
┌─────────────────────────────────────┐
│ ⚠️ Cannot Complete: 2 jobs pending  │
│    leader review                    │
│                                     │
│    [Complete Jobsheet]              │  ← Disabled (grayed out)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│    [Complete Jobsheet]              │  ← Enabled (blue)
└─────────────────────────────────────┘
```

**Progress Indicator**:
```
Leader Reviews: 3 of 5 complete (60%)
┌─────────────────────────────────┐
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────┘
```

**Accessibility**:
- Disabled button MUST have `aria-disabled="true"`
- Tooltip MUST be announced by screen readers
- Progress indicator MUST have text label (not just visual bar)
- Keyboard navigation: Tab to button, Enter to trigger (if enabled)

---

### 4. Leader Review Summary Panel (Optional)

**Location**: Jobsheet detail view, sidebar or collapsible section

**Purpose**: Show overview of leader review status for all jobs

**Visual Design**:
```
┌─────────────────────────────────────┐
│ Leader Review Summary               │
├─────────────────────────────────────┤
│ ✓ Approved: 3 of 5 jobs             │
│ ⚠️ Pending: 2 jobs                  │
│                                     │
│ Job 1: Oil Change                   │
│   ✓ Approved by Jane Leader         │
│   2026-06-22 08:50                  │
│                                     │
│ Job 2: Filter Replacement           │
│   ⚠️ Pending review                 │
│                                     │
│ Job 3: Brake Inspection             │
│   ✓ Approved by Mike Leader         │
│   2026-06-22 09:15                  │
│                                     │
│ ...                                 │
└─────────────────────────────────────┘
```

**Accessibility**:
- Section MUST have heading level appropriate to document structure
- Status icons MUST have text alternatives
- List MUST be semantically structured (ul/li elements)

---

## User Flows

### Flow 1: Operator Completes Job, Leader Reviews

1. **Operator** views execution jobsheet
2. **Operator** completes all procedures for a job
3. **Operator** clicks job completion checkbox
4. **System** shows leader review modal
5. **Operator** calls Operator Leader to physical location
6. **Operator Leader** enters password in modal
7. **System** validates password
8. **System** records leader review
9. **Modal** closes, checkbox becomes checked and read-only (green)
10. **System** shows success notification: "Job approved by Jane Leader"

**Error Case**: Invalid password
- **System** shows error message: "Invalid password. Please try again."
- **Password** field is cleared
- **Modal** remains open for retry

---

### Flow 2: Operator Attempts to Complete Jobsheet with Pending Reviews

1. **Operator** completes all jobs and all leader reviews are done except 2
2. **Operator** clicks "Complete Jobsheet" button
3. **System** validates all jobs have leader review
4. **System** detects 2 pending reviews
5. **System** shows error modal: "Cannot complete jobsheet"
6. **Modal** displays: "All jobs must be reviewed by the Operator Leader before completion. 2 of 5 jobs pending review."
7. **Modal** lists pending jobs with names
8. **Operator** clicks "OK"
9. **Modal** closes, operator proceeds to complete remaining reviews

---

### Flow 3: Leader Review Timeout

1. **Operator** clicks job completion checkbox
2. **System** shows leader review modal
3. **Modal** starts 5-minute inactivity timer
4. **User** does not interact with modal for 5 minutes
5. **System** auto-closes modal
6. **System** shows notification: "Review session timed out. Please try again."
7. **Job** completion checkbox becomes unchecked
8. **Operator** must restart the review process

---

### Flow 4: Job Modified After Leader Review

1. **Operator** completes job and leader reviews it (green checkbox)
2. **Operator** realizes a procedure was missed
3. **Operator** clicks "Edit Job" button
4. **System** shows warning: "Modifying this job will invalidate the leader review. The job will need to be re-reviewed by the Operator Leader."
5. **Operator** confirms modification
6. **System** invalidates leader review (checkbox becomes unchecked, yellow)
7. **Operator** makes changes and saves
8. **Job** requires new leader review before jobsheet can be completed

---

## Accessibility Requirements

### WCAG AA Compliance Checklist

- [ ] **1.4.1 Use of Color**: Status indicators (pending/approved) use color + icons + text
- [ ] **1.4.3 Contrast (Minimum)**: All text has 4.5:1 contrast ratio
- [ ] **2.1.1 Keyboard**: All controls accessible via keyboard (Tab, Enter, Space, Escape)
- [ ] **2.4.3 Focus Order**: Logical tab order through modal elements
- [ ] **2.4.7 Focus Visible**: All focusable elements have visible focus indicator
- [ ] **3.3.1 Error Identification**: Error messages clearly identify the problem
- [ ] **3.3.2 Labels or Instructions**: Password field has clear label
- [ ] **4.1.2 Name, Role, Value**: Modal has proper ARIA roles and labels
- [ ] **4.1.3 Status Messages**: Success/error notifications announced to screen readers

### Keyboard Navigation

**Modal Dialog**:
- `Tab`: Move focus to next focusable element
- `Shift+Tab`: Move focus to previous focusable element
- `Enter` or `Space`: Activate button
- `Escape`: Close modal (cancel review)

**Focus Management**:
- On modal open: Focus moves to password field
- On modal close: Focus returns to trigger element (checkbox)
- Focus is trapped within modal while open

---

## Error Handling

### Client-Side Validation

- Password field: Required, min 1 character
- Submit button: Disabled until password entered
- Modal close on escape: Cancel review, revert job completion

### Server-Side Validation

- Invalid password: Show generic error "Invalid password"
- Job not completed: Show error "Job must be marked complete before leader review"
- User not Operator Leader: Show error "User does not have Operator Leader role"
- Network error: Show error "Failed to submit review. Please try again."

### Error Message Guidelines

- Use clear, non-technical language
- Explain what went wrong and how to fix it
- Do not reveal sensitive information (e.g., "User not found" vs "Invalid password")
- Provide actionable next steps

---

## Responsive Design

### Desktop (≥1024px)

- Modal: 500px width, centered
- Job cards: Grid layout (2-3 columns)
- Leader review summary: Sidebar panel

### Tablet (768px - 1023px)

- Modal: 90% width, centered
- Job cards: Grid layout (2 columns)
- Leader review summary: Collapsible section below jobs

### Mobile (≤767px)

- Modal: 100% width and height (full-screen)
- Job cards: Single column layout
- Leader review summary: Collapsible accordion

---

## Security Considerations

### Frontend Security

- Password field: `type="password"` to mask input
- No password logging in browser console
- HTTPS-only communication
- JWT token stored in secure, httpOnly cookie (not localStorage)
- Session timeout: 5 minutes for leader review modal
- Input sanitization: Escape all user-generated content

### XSS Prevention

- Escape all dynamic content rendered in the UI
- Use React's built-in XSS protection (no `dangerouslySetInnerHTML`)
- Validate API responses before rendering

### CSRF Protection

- Include CSRF token in all state-changing requests
- Validate token on server side

---

## Performance Considerations

### Optimizations

- Lazy load leader review modal (code-split)
- Debounce password input validation (optional)
- Cache leader review status in React Query/SWR
- Optimistic UI updates (show loading state immediately)
- Virtualize job list if >20 jobs per jobsheet

### Loading States

- Modal open: Show loading spinner on submit button
- API call in progress: Disable modal, show spinner
- Success: Show success notification, close modal
- Failure: Show error message, keep modal open

---

## Testing Requirements

### Unit Tests

- Modal component renders correctly in all states
- Password validation logic
- Timeout behavior
- Keyboard event handlers

### Integration Tests

- Leader review API integration
- Error handling and display
- Success flow and state updates

### E2E Tests

- Complete user flow (operator + leader)
- Timeout behavior
- Keyboard navigation
- Screen reader testing
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Accessibility Tests

- Automated: axe-core in CI pipeline
- Manual: Keyboard navigation testing
- Manual: Screen reader testing (NVDA, VoiceOver)
- Manual: Color contrast verification

---

## Component Structure

```
src/components/execution/
├── LeaderReviewModal.tsx
│   ├── ModalHeader
│   ├── JobInfo
│   ├── PasswordInput
│   ├── SubmitButton
│   └── CancelButton
├── JobCompletionCheckbox.tsx
│   ├── Checkbox
│   ├── StatusIndicator
│   └── LeaderReviewInfo
├── JobsheetCompletionButton.tsx
│   ├── ValidationCheck
│   ├── ProgressBar
│   └── Tooltip
└── LeaderReviewSummary.tsx
    ├── SummaryHeader
    ├── JobReviewList
    └── ReviewItem
```

---

## State Management

### Leader Review Modal State

```typescript
interface LeaderReviewModalState {
  isOpen: boolean;
  jobId: string | null;
  executionId: string | null;
  jobName: string | null;
  password: string;
  isLoading: boolean;
  error: string | null;
  timeoutTimer: NodeJS.Timeout | null;
}
```

### Actions

- `openModal(jobId, executionId, jobName)`: Open modal with job details
- `closeModal()`: Close modal and reset state
- `setPassword(password)`: Update password field
- `submitReview()`: Submit leader review to API
- `handleTimeout()`: Handle modal timeout
- `clearError()`: Clear error message

---

## Design Tokens

### Colors

```css
:root {
  /* Status colors */
  --color-pending: #f59e0b;      /* Amber/Yellow */
  --color-approved: #10b981;     /* Green */
  --color-error: #ef4444;        /* Red */
  
  /* Modal colors */
  --modal-bg: #ffffff;
  --modal-overlay: rgba(0, 0, 0, 0.5);
  --modal-border: #e5e7eb;
  
  /* Text colors */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-disabled: #9ca3af;
}
```

### Spacing

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
}
```

### Typography

```css
:root {
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  
  --line-height-tight: 1.25;
  --line-height-base: 1.5;
}
```

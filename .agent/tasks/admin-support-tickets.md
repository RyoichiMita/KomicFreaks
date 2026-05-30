# Admin Support Tickets System

## Overview
Build an admin portal page for managing student support tickets with two-way sync (app + Telegram).

## Architecture
- **Tables**: Reuse existing `feedback_tickets` + `ticket_messages` (already used by student-side)
- **Student side**: Existing `FeedbackChatSheet` (rename label to "Support")
- **Admin side**: New full screen with ticket list + detail chat
- **Telegram**: Existing Edge Function for alerts; admin replies sync to both app and Telegram

## Tasks

### Phase 1: Admin Screen
- [ ] Create `AdminSupportTicketsScreen` — ticket list with filters (Open/In-Progress/Resolved)
- [ ] Create `AdminTicketDetailScreen` — chat view with reply capability
- [ ] Priority = sorted by `created_at` ASC (oldest open first)
- [ ] Add route `/admin/support-tickets` to router
- [ ] Add tile to `AdminDashboardScreen`

### Phase 2: Two-Way Sync
- [ ] Admin reply → saves to `ticket_messages` + sends Telegram notification
- [ ] Real-time subscription for live message updates
- [ ] Status management: open → in-progress (on first reply) → resolved

### Phase 3: Polish
- [ ] Ticket count badge on admin dashboard tile
- [ ] Category filter chips (Technical, Content, Account, General, Other)
- [ ] Student name and email visible in ticket header

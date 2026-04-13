
'use client';

import { AppShell } from "@/components/app-shell";
import NotificationsFeed from "@/components/notifications-feed";

export default function NotificationsPage() {
  return (
    <AppShell>
      <NotificationsFeed />
    </AppShell>
  );
}

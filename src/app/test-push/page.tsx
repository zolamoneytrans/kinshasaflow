'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { sendTestPushNotificationAction } from '@/app/actions';
import { PushSubscription } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function TestPushPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSendNotification = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You must be logged in to test push notifications.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const subscriptionsRef = collection(firestore, 'users', user.uid, 'pushSubscriptions');
      const q = query(subscriptionsRef);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "No subscription found", description: "Please allow notifications first.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      let notificationsSent = 0;
      const payload = JSON.stringify({
        title: 'Hello from Kinshasa Flow!',
        body: 'This is a test push notification.',
        icon: '/icon.svg',
      });

      for (const doc of querySnapshot.docs) {
        const subscription = doc.data() as PushSubscription;
        const result = await sendTestPushNotificationAction(subscription, payload);
        if (result.success) {
          notificationsSent++;
        }
      }

      if (notificationsSent > 0) {
        toast({ title: "Notification sent!", description: `Sent to ${notificationsSent} device(s). It should arrive shortly.` });
      } else {
        toast({ title: "Failed to send notification", description: "Could not send a notification. Please check console for errors.", variant: "destructive" });
      }

    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({ title: "An error occurred", description: "Could not send the test notification.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Test Push Notifications</CardTitle>
            <CardDescription>Click the button below to send a test push notification to your subscribed devices.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSendNotification} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Test Notification
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Make sure you have granted notification permissions for this site. The notification may take a few moments to arrive.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

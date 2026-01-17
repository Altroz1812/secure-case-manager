import { useState } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const notificationTypeLabels: Record<string, string> = {
  task_assignment: 'Task Assignment',
  sla_warning: 'SLA Warning',
  reassignment: 'Reassignment',
  qc_approved: 'QC Approved',
  qc_rejected: 'QC Rejected',
  info: 'Information',
};

const notificationTypeBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  task_assignment: 'default',
  sla_warning: 'destructive',
  reassignment: 'secondary',
  qc_approved: 'default',
  qc_rejected: 'destructive',
  info: 'outline',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { notifications, isLoading, unreadCount } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const filteredNotifications = filter === 'unread' 
    ? notifications?.filter(n => !n.is_read) 
    : notifications;

  const groupedNotifications = filteredNotifications?.reduce((groups, notification) => {
    const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your tasks and activities
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/settings">
              Notification Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications?.length ? ` (${notifications.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && ` (${unreadCount})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredNotifications?.length ? (
        <div className="space-y-6">
          {Object.entries(groupedNotifications || {}).map(([date, dateNotifications]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {dateNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      'transition-colors',
                      !notification.is_read && 'border-primary/50 bg-primary/5'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          notification.is_read ? 'bg-muted' : 'bg-primary/10'
                        )}>
                          <Bell className={cn(
                            'h-5 w-5',
                            notification.is_read ? 'text-muted-foreground' : 'text-primary'
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  'text-sm',
                                  !notification.is_read && 'font-semibold'
                                )}>
                                  {notification.title}
                                </p>
                                <Badge variant={notificationTypeBadgeVariants[notification.type || 'info'] || 'outline'}>
                                  {notificationTypeLabels[notification.type || 'info'] || notification.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markRead.mutate(notification.id)}
                                  disabled={markRead.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {notification.action_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={notification.action_url}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'unread' 
                ? "You've read all your notifications" 
                : "You don't have any notifications yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

async function getAnnouncements() {
  return db.announcement.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
      publishAt: { lte: new Date() },
    },
    orderBy: [{ priority: 'desc' }, { publishAt: 'desc' }],
  });
}

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const announcements = await getAnnouncements();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Important notices and updates from the PG"
      />

      {announcements.length > 0 ? (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={
                announcement.priority === 'urgent'
                  ? 'border-red-200 bg-red-50'
                  : announcement.priority === 'important'
                    ? 'border-orange-200 bg-orange-50'
                    : ''
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                  </div>
                  {announcement.priority !== 'normal' && (
                    <Badge
                      variant={announcement.priority === 'urgent' ? 'overdue' : 'partial'}
                    >
                      {announcement.priority}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t">
                  <span>Published: {formatDate(announcement.publishAt)}</span>
                  {announcement.expiresAt && (
                    <span>Expires: {formatDate(announcement.expiresAt)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No announcements at this time</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { UserRole } from '@prisma/client';

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    role: UserRole;
    image: string | null;
    createdAt: Date;
    isActive: boolean;
  };
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  STAFF: 'Staff',
  TENANT: 'Tenant',
};

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive'> = {
  ADMIN: 'default',
  STAFF: 'secondary',
  TENANT: 'destructive',
};

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Name</span>
          <span className="text-sm font-semibold">{user.name}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Phone</span>
          <span className="text-sm font-semibold">{user.phone}</span>
        </div>
      </div>

      {user.email && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Email</span>
            <span className="text-sm font-semibold">{user.email}</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Role</span>
          <Badge variant={roleColors[user.role]}>
            {roleLabels[user.role]}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Status</span>
          <Badge variant={user.isActive ? 'default' : 'secondary'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Member Since</span>
          <span className="text-sm font-semibold">{formatDate(user.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}


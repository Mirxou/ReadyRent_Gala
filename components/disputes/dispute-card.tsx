'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Dispute {
  id: number;
  booking_id?: number;
  dispute_type: string;
  status: string;
  subject: string;
  description?: string;
  created_at: string;
  updated_at: string;
  messages_count?: number;
}

interface DisputeCardProps {
  dispute: Dispute;
  onStatusChange?: (id: number, status: string) => void;
}

export function DisputeCard({ dispute, onStatusChange }: DisputeCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { label: 'مفتوح', variant: 'default' },
      in_progress: { label: 'قيد المعالجة', variant: 'default' },
      resolved: { label: 'محلول', variant: 'secondary' },
      closed: { label: 'مغلق', variant: 'outline' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'damage':
        return <AlertCircle className="h-4 w-4" />;
      case 'refund':
        return <XCircle className="h-4 w-4" />;
      case 'delivery':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getTypeIcon(dispute.dispute_type)}
            <div>
              <CardTitle className="text-lg">{dispute.subject}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {dispute.dispute_type}
              </p>
            </div>
          </div>
          {getStatusBadge(dispute.status)}
        </div>
      </CardHeader>
      <CardContent>
        {dispute.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {dispute.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {dispute.messages_count !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{dispute.messages_count} رسالة</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(dispute.created_at), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/disputes/${dispute.id}`}>
              عرض التفاصيل
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


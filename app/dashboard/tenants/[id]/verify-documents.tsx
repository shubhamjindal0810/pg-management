'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { verifyDocument, rejectDocument } from './document-actions';

interface VerifyDocumentsProps {
  tenantId: string;
  documents: Array<{
    id: string;
    documentType: string;
    documentNumber: string | null;
    fileName: string;
    isVerified: boolean;
    fileUrl: string;
  }>;
}

export function VerifyDocuments({ tenantId, documents }: VerifyDocumentsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleVerify = async (documentId: string) => {
    setIsLoading(documentId);
    try {
      await verifyDocument(documentId);
      toast.success('Document verified successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify document');
    } finally {
      setIsLoading(null);
    }
  };

  const handleReject = async (documentId: string) => {
    setIsLoading(documentId);
    try {
      await rejectDocument(documentId);
      toast.success('Document rejected');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject document');
    } finally {
      setIsLoading(null);
    }
  };

  const unverifiedDocs = documents.filter((doc) => !doc.isVerified);

  if (unverifiedDocs.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-900">All documents are verified</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Pending Document Verification</h3>
      {unverifiedDocs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{doc.documentType}</p>
              {doc.documentNumber && (
                <span className="text-sm text-muted-foreground">({doc.documentNumber})</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{doc.fileName}</p>
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                View Document
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVerify(doc.id)}
              loading={isLoading === doc.id}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReject(doc.id)}
              loading={isLoading === doc.id}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}


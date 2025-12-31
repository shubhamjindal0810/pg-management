'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { uploadDocument } from './actions';
import { formatDate } from '@/lib/utils';

interface OnboardingFormProps {
  tenantId: string;
  existingDocuments: Array<{
    id: string;
    documentType: string;
    documentNumber: string | null;
    fileName: string;
    isVerified: boolean;
    createdAt: Date;
  }>;
}

export function OnboardingForm({ tenantId, existingDocuments }: OnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAadhaarUploading, setIsAadhaarUploading] = useState(false);
  const [isIdUploading, setIsIdUploading] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState('PAN');

  const hasAadhaar = existingDocuments.some((doc) => doc.documentType === 'AADHAR');
  const hasId = existingDocuments.some(
    (doc) => doc.documentType === 'PAN' || doc.documentType === 'DRIVING_LICENSE'
  );

  const handleAadhaarUpload = async () => {
    if (!aadhaarFile) {
      toast.error('Please select a file');
      return;
    }

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsAadhaarUploading(true);
    try {
      // Upload to Vercel Blob
      const formData = new FormData();
      formData.append('file', aadhaarFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      const data = await response.json();
      const fileUrl = data.url;

      await uploadDocument({
        tenantId,
        documentType: 'AADHAR',
        documentNumber: aadhaarNumber,
        fileData: fileUrl,
        fileName: aadhaarFile.name,
      });

      toast.success('Aadhaar document uploaded successfully. Waiting for admin verification.');
      setAadhaarFile(null);
      setAadhaarNumber('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsAadhaarUploading(false);
    }
  };

  const handleIdUpload = async () => {
    if (!idFile) {
      toast.error('Please select a file');
      return;
    }

    if (!idNumber) {
      toast.error('Please enter document number');
      return;
    }

    setIsIdUploading(true);
    try {
      // Upload to Vercel Blob
      const formData = new FormData();
      formData.append('file', idFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      const data = await response.json();
      const fileUrl = data.url;

      await uploadDocument({
        tenantId,
        documentType: idType as any,
        documentNumber: idNumber,
        fileData: fileUrl,
        fileName: idFile.name,
      });

      toast.success('ID document uploaded successfully. Waiting for admin verification.');
      setIdFile(null);
      setIdNumber('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsIdUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aadhaar Card (Required)</CardTitle>
          <CardDescription>
            Upload a clear photo of your Aadhaar card. This is required for verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasAadhaar && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Aadhaar document uploaded
                </span>
              </div>
              {existingDocuments
                .filter((doc) => doc.documentType === 'AADHAR')
                .map((doc) => (
                  <div key={doc.id} className="mt-2 text-sm">
                    <p className="text-muted-foreground">
                      Status:{' '}
                      <Badge variant={doc.isVerified ? 'available' : 'secondary'}>
                        {doc.isVerified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground">
                      Uploaded: {formatDate(doc.createdAt)}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {!hasAadhaar && (
            <>
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                <Input
                  id="aadhaarNumber"
                  type="text"
                  placeholder="1234 5678 9012"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaarFile">Aadhaar Card Photo *</Label>
                <Input
                  id="aadhaarFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                />
                {aadhaarFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{aadhaarFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setAadhaarFile(null)}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <Button onClick={handleAadhaarUpload} loading={isAadhaarUploading} disabled={!aadhaarFile || !aadhaarNumber || isAadhaarUploading}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Aadhaar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proof of ID (Required)</CardTitle>
          <CardDescription>
            Upload a photo of your ID card (PAN, Driving License, or Passport)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasId && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">ID document uploaded</span>
              </div>
              {existingDocuments
                .filter((doc) => ['PAN', 'DRIVING_LICENSE', 'PASSPORT'].includes(doc.documentType))
                .map((doc) => (
                  <div key={doc.id} className="mt-2 text-sm">
                    <p className="text-muted-foreground">
                      Type: {doc.documentType} | Status:{' '}
                      <Badge variant={doc.isVerified ? 'available' : 'secondary'}>
                        {doc.isVerified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground">
                      Uploaded: {formatDate(doc.createdAt)}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {!hasId && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type *</Label>
                  <select
                    id="idType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  >
                    <option value="PAN">PAN Card</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">Document Number *</Label>
                  <Input
                    id="idNumber"
                    type="text"
                    placeholder="Enter document number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idFile">ID Card Photo *</Label>
                <Input
                  id="idFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                />
                {idFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{idFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setIdFile(null)}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <Button onClick={handleIdUpload} loading={isIdUploading} disabled={!idFile || !idNumber || isIdUploading}>
                <Upload className="mr-2 h-4 w-4" />
                Upload ID
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> After uploading your documents, the admin will review and
              verify them. You'll be notified once your documents are verified. You can access all
              features once your Aadhaar is verified.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


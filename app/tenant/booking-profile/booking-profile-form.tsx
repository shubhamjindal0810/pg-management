'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateBookingProfile, uploadBookingDocument } from './actions';
import { formatDate } from '@/lib/utils';

interface BookingProfileFormProps {
  tenantId: string;
  bookingId: string;
  existingData: {
    dateOfBirth?: Date | null;
    gender?: string | null;
    bloodGroup?: string | null;
    occupation?: string | null;
    workplaceCollege?: string | null;
    workAddress?: string | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    emergencyRelation?: string | null;
    notes?: string | null;
    documents?: Array<{
      id: string;
      documentType: string;
      documentNumber: string | null;
      fileName: string;
      isVerified: boolean;
      createdAt: Date;
    }>;
  };
}

export function BookingProfileForm({
  tenantId,
  bookingId,
  existingData,
}: BookingProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAadhaarUploading, setIsAadhaarUploading] = useState(false);
  const [isIdUploading, setIsIdUploading] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState('PAN');

  const hasAadhaar = existingData.documents?.some((doc) => doc.documentType === 'AADHAR');
  const hasId = existingData.documents?.some(
    (doc) => doc.documentType === 'PAN' || doc.documentType === 'DRIVING_LICENSE'
  );

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      dateOfBirth: formatDateForInput(existingData.dateOfBirth),
      gender: existingData.gender || '',
      bloodGroup: existingData.bloodGroup || '',
      occupation: existingData.occupation || '',
      workplaceCollege: existingData.workplaceCollege || '',
      workAddress: existingData.workAddress || '',
      emergencyName: existingData.emergencyName || '',
      emergencyPhone: existingData.emergencyPhone || '',
      emergencyRelation: existingData.emergencyRelation || '',
      notes: existingData.notes || '',
    },
  });

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

      await uploadBookingDocument({
        tenantId,
        documentType: 'AADHAR',
        documentNumber: aadhaarNumber,
        fileData: fileUrl,
        fileName: aadhaarFile.name,
      });

      toast.success('Aadhaar document uploaded successfully');
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

      await uploadBookingDocument({
        tenantId,
        documentType: idType as any,
        documentNumber: idNumber,
        fileData: fileUrl,
        fileName: idFile.name,
      });

      toast.success('ID document uploaded successfully');
      setIdFile(null);
      setIdNumber('');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsIdUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await updateBookingProfile(tenantId, data);
      toast.success('Profile updated successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select onValueChange={(value) => setValue('bloodGroup', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work/College */}
      <Card>
        <CardHeader>
          <CardTitle>Work / College Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Select onValueChange={(value) => setValue('occupation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">Working Professional</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workplaceCollege">Company / College Name</Label>
              <Input
                id="workplaceCollege"
                placeholder="ABC Corp / XYZ University"
                {...register('workplaceCollege')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="workAddress">Work / College Address</Label>
              <Input id="workAddress" placeholder="Full address" {...register('workAddress')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Contact Name *</Label>
              <Input
                id="emergencyName"
                placeholder="Parent / Guardian name"
                {...register('emergencyName', { required: 'Emergency contact name is required' })}
                error={errors.emergencyName?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Contact Phone *</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                placeholder="9876543210"
                {...register('emergencyPhone', {
                  required: 'Emergency contact phone is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit Indian phone number',
                  },
                })}
                error={errors.emergencyPhone?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyRelation">Relationship *</Label>
              <Input
                id="emergencyRelation"
                placeholder="Father / Mother / etc."
                {...register('emergencyRelation', { required: 'Relationship is required' })}
                error={errors.emergencyRelation?.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents - Same as onboarding */}
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
              {existingData.documents
                ?.filter((doc) => doc.documentType === 'AADHAR')
                .map((doc) => (
                  <div key={doc.id} className="mt-2 text-sm">
                    <p className="text-muted-foreground">
                      Status:{' '}
                      <Badge variant={doc.isVerified ? 'available' : 'secondary'}>
                        {doc.isVerified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground">Uploaded: {formatDate(doc.createdAt)}</p>
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
              </div>

              <Button type="button" onClick={handleAadhaarUpload} loading={isAadhaarUploading} disabled={!aadhaarFile || !aadhaarNumber || isAadhaarUploading}>
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
              {existingData.documents
                ?.filter((doc) => ['PAN', 'DRIVING_LICENSE', 'PASSPORT'].includes(doc.documentType))
                .map((doc) => (
                  <div key={doc.id} className="mt-2 text-sm">
                    <p className="text-muted-foreground">
                      Type: {doc.documentType} | Status:{' '}
                      <Badge variant={doc.isVerified ? 'available' : 'secondary'}>
                        {doc.isVerified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground">Uploaded: {formatDate(doc.createdAt)}</p>
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
              </div>

              <Button type="button" onClick={handleIdUpload} loading={isIdUploading} disabled={!idFile || !idNumber || isIdUploading}>
                <Upload className="mr-2 h-4 w-4" />
                Upload ID
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            placeholder="Any additional information..."
            rows={3}
            {...register('notes')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" loading={isLoading}>
          Save Profile
        </Button>
      </div>
    </form>
  );
}


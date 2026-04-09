'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IDUpload } from '@/components/id-upload';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Clock, AlertCircle, Phone, MapPin, CreditCard, Building2 } from 'lucide-react';

interface VerificationStatus {
  id: number;
  status: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected';
  id_type: string;
  id_number: string;
  phone_verified: boolean;
  address_verified: boolean;
  risk_score: number;
  is_blacklisted: boolean;
  verified_at: string | null;
  rejection_reason: string;
}

export default function VerificationPage() {
  const { toast } = useToast();
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneCode, setPhoneCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [addressData, setAddressData] = useState({
    address: '',
    city: 'Constantine',
    postal_code: '',
  });
  const [businessData, setBusinessData] = useState({
    business_name: '',
    commercial_register_number: '',
    tax_id: '',
    nis_number: '',
    legal_representative_name: '',
    legal_representative_id: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await api.get('/auth/verification/');
      setVerification(response.data);
    } catch (error: any) {
      console.error('Error loading verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneVerification = async () => {
    setSendingCode(true);
    try {
      await api.post('/auth/verification/phone/request/');
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رمز التحقق إلى رقم هاتفك',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل إرسال رمز التحقق',
        variant: 'destructive',
      });
    } finally {
      setSendingCode(false);
    }
  };

  const verifyPhone = async () => {
    if (!phoneCode) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رمز التحقق',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingCode(true);
    try {
      await api.post('/auth/verification/phone/verify/', { code: phoneCode });
      toast({
        title: 'تم التحقق',
        description: 'تم التحقق من رقم الهاتف بنجاح',
      });
      loadVerificationStatus();
      setPhoneCode('');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'رمز التحقق غير صحيح',
        variant: 'destructive',
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  const verifyAddress = async () => {
    if (!addressData.address || !addressData.city) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال العنوان والمدينة',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post('/auth/verification/address/', addressData);
      toast({
        title: 'تم التحقق',
        description: 'تم التحقق من العنوان بنجاح',
      });
      loadVerificationStatus();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل التحقق من العنوان',
        variant: 'destructive',
      });
    }
  };

  const saveBusinessProfile = async () => {
    if (!businessData.business_name) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم الشركة',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.patch('/auth/kyb/business/', businessData);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ بيانات KYB بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل حفظ بيانات KYB',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: VerificationStatus['status']) => {
    const badges = {
      pending: <Badge variant="outline">قيد الانتظار</Badge>,
      submitted: <Badge className="bg-blue-500">تم الإرسال</Badge>,
      under_review: <Badge className="bg-yellow-500">قيد المراجعة</Badge>,
      verified: <Badge className="bg-green-500">تم التحقق</Badge>,
      rejected: <Badge className="bg-red-500">مرفوض</Badge>,
    };
    return badges[status];
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">التحقق من الهوية</h1>
        <p className="text-muted-foreground">أكمل عملية التحقق للتمكن من إجراء الحجوزات</p>
      </div>

      {verification && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>حالة التحقق</CardTitle>
              {getStatusBadge(verification.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">نقاط المخاطر</p>
                <p className={`text-2xl font-bold ${getRiskColor(verification.risk_score)}`}>
                  {verification.risk_score}
                </p>
              </div>
              {verification.verified_at && (
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ التحقق</p>
                  <p className="font-medium">
                    {new Date(verification.verified_at).toLocaleDateString('ar')}
                  </p>
                </div>
              )}
            </div>

            {verification.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm font-medium text-red-800">سبب الرفض:</p>
                <p className="text-sm text-red-600">{verification.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            رفع الهوية
          </CardTitle>
          <CardDescription>قم برفع صور الهوية الوطنية أو جواز السفر</CardDescription>
        </CardHeader>
        <CardContent>
          <IDUpload onComplete={loadVerificationStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            التحقق التجاري (KYB)
          </CardTitle>
          <CardDescription>أضف بيانات الشركة أو المؤسسة للمراجعة التجارية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business_name">اسم الشركة</Label>
              <Input id="business_name" value={businessData.business_name} onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="commercial_register_number">السجل التجاري</Label>
              <Input id="commercial_register_number" value={businessData.commercial_register_number} onChange={(e) => setBusinessData({ ...businessData, commercial_register_number: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="tax_id">الرقم الجبائي</Label>
              <Input id="tax_id" value={businessData.tax_id} onChange={(e) => setBusinessData({ ...businessData, tax_id: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="nis_number">رقم NIS</Label>
              <Input id="nis_number" value={businessData.nis_number} onChange={(e) => setBusinessData({ ...businessData, nis_number: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="legal_representative_name">الممثل القانوني</Label>
              <Input id="legal_representative_name" value={businessData.legal_representative_name} onChange={(e) => setBusinessData({ ...businessData, legal_representative_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="legal_representative_id">هوية الممثل القانوني</Label>
              <Input id="legal_representative_id" value={businessData.legal_representative_id} onChange={(e) => setBusinessData({ ...businessData, legal_representative_id: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="business_city">المدينة</Label>
              <Input id="business_city" value={businessData.city} onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="business_address">العنوان</Label>
              <Input id="business_address" value={businessData.address} onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })} />
            </div>
          </div>
          <Button onClick={saveBusinessProfile}>حفظ بيانات KYB</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            التحقق من رقم الهاتف
          </CardTitle>
          <CardDescription>تحقق من رقم هاتفك عبر رمز SMS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verification?.phone_verified ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>تم التحقق من رقم الهاتف</span>
            </div>
          ) : (
            <>
              <Button onClick={requestPhoneVerification} disabled={sendingCode}>
                {sendingCode ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </Button>
              <div className="flex gap-2">
                <Input
                  placeholder="أدخل رمز التحقق"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  maxLength={6}
                />
                <Button onClick={verifyPhone} disabled={verifyingCode || !phoneCode}>
                  {verifyingCode ? 'جاري التحقق...' : 'تحقق'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            التحقق من العنوان
          </CardTitle>
          <CardDescription>أدخل عنوانك للتحقق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verification?.address_verified ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>تم التحقق من العنوان</span>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={addressData.address}
                  onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                  placeholder="أدخل العنوان الكامل"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">الرمز البريدي</Label>
                  <Input
                    id="postal_code"
                    value={addressData.postal_code}
                    onChange={(e) => setAddressData({ ...addressData, postal_code: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={verifyAddress}>تحقق من العنوان</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



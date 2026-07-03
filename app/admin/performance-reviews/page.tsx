'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface PerformanceReview {
  id: number;
  staff: number;
  staff_email: string;
  staff_name?: string;
  reviewed_by: number;
  reviewed_by_email: string;
  reviewed_by_name?: string;
  review_period_start: string;
  review_period_end: string;
  overall_rating: number;
  punctuality_rating: number;
  quality_rating: number;
  communication_rating: number;
  strengths: string;
  areas_for_improvement: string;
  goals: string;
  comments: string;
  reviewed_at: string;
}

interface User {
  id: number;
  email: string;
  profile?: {
    first_name_ar: string;
    last_name_ar: string;
  };
}

const RATING_LABELS: Record<number, string> = {
  1: 'ضعيف',
  2: 'أقل من المتوسط',
  3: 'متوسط',
  4: 'جيد',
  5: 'ممتاز',
};

export default function AdminPerformanceReviewsPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [formData, setFormData] = useState({
    staff: '',
    review_period_start: '',
    review_period_end: '',
    overall_rating: '3',
    punctuality_rating: '3',
    quality_rating: '3',
    communication_rating: '3',
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    comments: '',
  });

  useEffect(() => {
    fetchReviews();
    fetchStaff();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/users/staff/performance-reviews/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/users/staff/list/');
      if (response.ok) {
        const data = await response.json();
        setStaff(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleCreateReview = () => {
    setSelectedReview(null);
    setFormData({
      staff: '',
      review_period_start: '',
      review_period_end: '',
      overall_rating: '3',
      punctuality_rating: '3',
      quality_rating: '3',
      communication_rating: '3',
      strengths: '',
      areas_for_improvement: '',
      goals: '',
      comments: '',
    });
    setOpen(true);
  };

  const handleViewReview = (review: PerformanceReview) => {
    setSelectedReview(review);
    setFormData({
      staff: review.staff.toString(),
      review_period_start: review.review_period_start,
      review_period_end: review.review_period_end,
      overall_rating: review.overall_rating.toString(),
      punctuality_rating: review.punctuality_rating.toString(),
      quality_rating: review.quality_rating.toString(),
      communication_rating: review.communication_rating.toString(),
      strengths: review.strengths || '',
      areas_for_improvement: review.areas_for_improvement || '',
      goals: review.goals || '',
      comments: review.comments || '',
    });
    setOpen(true);
  };

  const handleSaveReview = async () => {
    if (!formData.staff || !formData.review_period_start || !formData.review_period_end) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = selectedReview
        ? `/api/users/staff/performance-reviews/${selectedReview.id}/`
        : '/api/users/staff/performance-reviews/';
      const method = selectedReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          staff: parseInt(formData.staff),
          overall_rating: parseInt(formData.overall_rating),
          punctuality_rating: parseInt(formData.punctuality_rating),
          quality_rating: parseInt(formData.quality_rating),
          communication_rating: parseInt(formData.communication_rating),
        }),
      });

      if (response.ok) {
        setOpen(false);
        fetchReviews();
      } else {
        const error = await response.json();
        alert(error.detail || 'حدث خطأ أثناء حفظ التقييم');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      alert('حدث خطأ أثناء حفظ التقييم');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">تقييمات الأداء</h1>
          <p className="text-gray-600">تقييم أداء الموظفين</p>
        </div>
        <Button onClick={handleCreateReview}>إضافة تقييم جديد</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>فترة التقييم</TableHead>
                <TableHead>التقييم العام</TableHead>
                <TableHead>الوقت</TableHead>
                <TableHead>الجودة</TableHead>
                <TableHead>التواصل</TableHead>
                <TableHead>تم التقييم بواسطة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    لا توجد تقييمات
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>{review.staff_name || review.staff_email}</TableCell>
                    <TableCell>
                      {new Date(review.review_period_start).toLocaleDateString('ar-SA')} -{' '}
                      {new Date(review.review_period_end).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {review.overall_rating} - {RATING_LABELS[review.overall_rating]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {review.punctuality_rating} - {RATING_LABELS[review.punctuality_rating]}
                    </TableCell>
                    <TableCell>
                      {review.quality_rating} - {RATING_LABELS[review.quality_rating]}
                    </TableCell>
                    <TableCell>
                      {review.communication_rating} - {RATING_LABELS[review.communication_rating]}
                    </TableCell>
                    <TableCell>{review.reviewed_by_name || review.reviewed_by_email}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewReview(review)}>
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReview ? 'عرض تقييم الأداء' : 'إضافة تقييم أداء جديد'}
            </DialogTitle>
            <DialogDescription>تقييم أداء الموظف لفترة محددة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staff">الموظف</Label>
              <Select
                value={formData.staff}
                onValueChange={(value) => setFormData({ ...formData, staff: value })}
                disabled={!!selectedReview}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.profile ? `${s.profile.first_name_ar} ${s.profile.last_name_ar}` : s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="review_period_start">بداية فترة التقييم</Label>
                <Input
                  id="review_period_start"
                  type="date"
                  value={formData.review_period_start}
                  onChange={(e) => setFormData({ ...formData, review_period_start: e.target.value })}
                  disabled={!!selectedReview}
                />
              </div>
              <div>
                <Label htmlFor="review_period_end">نهاية فترة التقييم</Label>
                <Input
                  id="review_period_end"
                  type="date"
                  value={formData.review_period_end}
                  onChange={(e) => setFormData({ ...formData, review_period_end: e.target.value })}
                  disabled={!!selectedReview}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="overall_rating">التقييم العام</Label>
                <Select
                  value={formData.overall_rating}
                  onValueChange={(value) => setFormData({ ...formData, overall_rating: value })}
                  disabled={!!selectedReview}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {RATING_LABELS[rating]}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="punctuality_rating">التقييم - الوقت</Label>
                <Select
                  value={formData.punctuality_rating}
                  onValueChange={(value) => setFormData({ ...formData, punctuality_rating: value })}
                  disabled={!!selectedReview}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {RATING_LABELS[rating]}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="quality_rating">التقييم - الجودة</Label>
                <Select
                  value={formData.quality_rating}
                  onValueChange={(value) => setFormData({ ...formData, quality_rating: value })}
                  disabled={!!selectedReview}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {RATING_LABELS[rating]}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="communication_rating">التقييم - التواصل</Label>
                <Select
                  value={formData.communication_rating}
                  onValueChange={(value) => setFormData({ ...formData, communication_rating: value })}
                  disabled={!!selectedReview}
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {RATING_LABELS[rating]}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="strengths">نقاط القوة</Label>
              <Textarea
                id="strengths"
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                disabled={!!selectedReview}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="areas_for_improvement">مجالات التحسين</Label>
              <Textarea
                id="areas_for_improvement"
                value={formData.areas_for_improvement}
                onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                disabled={!!selectedReview}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="goals">الأهداف</Label>
              <Textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                disabled={!!selectedReview}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="comments">تعليقات</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                disabled={!!selectedReview}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {selectedReview ? 'إغلاق' : 'إلغاء'}
            </Button>
            {!selectedReview && <Button onClick={handleSaveReview}>حفظ</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



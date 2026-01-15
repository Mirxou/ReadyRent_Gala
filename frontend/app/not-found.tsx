'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">الصفحة غير موجودة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            عذراً، الصفحة التي تبحث عنها غير موجودة.
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full" variant="default">
              <Link href="/">
                <Home className="h-4 w-4 ml-2" />
                العودة للصفحة الرئيسية
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/products">
                <ArrowRight className="h-4 w-4 ml-2" />
                تصفح المنتجات
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



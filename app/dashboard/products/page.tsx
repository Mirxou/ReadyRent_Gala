'use client';

import { formatNumber } from '@/lib/utils';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Filter,
    Loader2,
    PackageOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

async function fetchProducts() {
  const res = await fetch('/api/products');
  const json = await res.json();
  return json.data || [];
}

export default function ProductsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: products, isLoading } = useQuery({
      queryKey: ['my-products'],
      queryFn: fetchProducts,
    });

    const deleteMutation = useMutation({
      mutationFn: (id: string) => adminApi.deleteProduct(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-products'] });
        toast.success('تم حذف المنتج بنجاح');
      },
      onError: () => {
        toast.error('حدث خطأ أثناء حذف المنتج');
      },
    });

    // Show first products from API
    const myProducts = (products || []).slice(0, 5);

    const filteredProducts = myProducts.filter((product: any) =>
        (product.name_ar || product.name || '').includes(searchTerm)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sovereign-gold to-sovereign-gold bg-clip-text text-transparent">
                        منتجاتي
                    </h1>
                    <p className="text-muted-foreground">إدارة مجموعتك الخاصة من الفساتين والأزياء.</p>
                </div>
                <Link href="/products/create">
                    <Button className="rounded-full bg-gradient-to-r from-sovereign-gold to-sovereign-gold hover:opacity-90 shadow-lg glow-purple gap-2">
                        <Plus className="w-4 h-4" />
                        إضافة منتج جديد
                    </Button>
                </Link>
            </div>

            <div className="card-glass p-6 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="بحث عن منتج..."
                            className="pr-10 rounded-xl border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="rounded-xl gap-2">
                        <Filter className="w-4 h-4" />
                        تصفية
                    </Button>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" />
                    <p className="text-sm text-muted-foreground">جارٍ تحميل المنتجات...</p>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <PackageOpen className="w-16 h-16 text-muted-foreground/10" />
                    <p className="text-lg text-muted-foreground">لا توجد منتجات بعد</p>
                    <p className="text-sm text-muted-foreground/60">أضف أول منتج لبدء استئجاره للعملاء.</p>
                    <Link href="/products/create">
                      <Button className="rounded-full bg-gradient-to-r from-sovereign-gold to-sovereign-gold hover:opacity-90 shadow-lg gap-2 mt-2">
                        <Plus className="w-4 h-4" />
                        إضافة منتج جديد
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Products Table */}
                {!isLoading && filteredProducts.length > 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-white/5">
                            <TableRow>
                                <TableHead className="text-right">المنتج</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">السعر / يوم</TableHead>
                                <TableHead className="text-center">التقييم</TableHead>
                                <TableHead className="text-center">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product: any) => (
                                <TableRow key={product.id} className="group hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-16 rounded-lg overflow-hidden relative bg-white/5">
                                                {product.primary_image && (
                                                  <img src={product.primary_image} alt={product.name_ar} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                                )}
                                            </div>
                                            <span className="font-semibold text-foreground/90">{product.name_ar}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                            نشط
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatNumber(product.price_per_day)} دج</TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sovereign-gold/10 text-sovereign-gold">
                                            {product.rating || '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">فتح القائمة</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/products/create?editId=${product.id}`)}>
                                                    <Edit className="ml-2 h-4 w-4" /> تعديل
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/products/${product.slug || product.id}`)}>
                                                    <Eye className="ml-2 h-4 w-4" /> معاينة
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
                                                  if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                                                    deleteMutation.mutate(product.id);
                                                  }
                                                }}>
                                                    <Trash2 className="ml-2 h-4 w-4" /> حذف
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                )}
            </div>
        </div>
    );
}
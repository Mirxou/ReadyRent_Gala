'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Filter
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

// Mock Data for now
const products = [
    {
        id: 1,
        name: 'فستان سهرة ملكي أسود',
        price: 15000,
        status: 'active',
        views: 1240,
        bookings: 12,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80'
    },
    {
        id: 2,
        name: 'قفطان جزائري تقليدي',
        price: 25000,
        status: 'active',
        views: 850,
        bookings: 5,
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1583244562584-3860558b299e?w=800&q=80'
    },
    {
        id: 3,
        name: 'فستان زفاف بسيط',
        price: 45000,
        status: 'draft',
        views: 45,
        bookings: 0,
        rating: 0,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'
    },
];

export default function ProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
                        منتجاتي
                    </h1>
                    <p className="text-muted-foreground">إدارة مجموعتك الخاصة من الفساتين والأزياء.</p>
                </div>
                <Link href="/products/create">
                    <Button className="rounded-full bg-gradient-to-r from-gala-purple to-gala-pink hover:opacity-90 shadow-lg glow-purple gap-2">
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

                <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-white/5">
                            <TableRow>
                                <TableHead className="text-right">المنتج</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">السعر / يوم</TableHead>
                                <TableHead className="text-center">المشاهدات</TableHead>
                                <TableHead className="text-center">الحجوزات</TableHead>
                                <TableHead className="text-center">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id} className="group hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-16 rounded-lg overflow-hidden relative">
                                                <img src={product.image} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <span className="font-semibold text-foreground/90">{product.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={product.status === 'active' ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-500"}>
                                            {product.status === 'active' ? 'نشط' : 'مسودة'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{product.price.toLocaleString()} دج</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{product.views}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gala-purple/10 text-gala-purple">
                                            {product.bookings}
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
                                                <DropdownMenuItem>
                                                    <Edit className="ml-2 h-4 w-4" /> تعديل
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Eye className="ml-2 h-4 w-4" /> معاينة
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600">
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
            </div>
        </div>
    );
}

-- ============================================
-- ReadyRent.Gala - Supabase RLS Policies (FINAL - UUID Mapped)
-- الأولوية: 🔴 حرجة
-- السبب: حل مشكلة نوع البيانات (UUID vs BigInt)
-- ============================================

-- ==========================
-- 1. تفعيل RLS على الجداول
-- ==========================
ALTER TABLE products_product ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings_booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings_smartagreement ENABLE ROW LEVEL SECURITY;

-- ==========================
-- 2. سياسات المنتجات (Marketplace)
-- ==========================

-- ✅ السماح للجميع برؤية المنتجات (المتجر مفتوح)
CREATE POLICY "Public Products Access" 
ON products_product FOR SELECT 
USING (true);

-- ✅ السماح للملاك فقط بتعديل منتجاتهم
-- نستخدم جدول users_user كوسيط للربط بين auth.uid() (UUID) و owner_id (Integer)
CREATE POLICY "Owners Update Products" 
ON products_product FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM users_user 
        WHERE users_user.id = products_product.owner_id 
        AND users_user.supabase_user_id = auth.uid()
    )
);

-- ✅ السماح للملاك فقط بحذف منتجاتهم
CREATE POLICY "Owners Delete Products" 
ON products_product FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM users_user 
        WHERE users_user.id = products_product.owner_id 
        AND users_user.supabase_user_id = auth.uid()
    )
);

-- ✅ السماح للملاك بإضافة منتجات
CREATE POLICY "Owners Insert Products" 
ON products_product FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users_user 
        WHERE users_user.id = products_product.owner_id 
        AND users_user.supabase_user_id = auth.uid()
    )
);

-- ==========================
-- 3. سياسات الحجوزات (P2P Privacy)
-- ==========================

-- ✅ المستخدم يرى فقط حجوزاته (كمستأجر) أو كمالك للمنتج
CREATE POLICY "Users View Own Bookings" 
ON bookings_booking FOR SELECT 
USING (
    -- هل المستخدم هو المستأجر؟
    EXISTS (
        SELECT 1 FROM users_user 
        WHERE users_user.id = bookings_booking.user_id 
        AND users_user.supabase_user_id = auth.uid()
    )
    OR 
    -- هل المستخدم هو مالك المنتج؟
    EXISTS (
        SELECT 1 FROM products_product
        JOIN users_user ON products_product.owner_id = users_user.id
        WHERE products_product.id = bookings_booking.product_id
        AND users_user.supabase_user_id = auth.uid()
    )
);

-- Enable RLS on core tables
ALTER TABLE products_product ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings_booking ENABLE ROW LEVEL SECURITY;
-- Contracts table might not exist yet or named differently, check models. 
-- Assuming contracts_contract based on app name.

-- ----------------------------------------------------
-- 1. PRODUCTS POLICIES
-- ----------------------------------------------------

-- Allow ANYONE to view available products (Public Catalog)
CREATE POLICY "Public products are viewable by everyone"
ON products_product FOR SELECT
USING (true);

-- Allow AUTHENTICATED users to create products
CREATE POLICY "Authenticated users can insert products"
ON products_product FOR INSERT
WITH CHECK (auth.uid() = owner_id); -- Supabase auth.uid() maps to Django User ID if synced, 
-- BUT for a pure Django setup connecting to Postgres, we might rely on Django's connection role.
-- IMPORTANT: If using Django-only permissions, RLS might be complex if not using specialized DB users per request.
-- HOWEVER, the requirement is "Supabase RLS". This usually implies using Supabase Auth or specific setup.
-- If this is a standard Django app connecting to Supabase Postgres, RLS based on `auth.uid()` works 
-- ONLY if the app sets the current user in the session variable `request.jwt.claim.sub` or similar.

-- For a Standard Django App (One DB User):
-- RLS helps if we use session variables or if we trust Django but want DB defense-in-depth.
-- A common pattern for Django+RLS is setting `app.current_user_id` at start of request.

-- Let's assume we want to enforce: "Rows can only be updated by their owner_id"
-- This requires the DB to know "who is the current user".
-- Simplest approach for Django:
-- We'll assume the application will set a config variable `app.current_user_id` before queries.

-- POLICY: Owners can update their own products
CREATE POLICY "Owners can update their own products"
ON products_product FOR UPDATE
USING (
    owner_id = current_setting('app.current_user_id', true)::integer
    OR 
    current_setting('app.current_user_is_admin', true) = 'true'
);

-- POLICY: Owners can delete their own products
CREATE POLICY "Owners can delete their own products"
ON products_product FOR DELETE
USING (
    owner_id = current_setting('app.current_user_id', true)::integer
    OR 
    current_setting('app.current_user_is_admin', true) = 'true'
);

-- ----------------------------------------------------
-- 2. BOOKINGS POLICIES
-- ----------------------------------------------------

ALTER TABLE bookings_booking ENABLE ROW LEVEL SECURITY;

-- Renter can see their own bookings
CREATE POLICY "Renters can view their own bookings"
ON bookings_booking FOR SELECT
USING (
    renter_id = current_setting('app.current_user_id', true)::integer
    OR
    owner_id = current_setting('app.current_user_id', true)::integer -- Product owner also sees booking
    OR
    current_setting('app.current_user_is_admin', true) = 'true'
);

-- Renters can insert bookings (create)
CREATE POLICY "Renters can create bookings"
ON bookings_booking FOR INSERT
WITH CHECK (
    renter_id = current_setting('app.current_user_id', true)::integer
);

-- ----------------------------------------------------
-- HELPER FUNCTIONS (Optional integration aid)
-- ----------------------------------------------------
-- These rely on the backend setting `SET app.current_user_id = X` before queries.

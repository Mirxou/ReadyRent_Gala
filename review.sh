#!/bin/bash
# Comprehensive UI/UX Review Script for STANDARD.Rent

OUTPUT="/home/z/my-project/review-results.txt"
> "$OUTPUT"

echo "=============================================" >> "$OUTPUT"
echo "STANDARD.Rent UI/UX Review Report" >> "$OUTPUT"
echo "Date: $(date)" >> "$OUTPUT"
echo "=============================================" >> "$OUTPUT"

review_page() {
  local url="$1"
  local name="$2"
  echo "" >> "$OUTPUT"
  echo "=============================================" >> "$OUTPUT"
  echo "PAGE: $name ($url)" >> "$OUTPUT"
  echo "=============================================" >> "$OUTPUT"
  
  # Navigate
  result=$(agent-browser open "http://localhost:3000$url" 2>&1)
  echo "Navigation: $result" >> "$OUTPUT"
  
  # Get title
  title=$(agent-browser get title 2>&1)
  echo "Title: $title" >> "$OUTPUT"
  
  # Check for console errors
  echo "---Console Errors---" >> "$OUTPUT"
  agent-browser errors 2>&1 >> "$OUTPUT"
  
  # Get compact snapshot
  echo "---Page Structure---" >> "$OUTPUT"
  agent-browser snapshot -c 2>&1 >> "$OUTPUT"
  
  echo "=============================================" >> "$OUTPUT"
}

# Start server
pkill -f "next" 2>/dev/null
sleep 2
cd /home/z/my-project
node node_modules/.bin/next dev -p 3000 -H 0.0.0.0 --turbopack > /home/z/my-project/dev-review.log 2>&1 &
echo "Waiting for server..."
for i in $(seq 1 60); do
  if ss -tlnp 2>/dev/null | grep -q 3000; then
    echo "Server ready!"
    break
  fi
  sleep 1
done

# Review all key pages
review_page "/" "Homepage"
review_page "/products" "Products Listing"
review_page "/login" "Login"
review_page "/rentals" "Rentals"
review_page "/services" "Services"
review_page "/marketplace" "Marketplace"
review_page "/cart" "Cart"
review_page "/artisans" "Artisans"
review_page "/vendors" "Vendors"
review_page "/wallet" "Wallet"
review_page "/insurance" "Insurance"
review_page "/trust-score" "Trust Score"
review_page "/verification" "Verification"
review_page "/returns" "Returns"
review_page "/disputes" "Disputes"
review_page "/faq" "FAQ"
review_page "/blog" "Blog"
review_page "/about" "About"
review_page "/bundles" "Bundles"
review_page "/judicial" "Judicial"
review_page "/ai-search" "AI Search"
review_page "/checkout" "Checkout"
review_page "/dashboard" "Dashboard"
review_page "/register" "Register"

echo "" >> "$OUTPUT"
echo "=== DEV SERVER LOG ===" >> "$OUTPUT"
tail -50 /home/z/my-project/dev-review.log >> "$OUTPUT"

echo "Review complete! Results saved to $OUTPUT"
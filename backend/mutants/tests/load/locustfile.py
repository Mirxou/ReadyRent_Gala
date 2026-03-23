"""
Load testing with Locust
Install: pip install locust
Run: locust -f backend/tests/load/locustfile.py --host=http://localhost:8000
"""
from locust import HttpUser, task, between
import random


class ReadyRentUser(HttpUser):
    """Simulate user behavior on ReadyRent.Gala"""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Called when a user starts"""
        # Login (optional - adjust based on your auth implementation)
        # self.client.post("/api/auth/login/", json={
        #     "email": "test@example.com",
        #     "password": "password"
        # })
        pass
    
    @task(3)
    def view_products(self):
        """View products list"""
        self.client.get("/api/products/")
    
    @task(2)
    def view_product_detail(self):
        """View a specific product"""
        # Assuming product IDs 1-100 exist
        product_id = random.randint(1, 100)
        self.client.get(f"/api/products/{product_id}/")
    
    @task(1)
    def search_products(self):
        """Search for products"""
        search_terms = ["فستان", "فساتين", "dress", "wedding"]
        term = random.choice(search_terms)
        self.client.get(f"/api/products/?search={term}")
    
    @task(1)
    def get_categories(self):
        """Get categories"""
        self.client.get("/api/products/categories/")
    
    @task(1)
    def view_cart(self):
        """View shopping cart"""
        # This requires authentication
        # self.client.get("/api/bookings/cart/")
        pass
    
    @task(1)
    def get_bookings(self):
        """View user bookings"""
        # This requires authentication
        # self.client.get("/api/bookings/")
        pass
    
    @task(1)
    def health_check(self):
        """Health check endpoint"""
        self.client.get("/api/health/")
    
    @task(1)
    def get_cms_pages(self):
        """Get CMS pages"""
        self.client.get("/api/cms/pages/")
    
    @task(1)
    def get_faqs(self):
        """Get FAQs"""
        self.client.get("/api/cms/faqs/")


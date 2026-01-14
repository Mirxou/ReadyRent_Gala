"""
Location services
"""
import math
import requests
from datetime import time, datetime
from django.conf import settings
from django.utils import timezone
from datetime import time, datetime
from django.utils import timezone
from .models import Address, DeliveryZone, DeliveryRequest


class LocationService:
    """Service for location calculations"""
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """
        Calculate distance between two coordinates using Haversine formula
        Returns distance in kilometers
        """
        # Radius of Earth in kilometers
        R = 6371
        
        # Convert to radians
        lat1_rad = math.radians(float(lat1))
        lat2_rad = math.radians(float(lat2))
        delta_lat = math.radians(float(lat2) - float(lat1))
        delta_lon = math.radians(float(lon2) - float(lon1))
        
        # Haversine formula
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        distance = R * c
        
        return distance
    
    @staticmethod
    def find_delivery_zone(latitude, longitude):
        """
        Find delivery zone for given coordinates
        """
        if not latitude or not longitude:
            return None
        
        zones = DeliveryZone.objects.filter(is_active=True)
        
        for zone in zones:
            distance = LocationService.calculate_distance(
                latitude, longitude,
                zone.center_latitude, zone.center_longitude
            )
            
            if distance <= float(zone.radius_km):
                return zone
        
        return None
    
    @staticmethod
    def calculate_delivery_fee(address):
        """
        Calculate delivery fee for an address
        """
        if not address.latitude or not address.longitude:
            return 0
        
        zone = LocationService.find_delivery_zone(
            address.latitude,
            address.longitude
        )
        
        if zone:
            return zone.delivery_fee
        
        return 0
    
    @staticmethod
    def is_address_in_service_area(address):
        """
        Check if address is in service area
        """
        if not address.latitude or not address.longitude:
            return False
        
        zone = LocationService.find_delivery_zone(
            address.latitude,
            address.longitude
        )
        
        return zone is not None

    @staticmethod
    def check_same_day_delivery_available(zone, current_time=None):
        """
        Check if same-day delivery is available for a delivery zone
        
        Args:
            zone: DeliveryZone instance
            current_time: datetime.time object (defaults to current time)
        
        Returns:
            dict with 'available', 'cutoff_time', and 'fee'
        """
        if not zone.same_day_delivery_available:
            return {
                'available': False,
                'cutoff_time': None,
                'fee': 0,
                'message': 'تسليم في اليوم نفسه غير متاح في هذه المنطقة'
            }

        if not zone.same_day_cutoff_time:
            # If no cutoff time specified, same-day is always available
            return {
                'available': True,
                'cutoff_time': None,
                'fee': float(zone.same_day_delivery_fee),
                'message': 'تسليم في اليوم نفسه متاح'
            }

        # Get current time
        if current_time is None:
            current_time = timezone.now().time()
        elif isinstance(current_time, datetime):
            current_time = current_time.time()

        # Check if current time is before cutoff
        cutoff_time = zone.same_day_cutoff_time
        
        # Convert to comparable format
        current_minutes = current_time.hour * 60 + current_time.minute
        cutoff_minutes = cutoff_time.hour * 60 + cutoff_time.minute

        available = current_minutes < cutoff_minutes

        return {
            'available': available,
            'cutoff_time': cutoff_time.strftime('%H:%M'),
            'fee': float(zone.same_day_delivery_fee),
            'message': (
                'تسليم في اليوم نفسه متاح' if available
                else f'لقد تجاوزت وقت القطع ({cutoff_time.strftime("%H:%M")})'
            )
        }


class GoogleMapsService:
    """Service for Google Maps API integration"""
    
    API_KEY = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
    BASE_URL = 'https://maps.googleapis.com/maps/api'
    
    @classmethod
    def geocode_address(cls, address):
        """
        Convert address to coordinates using Google Geocoding API
        Returns: {'latitude': float, 'longitude': float, 'place_id': str} or None
        """
        if not cls.API_KEY:
            return None
        
        try:
            url = f"{cls.BASE_URL}/geocode/json"
            params = {
                'address': address,
                'key': cls.API_KEY,
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                result = data['results'][0]
                location = result['geometry']['location']
                return {
                    'latitude': location['lat'],
                    'longitude': location['lng'],
                    'place_id': result.get('place_id', ''),
                    'formatted_address': result.get('formatted_address', address),
                }
        except Exception as e:
            print(f"Error geocoding address: {e}")
        
        return None
    
    @classmethod
    def reverse_geocode(cls, latitude, longitude):
        """
        Convert coordinates to address using Google Geocoding API
        Returns: {'address': str, 'place_id': str} or None
        """
        if not cls.API_KEY:
            return None
        
        try:
            url = f"{cls.BASE_URL}/geocode/json"
            params = {
                'latlng': f"{latitude},{longitude}",
                'key': cls.API_KEY,
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                result = data['results'][0]
                return {
                    'address': result.get('formatted_address', ''),
                    'place_id': result.get('place_id', ''),
                }
        except Exception as e:
            print(f"Error reverse geocoding: {e}")
        
        return None
    
    @classmethod
    def get_place_details(cls, place_id):
        """
        Get place details using Google Places API
        Returns: dict with place details or None
        """
        if not cls.API_KEY:
            return None
        
        try:
            url = f"{cls.BASE_URL}/place/details/json"
            params = {
                'place_id': place_id,
                'key': cls.API_KEY,
                'fields': 'name,formatted_address,geometry,place_id,types',
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK':
                return data.get('result', {})
        except Exception as e:
            print(f"Error getting place details: {e}")
        
        return None


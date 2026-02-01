import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MapLocation } from '@/components/map-location';

// Mock Google Maps API
jest.mock('@react-google-maps/api', () => ({
  useJsApiLoader: () => ({ isLoaded: true }),
  GoogleMap: ({ children, onClick }: any) => (
    <div data-testid="google-map" onClick={() => onClick({ latLng: { lat: () => 36, lng: () => 6 } })}>
      {children}
    </div>
  ),
  Marker: ({ position }: any) => <div data-testid="map-marker" data-lat={position.lat} data-lng={position.lng} />,
  Autocomplete: ({ children }: any) => <div data-testid="autocomplete">{children}</div>,
}));

describe('MapLocation', () => {
  let mockGeocode: jest.Mock;

  beforeEach(() => {
    mockGeocode = jest.fn();
    global.google = {
      maps: {
        Geocoder: jest.fn().mockImplementation(() => ({
          geocode: mockGeocode,
        })),
        Map: jest.fn().mockImplementation(() => ({
          setCenter: jest.fn(),
          setZoom: jest.fn(),
        })),
        Marker: jest.fn(),
        places: {
          Autocomplete: jest.fn(),
        },
        LatLng: jest.fn(),
        LatLngBounds: jest.fn(),
      },
    } as any;
  });

  it('renders loading state when map script not loaded', () => {
    // Override mock
    const { useJsApiLoader } = require('@react-google-maps/api');
    (useJsApiLoader as jest.Mock).mockReturnValue({ isLoaded: false });

    render(<MapLocation />);
    expect(screen.getByText('جاري تحميل الخريطة...')).toBeInTheDocument();

    // Reset back
    (useJsApiLoader as jest.Mock).mockReturnValue({ isLoaded: true });
  });

  it('renders map and input when loaded', async () => {
    render(<MapLocation />);
    expect(await screen.findByText('الموقع على الخريطة')).toBeInTheDocument();
  });

  it('handles map click and geocoding', async () => {
    mockGeocode.mockImplementation((_opts: any, callback: any) => {
      callback([{ formatted_address: 'Mocked Address', place_id: '123' }], 'OK');
    });

    render(<MapLocation />);
    const mapDiv = await screen.findByTestId('google-map');
    fireEvent.click(mapDiv);

    expect(await screen.findByText(/العنوان:.*Mocked Address/)).toBeInTheDocument();
  });
});

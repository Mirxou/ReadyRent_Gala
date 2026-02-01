import { render, screen, fireEvent } from '@testing-library/react';
import { HijriCalendar } from '@/components/hijri-calendar';

// Mock specific dependencies
jest.mock('hijri-date-converter', () => {
  return jest.fn().mockImplementation(() => ({
    getDay: () => 15,
    getMonthName: () => 'Ramadan',
    getYear: () => 1445,
  }));
});

describe('HijriCalendar', () => {
  it('renders gregorian calendar by default', () => {
    render(<HijriCalendar />);
    expect(screen.getByText('التقويم')).toBeInTheDocument();
    // Assuming Calendar renders standard reachable elements
  });

  it('toggles hijri display', () => {
    render(<HijriCalendar selectedDate={new Date('2024-03-25')} />);

    // Toggle switch
    const toggle = screen.getByLabelText('هجري');
    fireEvent.click(toggle);

    // Check for Hijri date
    expect(screen.getByText('التاريخ الهجري')).toBeInTheDocument();
    expect(screen.getByText('15 Ramadan 1445 هـ')).toBeInTheDocument();
  });
});

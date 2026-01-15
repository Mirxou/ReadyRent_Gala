#!/usr/bin/env node
/**
 * Script to generate test files for frontend components
 */
const fs = require('fs');
const path = require('path');

const COMPONENTS_NEEDING_TESTS = [
  'accessory-suggestions',
  'analytics',
  'branch-selector',
  'bundle-selector',
  'cancellation-policy',
  'damage-inspection',
  'dispute-form',
  'error-boundary',
  'forecast-chart',
  'gps-tracker',
  'hijri-calendar',
  'id-upload',
  'insurance-selector',
  'map-location',
  'role-selector',
  'variant-selector',
  'waitlist-button',
];

const ADMIN_COMPONENTS = [
  'booking-actions',
  'booking-table',
  'quick-actions',
  'revenue-chart',
  'sales-by-category-chart',
  'sales-by-status-chart',
  'stats-cards',
  'top-products-chart',
];

const REVIEW_COMPONENTS = [
  'rating-stars',
  'review-form',
  'review-list',
];

const TEST_TEMPLATE = `import { render, screen } from '@testing-library/react';
import { {{ComponentName}} } from '@/components/{{componentPath}}';

describe('{{ComponentName}}', () => {
  it('renders correctly', () => {
    render(<{{ComponentName}} />);
    // TODO: Add specific assertions
  });

  it('handles user interactions', () => {
    // TODO: Add interaction tests
  });
});
`;

function generateTestFile(componentName, componentPath) {
  const ComponentName = componentName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const testContent = TEST_TEMPLATE
    .replace(/{{ComponentName}}/g, ComponentName)
    .replace(/{{componentPath}}/g, componentPath);
  
  const testDir = path.join(__dirname, '..', '__tests__', 'components');
  const testFile = path.join(testDir, `${componentName}.test.tsx`);
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  if (!fs.existsSync(testFile)) {
    fs.writeFileSync(testFile, testContent, 'utf-8');
    console.log(`Created: ${testFile}`);
  } else {
    console.log(`Already exists: ${testFile}`);
  }
}

// Generate tests for regular components
COMPONENTS_NEEDING_TESTS.forEach(component => {
  generateTestFile(component, component);
});

// Generate tests for admin components
ADMIN_COMPONENTS.forEach(component => {
  generateTestFile(component, `admin/${component}`);
});

// Generate tests for review components
REVIEW_COMPONENTS.forEach(component => {
  generateTestFile(component, `reviews/${component}`);
});

console.log(`\nGenerated test files for ${COMPONENTS_NEEDING_TESTS.length + ADMIN_COMPONENTS.length + REVIEW_COMPONENTS.length} components`);
console.log('Note: You need to fill in the TODO sections with actual test implementations');


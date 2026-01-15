'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  sizes: string[];
  onSizesChange: (sizes: string[]) => void;
  colors: string[];
  onColorsChange: (colors: string[]) => void;
  maxPrice?: number;
}

export function ProductFilters({
  search,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  priceRange,
  onPriceRangeChange,
  sizes,
  onSizesChange,
  colors,
  onColorsChange,
  maxPrice = 50000,
}: ProductFiltersProps) {
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ type: string; text: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [priceMinInput, setPriceMinInput] = useState<string | null>(null);
  const [priceMaxInput, setPriceMaxInput] = useState<string | null>(null);
  const [isPriceMinFocused, setIsPriceMinFocused] = useState(false);
  const [isPriceMaxFocused, setIsPriceMaxFocused] = useState(false);
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [customColorInput, setCustomColorInput] = useState('');

  // Reset input states when priceRange changes externally (e.g., clearAll)
  // Only reset if the value actually changed, not if user just entered the same value
  useEffect(() => {
    if (!isPriceMinFocused) {
      const currentMin = priceMinInput !== null
        ? (priceMinInput === '' ? 0 : Number(priceMinInput) || 0)
        : null;
      // Only update if the value actually changed from external source
      if (currentMin !== priceRange[0]) {
        if (priceRange[0] === 0) {
          setPriceMinInput(null);
        } else {
          setPriceMinInput(priceRange[0].toString());
        }
      }
    }
    if (!isPriceMaxFocused) {
      const currentMax = priceMaxInput !== null
        ? (priceMaxInput === '' ? maxPrice : Number(priceMaxInput) || maxPrice)
        : null;
      // Only update if the value actually changed from external source
      // Don't reset if user entered maxPrice explicitly (priceMaxInput matches priceRange[1])
      if (currentMax !== priceRange[1]) {
        if (priceRange[1] === maxPrice && priceMaxInput === null) {
          // Only reset to null if it was already null (external change)
          setPriceMaxInput(null);
        } else if (priceRange[1] !== maxPrice) {
          setPriceMaxInput(priceRange[1].toString());
        }
        // If priceRange[1] === maxPrice and priceMaxInput is not null, keep it (user entered it)
      }
    }
  }, [priceRange, maxPrice, isPriceMinFocused, isPriceMaxFocused]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then((res) => res.data),
  });

  // Ensure categories is always an array
  const categories = useMemo(() => {
    if (!categoriesData) return [];
    return Array.isArray(categoriesData)
      ? categoriesData
      : (categoriesData?.results || []);
  }, [categoriesData]);

  // Fetch search suggestions
  useEffect(() => {
    if (searchInput.length >= 2) {
      const timeoutId = setTimeout(() => {
        productsApi.getSearchSuggestions(searchInput).then((res) => {
          setSearchSuggestions(res.data.suggestions || []);
          setShowSuggestions(true);
        }).catch(() => {
          setSearchSuggestions([]);
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchInput]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Search suggestions only for 2+ characters
    if (value.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }

    // Always call onSearchChange, even if empty - search works with all filters
    onSearchChange(value);
  };

  const handleSuggestionClick = (suggestion: { type: string; text: string }) => {
    handleSearchChange(suggestion.text);
    setShowSuggestions(false);
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      onSizesChange(sizes.filter((s) => s !== size));
    } else {
      onSizesChange([...sizes, size]);
    }
  };

  const toggleColor = (color: string) => {
    if (colors.includes(color)) {
      onColorsChange(colors.filter((c) => c !== color));
    } else {
      onColorsChange([...colors, color]);
    }
  };

  const handleCustomColor = () => {
    if (customColorInput.trim()) {
      const customColor = customColorInput.trim().toLowerCase();
      if (!colors.includes(customColor)) {
        onColorsChange([...colors, customColor]);
      }
      setCustomColorInput('');
      setShowCustomColorInput(false);
    }
  };

  const removeCustomColor = (colorToRemove: string) => {
    onColorsChange(colors.filter((c) => c !== colorToRemove));
  };

  const clearAll = () => {
    handleSearchChange('');
    onCategoriesChange([]);
    onPriceRangeChange([0, maxPrice]);
    onSizesChange([]);
    onColorsChange([]);
  };

  const hasActiveFilters =
    search ||
    selectedCategories.length > 0 ||
    (priceRange[0] !== undefined && priceRange[0] !== null && priceRange[0] > 0) ||
    (priceRange[1] !== undefined && priceRange[1] !== null && priceRange[1] < maxPrice) ||
    sizes.length > 0 ||
    colors.length > 0;

  // Fetch size options from API
  const { data: metadata } = useQuery({
    queryKey: ['product-metadata'],
    queryFn: () => productsApi.getMetadata().then((res) => res.data),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const SIZE_OPTIONS = useMemo(() => {
    if (metadata?.sizes) {
      return metadata.sizes.map((s: { value: string; label: string }) => s.value);
    }
    // Fallback to default sizes if API fails
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  }, [metadata]);

  const COLOR_OPTIONS = useMemo(() => {
    if (metadata?.colors) {
      return metadata.colors;
    }
    // Fallback to default colors if API fails
    return [
      { name: 'أحمر', value: 'red', hex: '#EF4444' },
      { name: 'أزرق', value: 'blue', hex: '#3B82F6' },
      { name: 'أخضر', value: 'green', hex: '#10B981' },
      { name: 'أصفر', value: 'yellow', hex: '#F59E0B' },
      { name: 'وردي', value: 'pink', hex: '#EC4899' },
      { name: 'بنفسجي', value: 'purple', hex: '#8B5CF6' },
      { name: 'أسود', value: 'black', hex: '#1F2937' },
      { name: 'أبيض', value: 'white', hex: '#FFFFFF' },
      { name: 'بيج', value: 'beige', hex: '#F5F5DC' },
      { name: 'ذهبي', value: 'gold', hex: '#FBBF24' },
    ];
  }, [metadata]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلترة
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="h-4 w-4 ml-1" />
              مسح الكل
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">الفئات</label>
            {categories && categories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedCategories.length === categories.length) {
                    // Deselect all
                    onCategoriesChange([]);
                  } else {
                    // Select all
                    onCategoriesChange(categories.map((cat: any) => cat.id.toString()));
                  }
                }}
                className="text-xs h-auto py-1 px-2"
              >
                {selectedCategories.length === categories.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Button>
            )}
          </div>
          {categories && categories.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category: any) => (
                <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id.toString())}
                    onChange={() => toggleCategory(category.id.toString())}
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {category.name_ar || category.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد فئات متاحة</p>
          )}
        </div>

        {/* Price Range Inputs */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            نطاق السعر (دج/يوم)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="price-min" className="text-sm font-medium text-muted-foreground block">
                من
              </label>
              <div className="relative">
                <Input
                  id="price-min"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={priceMinInput !== null ? priceMinInput : (priceRange[0] === 0 ? '' : priceRange[0].toString())}
                  onChange={(e) => {
                    const inputValue = e.target.value.replace(/[^0-9]/g, '');
                    setPriceMinInput(inputValue);
                    // Don't update priceRange immediately, wait for blur
                  }}
                  onBlur={(e) => {
                    setIsPriceMinFocused(false);
                    const inputValue = e.target.value.replace(/[^0-9]/g, '');
                    if (inputValue === '') {
                      setPriceMinInput(null);
                      onPriceRangeChange([0, priceRange[1]]);
                      return;
                    }
                    const numValue = Number(inputValue);
                    if (!isNaN(numValue) && numValue >= 0) {
                      const minValue = priceRange[1] ? Math.min(numValue, priceRange[1]) : numValue;
                      setPriceMinInput(null);
                      onPriceRangeChange([minValue, priceRange[1]]);
                    } else {
                      setPriceMinInput(null);
                      onPriceRangeChange([0, priceRange[1]]);
                    }
                  }}
                  onFocus={() => {
                    setIsPriceMinFocused(true);
                    setPriceMinInput(priceRange[0] === 0 ? '' : priceRange[0].toString());
                  }}
                  className="text-sm pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  دج
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="price-max" className="text-sm font-medium text-muted-foreground block">
                إلى
              </label>
              <div className="relative">
                <Input
                  id="price-max"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={priceMaxInput !== null ? priceMaxInput : (priceRange[1] === maxPrice ? '' : priceRange[1].toString())}
                  onChange={(e) => {
                    const inputValue = e.target.value.replace(/[^0-9]/g, '');
                    setPriceMaxInput(inputValue);
                    // Don't update priceRange immediately, wait for blur
                  }}
                  onBlur={(e) => {
                    setIsPriceMaxFocused(false);
                    const inputValue = e.target.value.replace(/[^0-9]/g, '');
                    if (inputValue === '') {
                      setPriceMaxInput(null);
                      onPriceRangeChange([priceRange[0], maxPrice]);
                      return;
                    }
                    const numValue = Number(inputValue);
                    if (!isNaN(numValue) && numValue >= 0) {
                      const maxValue = Math.max(numValue, priceRange[0] || 0);
                      // Keep the input value if user entered maxPrice explicitly
                      if (maxValue === maxPrice) {
                        setPriceMaxInput(maxValue.toString());
                      } else {
                        setPriceMaxInput(null);
                      }
                      onPriceRangeChange([priceRange[0], maxValue]);
                    } else {
                      setPriceMaxInput(null);
                      onPriceRangeChange([priceRange[0], maxPrice]);
                    }
                  }}
                  onFocus={() => {
                    setIsPriceMaxFocused(true);
                    setPriceMaxInput(priceRange[1] === maxPrice ? '' : priceRange[1].toString());
                  }}
                  className="text-sm pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  دج
                </span>
              </div>
            </div>
          </div>
          {(() => {
            // Get current display values (use local input if available, otherwise use priceRange)
            let currentMin: number;
            if (priceMinInput !== null) {
              currentMin = priceMinInput === '' ? 0 : (Number(priceMinInput) || 0);
            } else {
              currentMin = priceRange[0];
            }

            let currentMax: number;
            if (priceMaxInput !== null) {
              // If user is typing, use the typed value (even if empty, treat as maxPrice for display)
              if (priceMaxInput === '') {
                currentMax = maxPrice;
              } else {
                currentMax = Number(priceMaxInput) || maxPrice;
              }
            } else {
              currentMax = priceRange[1];
            }

            // Show warning if max is still at default and user is not typing
            if (currentMax === maxPrice && priceMaxInput === null && !isPriceMaxFocused) {
              return (
                <div className="text-xs text-red-500 pt-1 text-center animate-soft-pulse">
                  الرجاء وضع سقف للسعر
                </div>
              );
            }

            // Always show range if user is typing or if values are different from defaults
            const isTyping = priceMinInput !== null || priceMaxInput !== null || isPriceMinFocused || isPriceMaxFocused;
            const hasCustomValues = currentMin > 0 || currentMax !== maxPrice;

            if (isTyping || hasCustomValues) {
              return (
                <div className="text-xs text-muted-foreground pt-1 text-center">
                  النطاق المحدد: {currentMin.toLocaleString()} - {currentMax.toLocaleString()} دج
                </div>
              );
            }

            return null;
          })()}
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">المقاسات</label>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((size: string) => (
              <Button
                key={size}
                variant={sizes.includes(size) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
          {sizes.length > 0 && (
            <div className="text-xs text-red-500 pt-1 text-center animate-soft-pulse">
              ملاحظة: المقاسات قد تتغير مستورد/محلي
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <label className="text-sm font-medium">الألوان</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <Button
                key={color.value}
                variant={colors.includes(color.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleColor(color.value)}
                className="flex items-center gap-2"
              >
                <div
                  className="w-4 h-4 rounded-full border border-gray-300 color-swatch"
                  data-hex={color.hex}
                />
                {color.name}
              </Button>
            ))}
            {/* Custom Color Button */}
            <Button
              variant={showCustomColorInput ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCustomColorInput(!showCustomColorInput)}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded-full border border-gray-300 bg-gradient-to-br from-purple-400 to-pink-400" />
              أخرى
            </Button>
          </div>

          {/* Custom Color Input */}
          {showCustomColorInput && (
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                placeholder="أدخل اسم اللون..."
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomColor();
                  }
                }}
                className="text-sm flex-1"
              />
              <Button
                size="sm"
                onClick={handleCustomColor}
                disabled={!customColorInput.trim()}
              >
                إضافة
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomColorInput(false);
                  setCustomColorInput('');
                }}
              >
                إلغاء
              </Button>
            </div>
          )}

          {/* Display Custom Colors */}
          {colors.filter((c) => !COLOR_OPTIONS.find((co) => co.value === c)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {colors
                .filter((c) => !COLOR_OPTIONS.find((co) => co.value === c))
                .map((customColor) => (
                  <Badge
                    key={customColor}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {customColor}
                    <button
                      onClick={() => removeCustomColor(customColor)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
            </div>
          )}
        </div>

        {/* Search with Autocomplete - Moved to middle after Colors */}
        <div className="space-y-2">
          <label className="text-sm font-medium">البحث</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="يمكن تركه فارغا"
                value={searchInput}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleSearchChange(newValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchChange(searchInput);
                  }
                }}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pr-10"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-right px-4 py-2 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{suggestion.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type === 'product' ? 'منتج' : 'فئة'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => {
                // Always trigger search, even if searchInput is empty (works with filters)
                handleSearchChange(searchInput);
              }}
              variant="default"
              size="default"
              className="shrink-0"
            >
              <Search className="h-4 w-4 ml-1" />
              بحث
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


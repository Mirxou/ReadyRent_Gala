'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

interface Branch {
  id: number;
  name_ar: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  opening_hours: Record<string, string>;
  staff_count: number;
  product_count: number;
}

interface BranchSelectorProps {
  onSelect?: (branch: Branch) => void;
  selectedBranchId?: number;
}

export function BranchSelector({ onSelect, selectedBranchId }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId && branches.length > 0) {
      const branch = branches.find(b => b.id === selectedBranchId);
      if (branch) {
        setSelectedBranch(branch);
      }
    }
  }, [selectedBranchId, branches]);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches/');
      setBranches(response.data.results || response.data);
    } catch (error: any) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    if (onSelect) {
      onSelect(branch);
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>اختر الفرع</CardTitle>
        <CardDescription>اختر الفرع المطلوب</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedBranch?.id === branch.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleBranchSelect(branch)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{branch.name_ar}</h3>
                    {branch.is_active && <Badge className="bg-green-500">نشط</Badge>}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{branch.address}, {branch.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{branch.phone}</span>
                    </div>
                    {branch.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{branch.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>{branch.product_count} منتج متوفر</span>
                    <span>{branch.staff_count} موظف</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedBranch && (
          <div className="bg-primary/5 border border-primary rounded-lg p-4">
            <p className="font-medium mb-2">الفرع المحدد</p>
            <p className="text-sm">{selectedBranch.name_ar}</p>
            <p className="text-sm text-muted-foreground">{selectedBranch.address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



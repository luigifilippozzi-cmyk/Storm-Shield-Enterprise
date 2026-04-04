'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicles, useDeleteVehicle, type VehicleFilters } from '@/hooks/use-vehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function VehiclesPage() {
  const router = useRouter();
  const [filters, setFilters] = useS
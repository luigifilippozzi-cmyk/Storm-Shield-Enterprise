'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEstimates, useDeleteEstimate, type EstimateFilters } from '@/hooks/use-estimates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  draft
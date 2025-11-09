import { Chip, ChipProps } from '@mui/material';
import { useMemo } from 'react';

interface StatusChipProps extends Omit<ChipProps, 'color' | 'label'> {
  status: string;
  variant?: 'wo' | 'permit' | 'validation';
}

export const StatusChip = ({ status, variant = 'wo', ...props }: StatusChipProps) => {
  const { color, label } = useMemo(() => {
    if (variant === 'wo') {
      switch (status) {
        case 'New':
          return { color: 'default' as const, label: 'New' };
        case 'In-Progress':
          return { color: 'warning' as const, label: 'In-Progress' };
        case 'Completed':
          return { color: 'success' as const, label: 'Completed' };
        default:
          return { color: 'default' as const, label: status };
      }
    } else if (variant === 'permit') {
      switch (status) {
        case 'Draft':
          return { color: 'default' as const, label: 'Draft' };
        case 'Pending':
          return { color: 'warning' as const, label: 'Pending' };
        case 'Approved':
          return { color: 'success' as const, label: 'Approved' };
        default:
          return { color: 'default' as const, label: status };
      }
    } else {
      switch (status) {
        case 'Pass':
          return { color: 'success' as const, label: 'Pass' };
        case 'Warn':
          return { color: 'warning' as const, label: 'Warn' };
        case 'Fail':
          return { color: 'error' as const, label: 'Fail' };
        default:
          return { color: 'default' as const, label: status };
      }
    }
  }, [status, variant]);

  return <Chip label={label} color={color} size="small" {...props} />;
};


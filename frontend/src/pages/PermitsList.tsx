import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Chip,
  Stack,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DataTable, Column } from '@/components/DataTable';
import { StatusChip } from '@/components/StatusChip';
import { Permit, Validation } from '@/types';
import { storage } from '@/utils/storage';

export const PermitsList = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [validationFilter, setValidationFilter] = useState<string>('all');

  useEffect(() => {
    if (id) {
      const loadedPermits = storage.getPermits(id);
      setPermits(loadedPermits);
    }
  }, [id]);

  const filteredPermits = useMemo(() => {
    return permits.filter(permit => {
      const matchesType = typeFilter === 'all' || permit.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || permit.status === statusFilter;
      
      const validation = storage.getValidation(permit.permitId);
      const matchesValidation = 
        validationFilter === 'all' || 
        (validation && validation.validationStatus === validationFilter);
      
      return matchesType && matchesStatus && matchesValidation;
    });
  }, [permits, typeFilter, statusFilter, validationFilter]);

  const columns: Column<Permit & { validation?: Validation; warningsCount: number }>[] = [
    {
      id: 'permitId',
      label: 'Permit ID',
      sortable: true,
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Chip label={value} size="small" variant="outlined" />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusChip status={value} variant="permit" />,
    },
    {
      id: 'validation',
      label: 'Validation',
      render: (_, row) => {
        const validation = storage.getValidation(row.permitId);
        return validation ? (
          <StatusChip status={validation.validationStatus} variant="validation" />
        ) : (
          <Typography variant="body2" color="text.secondary">N/A</Typography>
        );
      },
    },
    {
      id: 'warningsCount',
      label: 'Warnings',
      align: 'center',
      render: (_, row) => {
        const validation = storage.getValidation(row.permitId);
        const count = validation?.warnings.length || 0;
        return count > 0 ? (
          <Chip label={count} size="small" color="warning" />
        ) : (
          <Typography variant="body2" color="text.secondary">0</Typography>
        );
      },
    },
    {
      id: 'pdfLink',
      label: 'PDF',
      render: (_, row) => {
        // PDF links would come from the agent response
        return (
          <Link href="#" onClick={(e) => e.preventDefault()}>
            View PDF
          </Link>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate(`/permits/${row.permitId}`)}
        >
          Open
        </Button>
      ),
    },
  ];

  const tableData = useMemo(() => {
    return filteredPermits.map(permit => {
      const validation = storage.getValidation(permit.permitId);
      return {
        ...permit,
        validation,
        warningsCount: validation?.warnings.length || 0,
      };
    });
  }, [filteredPermits]);

  const permitTypes = useMemo(() => {
    const types = new Set(permits.map(p => p.type));
    return Array.from(types);
  }, [permits]);

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/workorders/${id}`)}
        sx={{ mb: 2 }}
      >
        Back to Work Order
      </Button>

      <Typography variant="h1" gutterBottom>
        Permits - {id}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <TextField
          select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All Types</MenuItem>
          {permitTypes.map(type => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="Draft">Draft</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
        </TextField>
        <TextField
          select
          label="Validation"
          value={validationFilter}
          onChange={(e) => setValidationFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="Pass">Pass</MenuItem>
          <MenuItem value="Warn">Warn</MenuItem>
          <MenuItem value="Fail">Fail</MenuItem>
        </TextField>
      </Stack>

      <DataTable
        columns={columns}
        data={tableData}
        emptyMessage="No permits found"
      />
    </Box>
  );
};


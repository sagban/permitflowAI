import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  InputAdornment,
  Pagination,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataTable, Column } from '@/components/DataTable';
import { StatusChip } from '@/components/StatusChip';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { WorkOrder } from '@/types';
import { loadWorkOrders } from '@/utils/workOrders';
import { storage } from '@/utils/storage';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [workOrdersData, setWorkOrdersData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkOrders().then(data => {
      const enriched = data.map(wo => {
        const storedStatus = storage.getStatus(wo.workOrderId);
        return {
          ...wo,
          status: storedStatus !== 'New' ? storedStatus : wo.status,
        };
      });
      setWorkOrdersData(enriched);
      setLoading(false);
    });
  }, []);

  const workOrders = useMemo(() => {
    return workOrdersData.filter(wo => {
      const matchesSearch =
        wo.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workOrdersData, searchTerm, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return workOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [workOrders, page]);

  const columns: Column<WorkOrder>[] = [
    {
      id: 'workOrderId',
      label: 'WO ID',
      sortable: true,
    },
    {
      id: 'title',
      label: 'Title',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'location',
      label: 'Site/Area',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusChip status={value} variant="wo" />,
    },
    {
      id: 'updatedAt',
      label: 'Last Run',
      sortable: true,
      render: (value) => (value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : 'N/A'),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/workorders/${row.workOrderId}`);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading work orders..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Work Orders
      </Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search by ID, title, or location..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 300 }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="New">New</MenuItem>
          <MenuItem value="In-Progress">In-Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        data={paginatedData}
        onRowClick={(row) => navigate(`/workorders/${row.workOrderId}`)}
      />

      {workOrders.length > ITEMS_PER_PAGE && (
        <Stack alignItems="center" mt={3}>
          <Pagination
            count={Math.ceil(workOrders.length / ITEMS_PER_PAGE)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Stack>
      )}
    </Box>
  );
};


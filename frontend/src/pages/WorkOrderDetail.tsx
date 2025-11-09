import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { WorkOrder, Hazard, Permit } from '@/types';
import { loadWorkOrders } from '@/utils/workOrders';
import { storage } from '@/utils/storage';
import { api } from '@/utils/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorAlert } from '@/components/ErrorAlert';
import { StatusChip } from '@/components/StatusChip';

const steps = ['Hazards', 'Permits', 'Validation', 'Refinement'];

export const WorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!id) return;

    loadWorkOrders().then(data => {
      const wo = data.find(w => w.workOrderId === id);
      if (wo) {
        const storedStatus = storage.getStatus(id);
        const updatedWo = { ...wo, status: storedStatus !== 'New' ? storedStatus : wo.status };
        setWorkOrder(updatedWo);
        const loadedHazards = storage.getHazards(id);
        const loadedPermits = storage.getPermits(id);
        setHazards(loadedHazards);
        setPermits(loadedPermits);

        if (storedStatus === 'In-Progress') {
          setActiveStep(2);
        } else if (storedStatus === 'Completed') {
          setActiveStep(3);
        } else if (loadedPermits.length > 0) {
          setActiveStep(1);
        }
      }
    });
  }, [id]);

  const handleGeneratePermits = async () => {
    if (!id || !workOrder) return;

    if (workOrder.status !== 'New') return;

    setLoading(true);
    setError(null);
    storage.setStatus(id, 'In-Progress');
    setWorkOrder({ ...workOrder, status: 'In-Progress' });
    setActiveStep(2);

    try {
      const response = await api.executeSequentialAgent(id);
      
      storage.saveHazards(id, response.hazards);
      storage.savePermits(id, response.permits);
      response.validations.forEach(v => storage.saveValidation(v));
      
      setHazards(response.hazards);
      setPermits(response.permits);
      setActiveStep(3);
      storage.setStatus(id, 'Completed');
      setWorkOrder({ ...workOrder, status: 'Completed' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate permits';
      setError(errorMessage);
      setErrorOpen(true);
      storage.setStatus(id, 'New');
      setWorkOrder({ ...workOrder, status: 'New' });
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  if (!workOrder) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Work Order not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/workorders')}
        sx={{ mb: 2 }}
      >
        Back to Work Orders
      </Button>

      <Typography variant="h1" gutterBottom>
        Work Order: {workOrder.workOrderId}
      </Typography>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Generating permits...
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>
                Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {workOrder.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">
                <strong>Location:</strong> {workOrder.location}
              </Typography>
              <Typography variant="body2">
                <strong>Equipment:</strong> {workOrder.equipment}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> <StatusChip status={workOrder.status} variant="wo" />
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>
                Crew Info
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Assigned To" secondary={workOrder.assignedTo} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Crew Members"
                    secondary={workOrder.crew.join(', ')}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {hazards.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Identified Hazards
            </Typography>
            <Grid container spacing={2}>
              {hazards.map((hazard, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {hazard.name}
                    </Typography>
                    <Chip
                      label={`${Math.round(hazard.confidence * 100)}% confidence`}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {hazard.rationale}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {permits.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" gutterBottom>
              Generated Permits ({permits.length})
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {permits.map((permit) => (
                <Chip
                  key={permit.permitId}
                  label={`${permit.type} - ${permit.permitId}`}
                  onClick={() => navigate(`/permits/${permit.permitId}`)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleGeneratePermits}
          disabled={loading || workOrder.status !== 'New'}
        >
          Generate Permits
        </Button>
        {permits.length > 0 && (
          <Button
            variant="outlined"
            onClick={() => navigate(`/workorders/${id}/permits`)}
          >
            View All Permits
          </Button>
        )}
      </Box>

      <ErrorAlert
        message={error || ''}
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
      />
    </Box>
  );
};


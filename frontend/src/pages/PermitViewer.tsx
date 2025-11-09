import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Stack,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Permit, Validation, Hazard } from '@/types';
import { storage } from '@/utils/storage';
import { StatusChip } from '@/components/StatusChip';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const PermitViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [permit, setPermit] = useState<Permit | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [editedControls, setEditedControls] = useState<string[]>([]);
  const [editedPPE, setEditedPPE] = useState<string[]>([]);
  const [editedSignOffs, setEditedSignOffs] = useState<string[]>([]);
  const [editedAttachments, setEditedAttachments] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const foundPermit = storage.getPermit(id);
    if (foundPermit) {
      setPermit(foundPermit);
      setEditedControls([...foundPermit.controls]);
      setEditedPPE([...foundPermit.PPE]);
      setEditedSignOffs([...foundPermit.signOffRoles]);
      setEditedAttachments([...foundPermit.attachmentsRequired]);

      const val = storage.getValidation(id);
      setValidation(val);

      if (foundPermit.workOrderId) {
        const woHazards = storage.getHazards(foundPermit.workOrderId);
        setHazards(woHazards.filter(h => foundPermit.hazardsLinked.includes(h.name)));
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!permit) return;

    const updatedPermit: Permit = {
      ...permit,
      controls: editedControls,
      PPE: editedPPE,
      signOffRoles: editedSignOffs,
      attachmentsRequired: editedAttachments,
    };

    storage.updatePermit(updatedPermit);
    setPermit(updatedPermit);
  };

  const handleApprove = () => {
    if (!permit) return;

    const updatedPermit: Permit = {
      ...permit,
      status: 'Approved',
    };

    storage.updatePermit(updatedPermit);
    setPermit(updatedPermit);
    setApproveDialogOpen(false);
  };

  if (!permit) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Permit not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/workorders/${permit.workOrderId}/permits`)}
        sx={{ mb: 2 }}
      >
        Back to Permits
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h1">
          {permit.permitId} - {permit.type}
        </Typography>
        <StatusChip status={permit.status} variant="permit" />
      </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Details" />
              <Tab label="Validation" />
              <Tab label="Evidence" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h3" gutterBottom>
                    Basic Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Permit ID" secondary={permit.permitId} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Type" secondary={permit.type} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Validity" secondary={`${permit.validityHours} hours`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Status" secondary={<StatusChip status={permit.status} variant="permit" />} />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h3" gutterBottom>
                    Linked Hazards
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    {hazards.map((hazard, idx) => (
                      <Chip key={idx} label={hazard.name} size="small" />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h3" gutterBottom>
                    Controls
                  </Typography>
                  <Stack spacing={1}>
                    {editedControls.map((control, idx) => (
                      <TextField
                        key={idx}
                        value={control}
                        onChange={(e) => {
                          const newControls = [...editedControls];
                          newControls[idx] = e.target.value;
                          setEditedControls(newControls);
                        }}
                        size="small"
                        fullWidth
                      />
                    ))}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h3" gutterBottom>
                    Required PPE
                  </Typography>
                  <Stack spacing={1}>
                    {editedPPE.map((ppe, idx) => (
                      <TextField
                        key={idx}
                        value={ppe}
                        onChange={(e) => {
                          const newPPE = [...editedPPE];
                          newPPE[idx] = e.target.value;
                          setEditedPPE(newPPE);
                        }}
                        size="small"
                        fullWidth
                      />
                    ))}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h3" gutterBottom>
                    Sign-off Roles
                  </Typography>
                  <Stack spacing={1}>
                    {editedSignOffs.map((role, idx) => (
                      <TextField
                        key={idx}
                        value={role}
                        onChange={(e) => {
                          const newSignOffs = [...editedSignOffs];
                          newSignOffs[idx] = e.target.value;
                          setEditedSignOffs(newSignOffs);
                        }}
                        size="small"
                        fullWidth
                      />
                    ))}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h3" gutterBottom>
                    Required Attachments
                  </Typography>
                  <Stack spacing={1}>
                    {editedAttachments.map((attachment, idx) => (
                      <TextField
                        key={idx}
                        value={attachment}
                        onChange={(e) => {
                          const newAttachments = [...editedAttachments];
                          newAttachments[idx] = e.target.value;
                          setEditedAttachments(newAttachments);
                        }}
                        size="small"
                        fullWidth
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>

              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
                {permit.status === 'Pending' && validation?.validationStatus !== 'Fail' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setApproveDialogOpen(true)}
                  >
                    Approve
                  </Button>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {validation ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h3" gutterBottom>
                      Validation Status
                    </Typography>
                    <StatusChip status={validation.validationStatus} variant="validation" />
                  </Box>

                  {validation.errors.length > 0 && (
                    <Alert severity="error">
                      <Typography variant="subtitle2" gutterBottom>Errors:</Typography>
                      <List dense>
                        {validation.errors.map((error, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={error} />
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  )}

                  {validation.warnings.length > 0 && (
                    <Alert severity="warning">
                      <Typography variant="subtitle2" gutterBottom>Warnings:</Typography>
                      <List dense>
                        {validation.warnings.map((warning, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={warning} />
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  )}

                  {validation.recommendations.length > 0 && (
                    <Alert severity="info">
                      <Typography variant="subtitle2" gutterBottom>Recommendations:</Typography>
                      <List dense>
                        {validation.recommendations.map((rec, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  )}

                  <Divider />
                  <Typography variant="h3" gutterBottom>
                    Detailed Checks
                  </Typography>
                  <List>
                    {validation.checks.map((check, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={check.check}
                          secondary={check.details}
                        />
                        <StatusChip status={check.result} variant="validation" />
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No validation data available
                </Typography>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h3" gutterBottom>
                Evidence & RAG Snippets
              </Typography>
              {hazards.length > 0 ? (
                <Stack spacing={2}>
                  {hazards.map((hazard, idx) => (
                    <Card key={idx} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {hazard.name}
                        </Typography>
                        {hazard.evidence && hazard.evidence.length > 0 ? (
                          <List dense>
                            {hazard.evidence.map((evidence, eIdx) => (
                              <ListItem key={eIdx}>
                                <ListItemText
                                  primary={evidence}
                                  secondary="RAG Evidence"
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No evidence snippets available
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No evidence data available
                </Typography>
              )}
            </TabPanel>
          </CardContent>
        </Card>

        <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
          <DialogTitle>Approve Permit</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to approve this permit? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApprove} color="success" variant="contained">
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
};


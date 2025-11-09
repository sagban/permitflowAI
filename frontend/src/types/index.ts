export interface WorkOrder {
  workOrderId: string;
  description: string;
  equipment: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'New' | 'In-Progress' | 'Completed';
  assignedTo: string;
  crew: string[];
  environmentType: string;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  title?: string;
}

export interface Hazard {
  name: string;
  confidence: number;
  rationale: string;
  suggestedControls: string[];
  evidence?: string[];
}

export interface Permit {
  permitId: string;
  type: 'Hot Work' | 'Confined Space Entry' | 'Excavation' | 'Electrical/LOTO' | 'Working at Height';
  status: 'Draft' | 'Pending' | 'Approved';
  controls: string[];
  PPE: string[];
  signOffRoles: string[];
  validityHours: number;
  attachmentsRequired: string[];
  hazardsLinked: string[];
  workOrderId: string;
}

export interface Validation {
  permitId: string;
  validationStatus: 'Pass' | 'Warn' | 'Fail';
  errors: string[];
  warnings: string[];
  recommendations: string[];
  checks: Array<{
    check: string;
    result: 'Pass' | 'Warn' | 'Fail';
    details: string;
  }>;
}

export interface AgentResponse {
  workOrderId: string;
  hazards: Hazard[];
  permits: Permit[];
  validations: Validation[];
  pdfLinks: string[];
  runMeta: {
    policyVersion: string;
    ragSnapshot: string;
  };
}

export interface PermitData {
  permit: Permit;
  validation?: Validation;
  pdfLink?: string;
}


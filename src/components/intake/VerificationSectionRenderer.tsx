import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Home, 
  Briefcase, 
  FileText, 
  Receipt, 
  Landmark, 
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type VerificationType = Database['public']['Enums']['verification_type'];

// Configuration for each verification type and what fields/sections it requires
export const VERIFICATION_SECTION_CONFIG: Record<VerificationType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  requiresAddress: boolean;
  addressTypes: string[];
  requiresEmployment: boolean;
  requiresDocuments: boolean;
  documentTypes: string[];
  requiresBankDetails: boolean;
  requiresPropertyDetails: boolean;
  requiresITRDetails: boolean;
}> = {
  profile: {
    icon: User,
    label: 'Profile Check',
    description: 'Basic identity and profile verification',
    color: 'bg-blue-500',
    requiresAddress: false,
    addressTypes: [],
    requiresEmployment: false,
    requiresDocuments: true,
    documentTypes: ['pan', 'aadhar', 'passport', 'voter_id', 'driving_license'],
    requiresBankDetails: false,
    requiresPropertyDetails: false,
    requiresITRDetails: false,
  },
  bgv: {
    icon: Shield,
    label: 'Background Verification',
    description: 'Criminal records, employment history, education verification',
    color: 'bg-purple-500',
    requiresAddress: true,
    addressTypes: ['residence', 'permanent'],
    requiresEmployment: true,
    requiresDocuments: true,
    documentTypes: ['pan', 'aadhar'],
    requiresBankDetails: false,
    requiresPropertyDetails: false,
    requiresITRDetails: false,
  },
  residential: {
    icon: Home,
    label: 'Residence Verification',
    description: 'Physical verification of residential address',
    color: 'bg-green-500',
    requiresAddress: true,
    addressTypes: ['residence', 'permanent'],
    requiresEmployment: false,
    requiresDocuments: true,
    documentTypes: ['aadhar', 'utility_bill', 'rent_agreement'],
    requiresBankDetails: false,
    requiresPropertyDetails: false,
    requiresITRDetails: false,
  },
  business: {
    icon: Briefcase,
    label: 'Business Verification',
    description: 'Office/business premises verification',
    color: 'bg-orange-500',
    requiresAddress: true,
    addressTypes: ['office'],
    requiresEmployment: true,
    requiresDocuments: true,
    documentTypes: ['pan', 'business_registration', 'gst_certificate'],
    requiresBankDetails: false,
    requiresPropertyDetails: false,
    requiresITRDetails: false,
  },
  itr: {
    icon: Receipt,
    label: 'ITR Verification',
    description: 'Income tax return verification',
    color: 'bg-yellow-500',
    requiresAddress: false,
    addressTypes: [],
    requiresEmployment: true,
    requiresDocuments: true,
    documentTypes: ['pan', 'itr', 'form_16'],
    requiresBankDetails: false,
    requiresPropertyDetails: false,
    requiresITRDetails: true,
  },
  bank: {
    icon: Landmark,
    label: 'Bank Statement Verification',
    description: 'Bank account and transaction verification',
    color: 'bg-cyan-500',
    requiresAddress: false,
    addressTypes: [],
    requiresEmployment: false,
    requiresDocuments: true,
    documentTypes: ['pan', 'bank_statement'],
    requiresBankDetails: true,
    requiresPropertyDetails: false,
    requiresITRDetails: false,
  },
  property: {
    icon: Building,
    label: 'Property Verification',
    description: 'Property documents and physical verification',
    color: 'bg-red-500',
    requiresAddress: true,
    addressTypes: ['residence', 'office'],
    requiresEmployment: false,
    requiresDocuments: true,
    documentTypes: ['property_docs', 'utility_bill'],
    requiresBankDetails: false,
    requiresPropertyDetails: true,
    requiresITRDetails: false,
  },
  end_use: {
    icon: FileText,
    label: 'End Use Verification',
    description: 'Verification of loan end use and purpose',
    color: 'bg-indigo-500',
    requiresAddress: true,
    addressTypes: ['residence', 'office'],
    requiresEmployment: false,
    requiresDocuments: true,
    documentTypes: ['property_docs', 'other'],
    requiresBankDetails: false,
    requiresPropertyDetails: true,
    requiresITRDetails: false,
  },
};

interface VerificationBadgeProps {
  type: VerificationType;
  selected: boolean;
  onClick: () => void;
  slaHours?: number;
  isFieldVerification?: boolean;
}

export function VerificationBadge({ 
  type, 
  selected, 
  onClick, 
  slaHours,
  isFieldVerification 
}: VerificationBadgeProps) {
  const config = VERIFICATION_SECTION_CONFIG[type];
  const Icon = config.icon;
  
  return (
    <div
      className={`relative flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'hover:bg-muted hover:border-muted-foreground/30'
      }`}
      onClick={onClick}
    >
      <div className={`p-2 rounded-lg ${config.color} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium flex items-center gap-2">
          {config.label}
          {selected && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {config.description}
        </p>
        {(slaHours || isFieldVerification) && (
          <div className="flex items-center gap-2 mt-1">
            {slaHours && (
              <Badge variant="outline" className="text-xs">
                SLA: {slaHours}h
              </Badge>
            )}
            {isFieldVerification && (
              <Badge variant="secondary" className="text-xs">
                Field
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface RequiredSectionIndicatorProps {
  selectedVerifications: VerificationType[];
}

export function RequiredSectionIndicator({ selectedVerifications }: RequiredSectionIndicatorProps) {
  if (selectedVerifications.length === 0) return null;

  const requirements = {
    address: false,
    employment: false,
    documents: false,
    bankDetails: false,
    propertyDetails: false,
    itrDetails: false,
  };

  selectedVerifications.forEach(type => {
    const config = VERIFICATION_SECTION_CONFIG[type];
    if (config.requiresAddress) requirements.address = true;
    if (config.requiresEmployment) requirements.employment = true;
    if (config.requiresDocuments) requirements.documents = true;
    if (config.requiresBankDetails) requirements.bankDetails = true;
    if (config.requiresPropertyDetails) requirements.propertyDetails = true;
    if (config.requiresITRDetails) requirements.itrDetails = true;
  });

  const requiredSections = Object.entries(requirements)
    .filter(([_, required]) => required)
    .map(([key]) => {
      switch (key) {
        case 'address': return 'Address Details';
        case 'employment': return 'Employment Info';
        case 'documents': return 'Documents';
        case 'bankDetails': return 'Bank Details';
        case 'propertyDetails': return 'Property Details';
        case 'itrDetails': return 'ITR Details';
        default: return key;
      }
    });

  if (requiredSections.length === 0) return null;

  return (
    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Required sections based on selection:
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {requiredSections.map(section => (
            <Badge key={section} variant="secondary" className="text-xs">
              {section}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to get required document types based on selected verifications
export function getRequiredDocumentTypes(selectedVerifications: VerificationType[]): string[] {
  const docTypes = new Set<string>();
  selectedVerifications.forEach(type => {
    const config = VERIFICATION_SECTION_CONFIG[type];
    config.documentTypes.forEach(dt => docTypes.add(dt));
  });
  return Array.from(docTypes);
}

// Helper function to get required address types based on selected verifications
export function getRequiredAddressTypes(selectedVerifications: VerificationType[]): string[] {
  const addressTypes = new Set<string>();
  selectedVerifications.forEach(type => {
    const config = VERIFICATION_SECTION_CONFIG[type];
    config.addressTypes.forEach(at => addressTypes.add(at));
  });
  return Array.from(addressTypes);
}

// Helper to check if a section is required
export function isSectionRequired(
  selectedVerifications: VerificationType[],
  section: 'address' | 'employment' | 'documents' | 'bankDetails' | 'propertyDetails' | 'itrDetails'
): boolean {
  return selectedVerifications.some(type => {
    const config = VERIFICATION_SECTION_CONFIG[type];
    switch (section) {
      case 'address': return config.requiresAddress;
      case 'employment': return config.requiresEmployment;
      case 'documents': return config.requiresDocuments;
      case 'bankDetails': return config.requiresBankDetails;
      case 'propertyDetails': return config.requiresPropertyDetails;
      case 'itrDetails': return config.requiresITRDetails;
      default: return false;
    }
  });
}

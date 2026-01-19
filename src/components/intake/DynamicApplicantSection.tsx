import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  UserPlus, 
  Users, 
  MapPin, 
  Trash2,
  User,
  FileText,
  Upload,
  Building,
  Briefcase
} from 'lucide-react';
import {
  ApplicantType,
  AddressType,
  DocumentType,
  APPLICANT_TYPES,
  ADDRESS_TYPES,
  DOCUMENT_TYPES,
  OWNERSHIP_TYPES,
  RELATION_TYPES
} from '@/hooks/useLeadApplicants';
import { 
  VERIFICATION_SECTION_CONFIG, 
  getRequiredAddressTypes, 
  getRequiredDocumentTypes,
  isSectionRequired 
} from './VerificationSectionRenderer';
import type { Database } from '@/integrations/supabase/types';

type VerificationType = Database['public']['Enums']['verification_type'];

// Inline types for form state (no DB IDs yet)
export interface InlineDocument {
  tempId: string;
  document_type: DocumentType;
  document_number?: string;
  file?: File;
  fileName?: string;
}

export interface InlineAddress {
  tempId: string;
  address_type: AddressType;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
  ownership_type?: string;
  years_at_address?: number;
}

export interface InlineApplicant {
  tempId: string;
  applicant_type: ApplicantType;
  name: string;
  relation_to_primary?: string;
  pan_number?: string;
  aadhar_number?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  occupation?: string;
  employer_name?: string;
  monthly_income?: number;
  is_primary: boolean;
  addresses: InlineAddress[];
  documents: InlineDocument[];
  // Bank details (for bank verification)
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  // ITR details
  assessment_year?: string;
  itr_filing_date?: string;
  total_income?: number;
}

interface DynamicApplicantSectionProps {
  applicants: InlineApplicant[];
  onApplicantsChange: (applicants: InlineApplicant[]) => void;
  primaryApplicantName?: string;
  selectedVerifications: VerificationType[];
}

// Generate temporary IDs
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function DynamicApplicantSection({ 
  applicants, 
  onApplicantsChange,
  primaryApplicantName,
  selectedVerifications
}: DynamicApplicantSectionProps) {
  const [expandedApplicants, setExpandedApplicants] = useState<Set<string>>(new Set());
  const [applicantDialogOpen, setApplicantDialogOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<InlineApplicant | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<{ address: InlineAddress | null; applicantTempId: string } | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<{ document: InlineDocument | null; applicantTempId: string } | null>(null);

  // Form states for dialogs
  const [applicantForm, setApplicantForm] = useState<Partial<InlineApplicant>>({});
  const [addressForm, setAddressForm] = useState<Partial<InlineAddress>>({});
  const [documentForm, setDocumentForm] = useState<Partial<InlineDocument>>({});

  // Determine required sections based on selected verifications
  const requiresAddress = isSectionRequired(selectedVerifications, 'address');
  const requiresEmployment = isSectionRequired(selectedVerifications, 'employment');
  const requiresDocuments = isSectionRequired(selectedVerifications, 'documents');
  const requiresBankDetails = isSectionRequired(selectedVerifications, 'bankDetails');
  const requiresITRDetails = isSectionRequired(selectedVerifications, 'itrDetails');
  
  const requiredAddressTypes = getRequiredAddressTypes(selectedVerifications);
  const requiredDocumentTypes = getRequiredDocumentTypes(selectedVerifications);

  const toggleApplicant = (tempId: string) => {
    setExpandedApplicants(prev => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  };

  const hasPrimaryApplicant = applicants.some(a => a.is_primary);

  const handleAddApplicant = () => {
    setEditingApplicant(null);
    setApplicantForm({
      applicant_type: hasPrimaryApplicant ? 'co_applicant' : 'primary',
      is_primary: !hasPrimaryApplicant,
      addresses: [],
      documents: []
    });
    setApplicantDialogOpen(true);
  };

  const handleEditApplicant = (applicant: InlineApplicant) => {
    setEditingApplicant(applicant);
    setApplicantForm({ ...applicant });
    setApplicantDialogOpen(true);
  };

  const handleSaveApplicant = () => {
    if (!applicantForm.name?.trim()) return;

    if (editingApplicant) {
      const updated = applicants.map(a => 
        a.tempId === editingApplicant.tempId 
          ? { ...a, ...applicantForm, tempId: a.tempId, addresses: a.addresses, documents: a.documents } as InlineApplicant
          : a
      );
      onApplicantsChange(updated);
    } else {
      const newApplicant: InlineApplicant = {
        tempId: generateTempId(),
        applicant_type: applicantForm.applicant_type || 'co_applicant',
        name: applicantForm.name!,
        relation_to_primary: applicantForm.relation_to_primary,
        pan_number: applicantForm.pan_number,
        aadhar_number: applicantForm.aadhar_number,
        phone: applicantForm.phone,
        email: applicantForm.email,
        date_of_birth: applicantForm.date_of_birth,
        occupation: applicantForm.occupation,
        employer_name: applicantForm.employer_name,
        monthly_income: applicantForm.monthly_income,
        is_primary: applicantForm.is_primary || false,
        bank_name: applicantForm.bank_name,
        account_number: applicantForm.account_number,
        ifsc_code: applicantForm.ifsc_code,
        assessment_year: applicantForm.assessment_year,
        itr_filing_date: applicantForm.itr_filing_date,
        total_income: applicantForm.total_income,
        addresses: [],
        documents: []
      };
      onApplicantsChange([...applicants, newApplicant]);
      setExpandedApplicants(prev => new Set([...prev, newApplicant.tempId]));
    }
    setApplicantDialogOpen(false);
    setApplicantForm({});
  };

  const handleDeleteApplicant = (tempId: string) => {
    onApplicantsChange(applicants.filter(a => a.tempId !== tempId));
  };

  // Address handlers
  const handleAddAddress = (applicantTempId: string) => {
    setEditingAddress({ address: null, applicantTempId });
    setAddressForm({
      address_type: requiredAddressTypes[0] as AddressType || 'residence',
      is_primary: true
    });
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address: InlineAddress, applicantTempId: string) => {
    setEditingAddress({ address, applicantTempId });
    setAddressForm({ ...address });
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = () => {
    if (!editingAddress || !addressForm.address_line1?.trim() || !addressForm.city?.trim()) return;

    const updatedApplicants = applicants.map(applicant => {
      if (applicant.tempId !== editingAddress.applicantTempId) return applicant;

      let newAddresses: InlineAddress[];
      if (editingAddress.address) {
        newAddresses = applicant.addresses.map(addr =>
          addr.tempId === editingAddress.address!.tempId
            ? { ...addr, ...addressForm } as InlineAddress
            : addr
        );
      } else {
        const newAddress: InlineAddress = {
          tempId: generateTempId(),
          address_type: addressForm.address_type || 'residence',
          address_line1: addressForm.address_line1!,
          address_line2: addressForm.address_line2,
          landmark: addressForm.landmark,
          city: addressForm.city!,
          state: addressForm.state || '',
          pincode: addressForm.pincode || '',
          is_primary: addressForm.is_primary || false,
          ownership_type: addressForm.ownership_type,
          years_at_address: addressForm.years_at_address
        };
        newAddresses = [...applicant.addresses, newAddress];
      }

      return { ...applicant, addresses: newAddresses };
    });

    onApplicantsChange(updatedApplicants);
    setAddressDialogOpen(false);
    setAddressForm({});
    setEditingAddress(null);
  };

  const handleDeleteAddress = (applicantTempId: string, addressTempId: string) => {
    const updated = applicants.map(applicant => {
      if (applicant.tempId !== applicantTempId) return applicant;
      return {
        ...applicant,
        addresses: applicant.addresses.filter(addr => addr.tempId !== addressTempId)
      };
    });
    onApplicantsChange(updated);
  };

  // Document handlers
  const handleAddDocument = (applicantTempId: string) => {
    setEditingDocument({ document: null, applicantTempId });
    setDocumentForm({
      document_type: requiredDocumentTypes[0] as DocumentType || 'pan',
    });
    setDocumentDialogOpen(true);
  };

  const handleSaveDocument = () => {
    if (!editingDocument || !documentForm.document_type) return;

    const updatedApplicants = applicants.map(applicant => {
      if (applicant.tempId !== editingDocument.applicantTempId) return applicant;

      const newDocument: InlineDocument = {
        tempId: generateTempId(),
        document_type: documentForm.document_type as DocumentType,
        document_number: documentForm.document_number,
        file: documentForm.file,
        fileName: documentForm.file?.name || documentForm.fileName
      };
      
      return { ...applicant, documents: [...applicant.documents, newDocument] };
    });

    onApplicantsChange(updatedApplicants);
    setDocumentDialogOpen(false);
    setDocumentForm({});
    setEditingDocument(null);
  };

  const handleDeleteDocument = (applicantTempId: string, documentTempId: string) => {
    const updated = applicants.map(applicant => {
      if (applicant.tempId !== applicantTempId) return applicant;
      return {
        ...applicant,
        documents: applicant.documents.filter(doc => doc.tempId !== documentTempId)
      };
    });
    onApplicantsChange(updated);
  };

  const getApplicantTypeLabel = (type: string) => {
    return APPLICANT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getAddressTypeLabel = (type: string) => {
    return ADDRESS_TYPES.find(t => t.value === type)?.label || type;
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getApplicantTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'primary': return 'default';
      case 'co_applicant': return 'secondary';
      case 'guarantor': return 'outline';
      default: return 'secondary';
    }
  };

  // Filter document types based on selected verifications
  const availableDocumentTypes = DOCUMENT_TYPES.filter(dt => 
    requiredDocumentTypes.includes(dt.value) || requiredDocumentTypes.length === 0
  );

  // Filter address types based on selected verifications
  const availableAddressTypes = ADDRESS_TYPES.filter(at => 
    requiredAddressTypes.includes(at.value) || requiredAddressTypes.length === 0
  );

  if (selectedVerifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            Applicants
          </CardTitle>
          <CardDescription>
            Select verification types above to enable applicant management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Please select at least one verification type first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Applicants ({applicants.length})
            </CardTitle>
            <CardDescription>
              Add applicants with addresses and documents based on selected verifications
            </CardDescription>
          </div>
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={handleAddApplicant}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Applicant
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No applicants added yet.</p>
              <p className="text-sm mb-4">
                Add applicants with their 
                {requiresAddress && ' addresses'}
                {requiresDocuments && ' documents'}
                {requiresEmployment && ' employment details'}
                {requiresBankDetails && ' bank details'}
                {requiresITRDetails && ' ITR details'}
              </p>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleAddApplicant}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Applicant
              </Button>
            </div>
          ) : (
            applicants.map(applicant => (
              <Collapsible
                key={applicant.tempId}
                open={expandedApplicants.has(applicant.tempId)}
                onOpenChange={() => toggleApplicant(applicant.tempId)}
              >
                <div className="border rounded-lg">
                  {/* Applicant Header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedApplicants.has(applicant.tempId) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{applicant.name}</span>
                            <Badge variant={getApplicantTypeBadgeVariant(applicant.applicant_type)}>
                              {getApplicantTypeLabel(applicant.applicant_type)}
                            </Badge>
                            {applicant.is_primary && (
                              <Badge variant="default" className="bg-green-600">Primary</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                            {applicant.phone && <span>📞 {applicant.phone}</span>}
                            {requiresAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {applicant.addresses.length} address(es)
                              </span>
                            )}
                            {requiresDocuments && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {applicant.documents.length} document(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditApplicant(applicant)}
                        >
                          Edit
                        </Button>
                        {!applicant.is_primary && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteApplicant(applicant.tempId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Applicant Details */}
                  <CollapsibleContent>
                    <div className="border-t p-4 bg-muted/20 space-y-4">
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {applicant.pan_number && (
                          <div><span className="text-muted-foreground">PAN:</span> <span className="font-medium">{applicant.pan_number}</span></div>
                        )}
                        {applicant.aadhar_number && (
                          <div><span className="text-muted-foreground">Aadhar:</span> <span className="font-medium">{applicant.aadhar_number}</span></div>
                        )}
                        {applicant.occupation && (
                          <div><span className="text-muted-foreground">Occupation:</span> <span className="font-medium">{applicant.occupation}</span></div>
                        )}
                        {applicant.employer_name && (
                          <div><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{applicant.employer_name}</span></div>
                        )}
                        {requiresBankDetails && applicant.bank_name && (
                          <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{applicant.bank_name}</span></div>
                        )}
                        {requiresITRDetails && applicant.assessment_year && (
                          <div><span className="text-muted-foreground">AY:</span> <span className="font-medium">{applicant.assessment_year}</span></div>
                        )}
                      </div>

                      <Tabs defaultValue="addresses" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          {requiresAddress && (
                            <TabsTrigger value="addresses" className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Addresses ({applicant.addresses.length})
                            </TabsTrigger>
                          )}
                          {requiresDocuments && (
                            <TabsTrigger value="documents" className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Documents ({applicant.documents.length})
                            </TabsTrigger>
                          )}
                        </TabsList>

                        {/* Addresses Tab */}
                        {requiresAddress && (
                          <TabsContent value="addresses" className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-sm">
                                Required: {requiredAddressTypes.map(t => getAddressTypeLabel(t)).join(', ')}
                              </h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddAddress(applicant.tempId)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Address
                              </Button>
                            </div>
                            {applicant.addresses.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic py-4 text-center border border-dashed rounded">
                                No addresses added yet
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {applicant.addresses.map(address => (
                                  <div 
                                    key={address.tempId} 
                                    className="flex items-start justify-between p-3 bg-background rounded border"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">
                                          {getAddressTypeLabel(address.address_type)}
                                        </Badge>
                                        {address.is_primary && (
                                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                                        )}
                                        {address.ownership_type && (
                                          <Badge variant="outline" className="text-xs">{address.ownership_type}</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm">
                                        {address.address_line1}
                                        {address.address_line2 && `, ${address.address_line2}`}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {address.city}, {address.state} - {address.pincode}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditAddress(address, applicant.tempId)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleDeleteAddress(applicant.tempId, address.tempId)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        )}

                        {/* Documents Tab */}
                        {requiresDocuments && (
                          <TabsContent value="documents" className="mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-sm">
                                Required: {requiredDocumentTypes.slice(0, 3).map(t => getDocumentTypeLabel(t)).join(', ')}
                                {requiredDocumentTypes.length > 3 && ` +${requiredDocumentTypes.length - 3} more`}
                              </h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddDocument(applicant.tempId)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Document
                              </Button>
                            </div>
                            {applicant.documents.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic py-4 text-center border border-dashed rounded">
                                No documents added yet
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {applicant.documents.map(doc => (
                                  <div 
                                    key={doc.tempId} 
                                    className="flex items-center justify-between p-3 bg-background rounded border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <Badge variant="outline" className="text-xs mb-1">
                                          {getDocumentTypeLabel(doc.document_type)}
                                        </Badge>
                                        <p className="text-sm">
                                          {doc.document_number || doc.fileName || 'No details'}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteDocument(applicant.tempId, doc.tempId)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>

      {/* Applicant Dialog */}
      <Dialog open={applicantDialogOpen} onOpenChange={setApplicantDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingApplicant ? 'Edit Applicant' : 'Add Applicant'}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              {requiresEmployment && <TabsTrigger value="employment">Employment</TabsTrigger>}
              {requiresBankDetails && <TabsTrigger value="bank">Bank Details</TabsTrigger>}
              {requiresITRDetails && <TabsTrigger value="itr">ITR Details</TabsTrigger>}
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Applicant Type *</Label>
                  <Select 
                    value={applicantForm.applicant_type || 'co_applicant'} 
                    onValueChange={(v) => setApplicantForm(prev => ({ 
                      ...prev, 
                      applicant_type: v as ApplicantType,
                      is_primary: v === 'primary'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICANT_TYPES.map(type => (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          disabled={type.value === 'primary' && hasPrimaryApplicant && !editingApplicant?.is_primary}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    placeholder="Full name"
                    value={applicantForm.name || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    placeholder="Mobile number"
                    value={applicantForm.phone || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    placeholder="Email address"
                    value={applicantForm.email || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input 
                    placeholder="ABCDE1234F"
                    value={applicantForm.pan_number || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aadhar Number</Label>
                  <Input 
                    placeholder="1234 5678 9012"
                    value={applicantForm.aadhar_number || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, aadhar_number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input 
                    type="date"
                    value={applicantForm.date_of_birth || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                {applicantForm.applicant_type !== 'primary' && (
                  <div className="space-y-2">
                    <Label>Relation to Primary</Label>
                    <Select 
                      value={applicantForm.relation_to_primary || ''} 
                      onValueChange={(v) => setApplicantForm(prev => ({ ...prev, relation_to_primary: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            {requiresEmployment && (
              <TabsContent value="employment" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Select 
                      value={applicantForm.occupation || ''} 
                      onValueChange={(v) => setApplicantForm(prev => ({ ...prev, occupation: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select occupation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salaried">Salaried</SelectItem>
                        <SelectItem value="self_employed">Self Employed</SelectItem>
                        <SelectItem value="business">Business Owner</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="homemaker">Homemaker</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employer / Business Name</Label>
                    <Input 
                      placeholder="Company / Business name"
                      value={applicantForm.employer_name || ''}
                      onChange={(e) => setApplicantForm(prev => ({ ...prev, employer_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Income (₹)</Label>
                  <Input 
                    type="number"
                    placeholder="e.g., 50000"
                    value={applicantForm.monthly_income || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, monthly_income: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </TabsContent>
            )}

            {requiresBankDetails && (
              <TabsContent value="bank" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input 
                      placeholder="e.g., HDFC Bank"
                      value={applicantForm.bank_name || ''}
                      onChange={(e) => setApplicantForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input 
                      placeholder="Account number"
                      value={applicantForm.account_number || ''}
                      onChange={(e) => setApplicantForm(prev => ({ ...prev, account_number: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input 
                    placeholder="e.g., HDFC0001234"
                    value={applicantForm.ifsc_code || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                  />
                </div>
              </TabsContent>
            )}

            {requiresITRDetails && (
              <TabsContent value="itr" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assessment Year</Label>
                    <Select 
                      value={applicantForm.assessment_year || ''} 
                      onValueChange={(v) => setApplicantForm(prev => ({ ...prev, assessment_year: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AY" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-25">AY 2024-25</SelectItem>
                        <SelectItem value="2023-24">AY 2023-24</SelectItem>
                        <SelectItem value="2022-23">AY 2022-23</SelectItem>
                        <SelectItem value="2021-22">AY 2021-22</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ITR Filing Date</Label>
                    <Input 
                      type="date"
                      value={applicantForm.itr_filing_date || ''}
                      onChange={(e) => setApplicantForm(prev => ({ ...prev, itr_filing_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Income (₹)</Label>
                  <Input 
                    type="number"
                    placeholder="As per ITR"
                    value={applicantForm.total_income || ''}
                    onChange={(e) => setApplicantForm(prev => ({ ...prev, total_income: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApplicantDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveApplicant} disabled={!applicantForm.name?.trim()}>
              {editingApplicant ? 'Update' : 'Add'} Applicant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress?.address ? 'Edit Address' : 'Add Address'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Address Type *</Label>
                <Select 
                  value={addressForm.address_type || 'residence'} 
                  onValueChange={(v) => setAddressForm(prev => ({ ...prev, address_type: v as AddressType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAddressTypes.length > 0 ? availableAddressTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    )) : ADDRESS_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ownership</Label>
                <Select 
                  value={addressForm.ownership_type || ''} 
                  onValueChange={(v) => setAddressForm(prev => ({ ...prev, ownership_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERSHIP_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address Line 1 *</Label>
              <Input 
                placeholder="House/Flat No., Building Name"
                value={addressForm.address_line1 || ''}
                onChange={(e) => setAddressForm(prev => ({ ...prev, address_line1: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input 
                placeholder="Street, Area"
                value={addressForm.address_line2 || ''}
                onChange={(e) => setAddressForm(prev => ({ ...prev, address_line2: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Landmark</Label>
              <Input 
                placeholder="Near..."
                value={addressForm.landmark || ''}
                onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input 
                  placeholder="City"
                  value={addressForm.city || ''}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input 
                  placeholder="State"
                  value={addressForm.state || ''}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pincode *</Label>
                <Input 
                  placeholder="400001"
                  maxLength={6}
                  value={addressForm.pincode || ''}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Years at Address</Label>
              <Input 
                type="number"
                placeholder="e.g., 5"
                value={addressForm.years_at_address || ''}
                onChange={(e) => setAddressForm(prev => ({ ...prev, years_at_address: parseInt(e.target.value) || undefined }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddressDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveAddress} 
              disabled={!addressForm.address_line1?.trim() || !addressForm.city?.trim()}
            >
              {editingAddress?.address ? 'Update' : 'Add'} Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select 
                value={documentForm.document_type || ''} 
                onValueChange={(v) => setDocumentForm(prev => ({ ...prev, document_type: v as DocumentType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocumentTypes.length > 0 ? availableDocumentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  )) : DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Number</Label>
              <Input 
                placeholder="e.g., ABCDE1234F"
                value={documentForm.document_number || ''}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, document_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Document (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Input 
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="doc-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setDocumentForm(prev => ({ ...prev, file, fileName: file.name }));
                    }
                  }}
                />
                <label htmlFor="doc-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {documentForm.fileName || 'Click to upload PDF, JPG, or PNG'}
                  </p>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveDocument} 
              disabled={!documentForm.document_type}
            >
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

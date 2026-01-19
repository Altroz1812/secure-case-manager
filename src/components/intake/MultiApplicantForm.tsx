import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  UserPlus, 
  Users, 
  MapPin, 
  FileText,
  Trash2,
  Edit,
  User
} from 'lucide-react';
import { ApplicantFormDialog } from './ApplicantFormDialog';
import { AddressFormDialog } from './AddressFormDialog';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { 
  useLeadApplicants, 
  useDeleteApplicant, 
  useDeleteAddress,
  useDeleteApplicantDocument,
  ApplicantWithDetails,
  ApplicantAddress,
  ApplicantDocument,
  APPLICANT_TYPES,
  ADDRESS_TYPES,
  DOCUMENT_TYPES
} from '@/hooks/useLeadApplicants';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

interface MultiApplicantFormProps {
  leadId: string;
  readonly?: boolean;
}

export function MultiApplicantForm({ leadId, readonly = false }: MultiApplicantFormProps) {
  const { data: applicants, isLoading } = useLeadApplicants(leadId);
  const deleteApplicant = useDeleteApplicant();
  const deleteAddress = useDeleteAddress();
  const deleteDocument = useDeleteApplicantDocument();

  const [expandedApplicants, setExpandedApplicants] = useState<Set<string>>(new Set());
  const [applicantDialogOpen, setApplicantDialogOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<ApplicantWithDetails | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<{ address: ApplicantAddress | null; applicantId: string } | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [uploadingForApplicant, setUploadingForApplicant] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'applicant' | 'address' | 'document'; id: string; extra?: string } | null>(null);

  const toggleApplicant = (id: string) => {
    setExpandedApplicants(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteApplicant = async () => {
    if (deleteConfirm?.type === 'applicant') {
      await deleteApplicant.mutateAsync({ id: deleteConfirm.id, leadId });
      setDeleteConfirm(null);
    }
  };

  const handleDeleteAddress = async () => {
    if (deleteConfirm?.type === 'address') {
      await deleteAddress.mutateAsync({ id: deleteConfirm.id, leadId });
      setDeleteConfirm(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (deleteConfirm?.type === 'document' && deleteConfirm.extra) {
      await deleteDocument.mutateAsync({ id: deleteConfirm.id, storagePath: deleteConfirm.extra, leadId });
      setDeleteConfirm(null);
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-muted-foreground">
            Loading applicants...
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryApplicant = applicants?.find(a => a.is_primary);
  const otherApplicants = applicants?.filter(a => !a.is_primary) || [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Applicants ({applicants?.length || 0})
            </CardTitle>
            <CardDescription>
              Primary applicant, co-applicants, and guarantors with their addresses and documents
            </CardDescription>
          </div>
          {!readonly && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setEditingApplicant(null);
                setApplicantDialogOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Applicant
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {(!applicants || applicants.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No applicants added yet.</p>
              {!readonly && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setEditingApplicant(null);
                    setApplicantDialogOpen(true);
                  }}
                >
                  Add the first applicant
                </Button>
              )}
            </div>
          ) : (
            applicants.map(applicant => (
              <Collapsible
                key={applicant.id}
                open={expandedApplicants.has(applicant.id)}
                onOpenChange={() => toggleApplicant(applicant.id)}
              >
                <div className="border rounded-lg">
                  {/* Applicant Header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedApplicants.has(applicant.id) ? (
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
                            {applicant.email && <span>✉️ {applicant.email}</span>}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {applicant.addresses.length} address(es)
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {applicant.documents.length} document(s)
                            </span>
                          </div>
                        </div>
                      </div>
                      {!readonly && (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingApplicant(applicant);
                              setApplicantDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!applicant.is_primary && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteConfirm({ type: 'applicant', id: applicant.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleTrigger>

                  {/* Applicant Details */}
                  <CollapsibleContent>
                    <div className="border-t p-4 bg-muted/20 space-y-6">
                      {/* Applicant Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {applicant.pan_number && (
                          <div>
                            <span className="text-muted-foreground">PAN:</span>
                            <span className="ml-2 font-medium">{applicant.pan_number}</span>
                          </div>
                        )}
                        {applicant.aadhar_number && (
                          <div>
                            <span className="text-muted-foreground">Aadhar:</span>
                            <span className="ml-2 font-medium">{applicant.aadhar_number}</span>
                          </div>
                        )}
                        {applicant.occupation && (
                          <div>
                            <span className="text-muted-foreground">Occupation:</span>
                            <span className="ml-2 font-medium">{applicant.occupation}</span>
                          </div>
                        )}
                        {applicant.employer_name && (
                          <div>
                            <span className="text-muted-foreground">Employer:</span>
                            <span className="ml-2 font-medium">{applicant.employer_name}</span>
                          </div>
                        )}
                        {applicant.monthly_income && (
                          <div>
                            <span className="text-muted-foreground">Income:</span>
                            <span className="ml-2 font-medium">₹{applicant.monthly_income.toLocaleString()}/month</span>
                          </div>
                        )}
                        {applicant.relation_to_primary && (
                          <div>
                            <span className="text-muted-foreground">Relation:</span>
                            <span className="ml-2 font-medium">{applicant.relation_to_primary}</span>
                          </div>
                        )}
                      </div>

                      {/* Addresses Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Addresses
                          </h4>
                          {!readonly && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAddress({ address: null, applicantId: applicant.id });
                                setAddressDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Address
                            </Button>
                          )}
                        </div>
                        {applicant.addresses.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No addresses added</p>
                        ) : (
                          <div className="space-y-2">
                            {applicant.addresses.map(address => (
                              <div 
                                key={address.id} 
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
                                      <Badge variant="outline" className="text-xs">
                                        {address.ownership_type}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm">
                                    {address.address_line1}
                                    {address.address_line2 && `, ${address.address_line2}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.city}, {address.state} - {address.pincode}
                                    {address.landmark && ` (Near: ${address.landmark})`}
                                  </p>
                                </div>
                                {!readonly && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setEditingAddress({ address, applicantId: applicant.id });
                                        setAddressDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => setDeleteConfirm({ type: 'address', id: address.id })}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Documents Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documents
                          </h4>
                          {!readonly && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUploadingForApplicant(applicant.id);
                                setDocumentDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Upload Document
                            </Button>
                          )}
                        </div>
                        {applicant.documents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No documents uploaded</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {applicant.documents.map(doc => (
                              <div 
                                key={doc.id} 
                                className="flex items-center justify-between p-3 bg-background rounded border"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {getDocumentTypeLabel(doc.document_type)}
                                      </Badge>
                                      {doc.document_number && (
                                        <span className="text-xs text-muted-foreground">
                                          #{doc.document_number}
                                        </span>
                                      )}
                                      {doc.is_verified && (
                                        <Badge variant="default" className="text-xs bg-green-600">
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {!readonly && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive flex-shrink-0"
                                    onClick={() => setDeleteConfirm({ 
                                      type: 'document', 
                                      id: doc.id, 
                                      extra: doc.storage_path 
                                    })}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ApplicantFormDialog
        open={applicantDialogOpen}
        onOpenChange={setApplicantDialogOpen}
        leadId={leadId}
        applicant={editingApplicant}
        hasPrimary={!!primaryApplicant}
      />

      <AddressFormDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        leadId={leadId}
        applicantId={editingAddress?.applicantId || ''}
        address={editingAddress?.address || null}
      />

      <DocumentUploadDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        leadId={leadId}
        applicantId={uploadingForApplicant || ''}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'applicant' && 'This will permanently delete this applicant along with all their addresses and documents.'}
              {deleteConfirm?.type === 'address' && 'This will permanently delete this address.'}
              {deleteConfirm?.type === 'document' && 'This will permanently delete this document.'}
              {' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'applicant') handleDeleteApplicant();
                if (deleteConfirm?.type === 'address') handleDeleteAddress();
                if (deleteConfirm?.type === 'document') handleDeleteDocument();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

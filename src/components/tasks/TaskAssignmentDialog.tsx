import { useState, useMemo } from 'react';
import { useFieldExecutives, FieldExecutiveWithProfile } from '@/hooks/useFieldExecutives';
import { useAssignTask, TaskWithDetails } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  User, 
  MapPin, 
  Briefcase,
  Check,
  AlertCircle,
  ShieldAlert,
  Zap
} from 'lucide-react';

interface TaskAssignmentDialogProps {
  task: TaskWithDetails | null;
  onClose: () => void;
}

export function TaskAssignmentDialog({ task, onClose }: TaskAssignmentDialogProps) {
  const { user, hasAnyRole } = useAuth();
  const { data: fieldExecutives, isLoading } = useFieldExecutives();
  const assignTask = useAssignTask();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFE, setSelectedFE] = useState<FieldExecutiveWithProfile | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  // Check if this is a reassignment (task already has an assignee)
  const isReassignment = !!task?.assigned_to;
  
  // Only admin, qc, ops_manager can reassign
  const canReassign = hasAnyRole(['admin', 'qc', 'ops_manager']);
  
  // Block reassignment if user doesn't have permission
  const isReassignmentBlocked = isReassignment && !canReassign;

  // Filter FEs based on pincode match, skill match, and search query
  const filteredFEs = useMemo(() => {
    if (!fieldExecutives) return [];
    
    let filtered = fieldExecutives.filter(fe => fe.is_available);

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fe => 
        fe.profile?.full_name.toLowerCase().includes(query) ||
        fe.employee_code.toLowerCase().includes(query) ||
        fe.mapped_pincodes?.some(p => p.includes(query))
      );
    }

    // Sort by pincode match, skill match, then workload
    const taskPincode = task?.lead?.pincode;
    const taskVerificationType = task?.verification_type;
    
    // Map verification type to skill
    const requiredSkill = taskVerificationType === 'residential' ? 'residential' 
      : taskVerificationType === 'business' ? 'business'
      : taskVerificationType === 'end_use' ? 'end_use'
      : null;

    filtered = filtered.sort((a, b) => {
      // Pincode match priority
      const aPincodeMatch = taskPincode && a.mapped_pincodes?.includes(taskPincode) ? 1 : 0;
      const bPincodeMatch = taskPincode && b.mapped_pincodes?.includes(taskPincode) ? 1 : 0;
      if (aPincodeMatch !== bPincodeMatch) return bPincodeMatch - aPincodeMatch;
      
      // Skill match priority
      const aSkillMatch = requiredSkill && a.skills?.includes(requiredSkill) ? 1 : 0;
      const bSkillMatch = requiredSkill && b.skills?.includes(requiredSkill) ? 1 : 0;
      if (aSkillMatch !== bSkillMatch) return bSkillMatch - aSkillMatch;
      
      // Then sort by workload (ascending)
      return (a.current_workload || 0) - (b.current_workload || 0);
    });

    return filtered;
  }, [fieldExecutives, searchQuery, task?.lead?.pincode, task?.verification_type]);

  const handleAssign = async () => {
    if (!task || !selectedFE || !user) return;

    // Validate mandatory reason for reassignment
    if (isReassignment && !reason.trim()) {
      setReasonError('Reason is required for reassignments');
      return;
    }

    setReasonError('');

    await assignTask.mutateAsync({
      taskId: task.id,
      assignedTo: selectedFE.user_id,
      assignedBy: user.id,
      reason: reason.trim() || undefined,
      isOverride: isReassignment,
      previousAssignee: task.assigned_to || undefined,
    });

    onClose();
    setSelectedFE(null);
    setReason('');
    setReasonError('');
  };

  const taskPincode = task?.lead?.pincode;
  const taskVerificationType = task?.verification_type;
  const requiredSkill = taskVerificationType === 'residential' ? 'residential' 
    : taskVerificationType === 'business' ? 'business'
    : taskVerificationType === 'end_use' ? 'end_use'
    : null;

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReassignment ? (
              <>
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Reassign Task
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 text-primary" />
                Assign Task
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReassignment 
              ? `Reassigning ${task?.task_number} from ${task?.assigned_user?.full_name || 'current assignee'}`
              : `Select a field executive to assign ${task?.task_number}`
            }
            {task?.lead?.address && (
              <span className="block mt-1 text-sm">
                <MapPin className="h-3 w-3 inline mr-1" />
                {task.lead.address} {taskPincode && `(${taskPincode})`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Reassignment blocked alert */}
        {isReassignmentBlocked && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Only Admin, QC, or Operations Manager can reassign tasks. Contact your supervisor for assistance.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={isReassignmentBlocked}
            />
          </div>

          {/* FE List */}
          <ScrollArea className="h-[300px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredFEs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <User className="h-8 w-8 mb-2" />
                <p>No available field executives found</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredFEs.map(fe => {
                  const isPincodeMatch = taskPincode && fe.mapped_pincodes?.includes(taskPincode);
                  const isSkillMatch = requiredSkill && fe.skills?.includes(requiredSkill);
                  const isOverloaded = (fe.current_workload || 0) >= (fe.max_workload || 10);
                  const isSelected = selectedFE?.id === fe.id;

                  return (
                    <Card 
                      key={fe.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      } ${isOverloaded || isReassignmentBlocked ? 'opacity-60' : ''}`}
                      onClick={() => !isOverloaded && !isReassignmentBlocked && setSelectedFE(fe)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              {isSelected ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{fe.profile?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{fe.employee_code}</p>
                              {fe.skills && fe.skills.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {fe.skills.map(skill => (
                                    <Badge 
                                      key={skill} 
                                      variant={skill === requiredSkill ? "default" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className={`text-sm ${isOverloaded ? 'text-destructive' : ''}`}>
                                {fe.current_workload || 0}/{fe.max_workload || 10}
                              </span>
                            </div>
                            {isPincodeMatch && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                <MapPin className="h-3 w-3 mr-1" />
                                Pincode
                              </Badge>
                            )}
                            {isSkillMatch && (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                <Check className="h-3 w-3 mr-1" />
                                Skill
                              </Badge>
                            )}
                            {isOverloaded && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                At Capacity
                              </Badge>
                            )}
                          </div>
                        </div>

                        {fe.mapped_pincodes && fe.mapped_pincodes.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Pincodes: {fe.mapped_pincodes.slice(0, 5).join(', ')}
                            {fe.mapped_pincodes.length > 5 && ` +${fe.mapped_pincodes.length - 5} more`}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Mandatory reason for reassignment */}
          {isReassignment && !isReassignmentBlocked && (
            <div className="space-y-2">
              <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Reassignment requires a mandatory reason for audit trail.
                </AlertDescription>
              </Alert>
              <Textarea
                placeholder="Enter reason for reassignment (required)..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setReasonError('');
                }}
                rows={2}
                className={reasonError ? 'border-destructive' : ''}
              />
              {reasonError && (
                <p className="text-sm text-destructive">{reasonError}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedFE || assignTask.isPending || isReassignmentBlocked}
          >
            {assignTask.isPending ? 'Assigning...' : isReassignment ? 'Reassign Task' : 'Assign Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  User, 
  MapPin, 
  Briefcase,
  Check,
  AlertCircle
} from 'lucide-react';

interface TaskAssignmentDialogProps {
  task: TaskWithDetails | null;
  onClose: () => void;
}

export function TaskAssignmentDialog({ task, onClose }: TaskAssignmentDialogProps) {
  const { user } = useAuth();
  const { data: fieldExecutives, isLoading } = useFieldExecutives();
  const assignTask = useAssignTask();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFE, setSelectedFE] = useState<FieldExecutiveWithProfile | null>(null);
  const [reason, setReason] = useState('');
  const [isOverride, setIsOverride] = useState(false);

  // Filter FEs based on pincode match and search query
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

    // Sort by pincode match
    const taskPincode = task?.lead?.pincode;
    if (taskPincode) {
      filtered = filtered.sort((a, b) => {
        const aMatch = a.mapped_pincodes?.includes(taskPincode) ? 1 : 0;
        const bMatch = b.mapped_pincodes?.includes(taskPincode) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        
        // Then sort by workload (ascending)
        return (a.current_workload || 0) - (b.current_workload || 0);
      });
    }

    return filtered;
  }, [fieldExecutives, searchQuery, task?.lead?.pincode]);

  const handleAssign = async () => {
    if (!task || !selectedFE || !user) return;

    await assignTask.mutateAsync({
      taskId: task.id,
      assignedTo: selectedFE.user_id,
      assignedBy: user.id,
      reason: reason || undefined,
      isOverride,
      previousAssignee: task.assigned_to || undefined,
    });

    onClose();
    setSelectedFE(null);
    setReason('');
    setIsOverride(false);
  };

  const taskPincode = task?.lead?.pincode;

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Select a field executive to assign {task?.task_number}
            {task?.lead?.address && (
              <span className="block mt-1 text-sm">
                <MapPin className="h-3 w-3 inline mr-1" />
                {task.lead.address} {taskPincode && `(${taskPincode})`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
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
                  const isOverloaded = (fe.current_workload || 0) >= (fe.max_workload || 10);
                  const isSelected = selectedFE?.id === fe.id;

                  return (
                    <Card 
                      key={fe.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      } ${isOverloaded ? 'opacity-60' : ''}`}
                      onClick={() => !isOverloaded && setSelectedFE(fe)}
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
                                <div className="flex gap-1 mt-1">
                                  {fe.skills.slice(0, 3).map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className={`text-sm ${isOverloaded ? 'text-destructive' : ''}`}>
                                {fe.current_workload || 0}/{fe.max_workload || 10}
                              </span>
                            </div>
                            {isPincodeMatch && (
                              <Badge className="mt-1 bg-green-100 text-green-700">
                                <MapPin className="h-3 w-3 mr-1" />
                                Pincode Match
                              </Badge>
                            )}
                            {isOverloaded && (
                              <Badge variant="destructive" className="mt-1">
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

          {/* Reason (for reassignment) */}
          {task?.assigned_to && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="override" 
                  checked={isOverride}
                  onCheckedChange={(checked) => setIsOverride(checked as boolean)}
                />
                <label htmlFor="override" className="text-sm">
                  This is an override/reassignment
                </label>
              </div>
              <Textarea
                placeholder="Reason for reassignment (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedFE || assignTask.isPending}
          >
            {assignTask.isPending ? 'Assigning...' : 'Assign Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

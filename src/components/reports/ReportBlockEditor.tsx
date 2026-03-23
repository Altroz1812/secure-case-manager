import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ChevronUp, ChevronDown, GripVertical, Plus, X } from 'lucide-react';
import { ReportBlock, BLOCK_TYPE_META, AVAILABLE_FIELDS } from './reportTypes';

interface Props {
  block: ReportBlock;
  index: number;
  total: number;
  onChange: (block: ReportBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function ReportBlockEditor({ block, index, total, onChange, onRemove, onMoveUp, onMoveDown }: Props) {
  const meta = BLOCK_TYPE_META[block.type];
  const updateConfig = (key: string, value: any) => {
    onChange({ ...block, config: { ...block.config, [key]: value } });
  };

  const renderFields = () => {
    switch (block.type) {
      case 'header':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={block.config.title || ''} onChange={e => updateConfig('title', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Subtitle</Label>
              <Input value={block.config.subtitle || ''} onChange={e => updateConfig('subtitle', e.target.value)} className="h-8 text-sm" placeholder="e.g. {{client_name}}" />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={block.config.showDate ?? true} onCheckedChange={v => updateConfig('showDate', v)} />
                <Label className="text-xs">Show Date</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={block.config.showLogo ?? true} onCheckedChange={v => updateConfig('showLogo', v)} />
                <Label className="text-xs">Show Logo</Label>
              </div>
            </div>
            {block.config.showLogo && (
              <div>
                <Label className="text-xs">Logo Position</Label>
                <Select value={block.config.logoPosition || 'left'} onValueChange={v => updateConfig('logoPosition', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 'client_logo':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Position</Label>
              <Select value={block.config.position || 'center'} onValueChange={v => updateConfig('position', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Width (px)</Label>
                <Input type="number" value={block.config.width || 120} onChange={e => updateConfig('width', +e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Height (px)</Label>
                <Input type="number" value={block.config.height || 60} onChange={e => updateConfig('height', +e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          </div>
        );

      case 'section_title':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={block.config.title || ''} onChange={e => updateConfig('title', e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={block.config.showDivider ?? true} onCheckedChange={v => updateConfig('showDivider', v)} />
                <Label className="text-xs">Divider</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs">Align</Label>
              <Select value={block.config.align || 'left'} onValueChange={v => updateConfig('align', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'key_value_table':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Section Label (optional)</Label>
              <Input value={block.config.title || ''} onChange={e => updateConfig('title', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Columns</Label>
              <Select value={String(block.config.columns || 2)} onValueChange={v => updateConfig('columns', +v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Fields</Label>
              <div className="space-y-1.5">
                {(block.config.fields || []).map((f: any, i: number) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <Input
                      value={f.label}
                      onChange={e => {
                        const fields = [...block.config.fields];
                        fields[i] = { ...fields[i], label: e.target.value };
                        updateConfig('fields', fields);
                      }}
                      className="h-7 text-xs flex-1"
                      placeholder="Label"
                    />
                    <Select
                      value={f.field}
                      onValueChange={v => {
                        const fields = [...block.config.fields];
                        fields[i] = { ...fields[i], field: v };
                        updateConfig('fields', fields);
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FIELDS.map(af => (
                          <SelectItem key={af} value={af} className="text-xs">{af}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                      const fields = block.config.fields.filter((_: any, j: number) => j !== i);
                      updateConfig('fields', fields);
                    }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => {
                  updateConfig('fields', [...(block.config.fields || []), { label: '', field: '{{applicant_name}}' }]);
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Add Field
                </Button>
              </div>
            </div>
          </div>
        );

      case 'data_table':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title (optional)</Label>
              <Input value={block.config.title || ''} onChange={e => updateConfig('title', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Row Data Source</Label>
              <Select value={block.config.rowSource || 'checklist_results'} onValueChange={v => updateConfig('rowSource', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="checklist_results">Checklist Results</SelectItem>
                  <SelectItem value="observation_tags">Observation Tags</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Column Headers</Label>
              <div className="space-y-1">
                {(block.config.headers || []).map((h: string, i: number) => (
                  <div key={i} className="flex gap-1.5">
                    <Input value={h} onChange={e => {
                      const headers = [...block.config.headers];
                      headers[i] = e.target.value;
                      updateConfig('headers', headers);
                    }} className="h-7 text-xs" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                      updateConfig('headers', block.config.headers.filter((_: string, j: number) => j !== i));
                    }}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => {
                  updateConfig('headers', [...(block.config.headers || []), 'Column']);
                }}><Plus className="h-3 w-3 mr-1" /> Add Column</Button>
              </div>
            </div>
          </div>
        );

      case 'text_block':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Data Field</Label>
              <Select value={block.config.field || ''} onValueChange={v => updateConfig('field', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (static text)</SelectItem>
                  {AVAILABLE_FIELDS.map(f => (
                    <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Static Content (if no field)</Label>
              <Textarea value={block.config.content || ''} onChange={e => updateConfig('content', e.target.value)} className="text-sm" rows={3} />
            </div>
            <div>
              <Label className="text-xs">Font Size</Label>
              <Input type="number" value={block.config.fontSize || 12} onChange={e => updateConfig('fontSize', +e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        );

      case 'photo_grid':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Grid Columns</Label>
              <Select value={String(block.config.columns || 3)} onValueChange={v => updateConfig('columns', +v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={block.config.showCaptions ?? true} onCheckedChange={v => updateConfig('showCaptions', v)} />
                <Label className="text-xs">Captions</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={block.config.showGeoTag ?? true} onCheckedChange={v => updateConfig('showGeoTag', v)} />
                <Label className="text-xs">Geo Tags</Label>
              </div>
            </div>
          </div>
        );

      case 'signature_block':
        return (
          <div className="space-y-3">
            <Label className="text-xs mb-1 block">Signatures</Label>
            {(block.config.signatures || []).map((sig: any, i: number) => (
              <div key={i} className="space-y-1 border rounded-md p-2 relative">
                <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-1 right-1" onClick={() => {
                  updateConfig('signatures', block.config.signatures.filter((_: any, j: number) => j !== i));
                }}><X className="h-3 w-3" /></Button>
                <Input value={sig.label || ''} onChange={e => {
                  const sigs = [...block.config.signatures];
                  sigs[i] = { ...sigs[i], label: e.target.value };
                  updateConfig('signatures', sigs);
                }} className="h-7 text-xs" placeholder="Label (e.g. Verified By)" />
                <Input value={sig.name || ''} onChange={e => {
                  const sigs = [...block.config.signatures];
                  sigs[i] = { ...sigs[i], name: e.target.value };
                  updateConfig('signatures', sigs);
                }} className="h-7 text-xs" placeholder="Name or {{verifier_name}}" />
                <Input value={sig.designation || ''} onChange={e => {
                  const sigs = [...block.config.signatures];
                  sigs[i] = { ...sigs[i], designation: e.target.value };
                  updateConfig('signatures', sigs);
                }} className="h-7 text-xs" placeholder="Designation" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => {
              updateConfig('signatures', [...(block.config.signatures || []), { label: '', name: '', designation: '' }]);
            }}><Plus className="h-3 w-3 mr-1" /> Add Signature</Button>
          </div>
        );

      case 'spacer':
        return (
          <div>
            <Label className="text-xs">Height (px)</Label>
            <Input type="number" value={block.config.height || 20} onChange={e => updateConfig('height', +e.target.value)} className="h-8 text-sm" />
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Style</Label>
              <Select value={block.config.style || 'solid'} onValueChange={v => updateConfig('style', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Thickness (px)</Label>
              <Input type="number" value={block.config.thickness || 1} onChange={e => updateConfig('thickness', +e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xs font-medium">{meta.label}</CardTitle>
            <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
          </div>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={index === 0}>
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={index === total - 1}>
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onRemove}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {renderFields()}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2 } from 'lucide-react';
import ReportBlockEditor from './ReportBlockEditor';
import ReportBlockPalette from './ReportBlockPalette';
import ReportPreview from './ReportPreview';
import { ReportBlock, TemplateConfig, PRESETS } from './reportTypes';

interface Props {
  value: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
}

export default function ReportTemplateBuilder({ value, onChange }: Props) {
  const [presetKey, setPresetKey] = useState<string>('');

  const updateBlocks = (blocks: ReportBlock[]) => {
    onChange({ ...value, blocks });
  };

  const addBlock = (block: ReportBlock) => {
    updateBlocks([...value.blocks, block]);
  };

  const removeBlock = (index: number) => {
    updateBlocks(value.blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, block: ReportBlock) => {
    const blocks = [...value.blocks];
    blocks[index] = block;
    updateBlocks(blocks);
  };

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= value.blocks.length) return;
    const blocks = [...value.blocks];
    const [moved] = blocks.splice(from, 1);
    blocks.splice(to, 0, moved);
    updateBlocks(blocks);
  };

  const applyPreset = () => {
    if (!presetKey || !PRESETS[presetKey]) return;
    onChange({ ...value, blocks: PRESETS[presetKey].blocks.map(b => ({ ...b, id: crypto.randomUUID() })) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Left: Builder */}
      <div className="lg:col-span-3 space-y-4">
        {/* Page settings & presets */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Page Settings</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <Label className="text-xs">Page Size</Label>
                <Select value={value.pageSize || 'A4'} onValueChange={v => onChange({ ...value, pageSize: v as any })}>
                  <SelectTrigger className="h-8 text-sm w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Orientation</Label>
                <Select value={value.orientation || 'portrait'} onValueChange={v => onChange({ ...value, orientation: v as any })}>
                  <SelectTrigger className="h-8 text-sm w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <div className="flex gap-2 items-end">
                <div>
                  <Label className="text-xs">Load Preset</Label>
                  <Select value={presetKey} onValueChange={setPresetKey}>
                    <SelectTrigger className="h-8 text-sm w-52"><SelectValue placeholder="Choose preset..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRESETS).map(([k, p]) => (
                        <SelectItem key={k} value={k}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="secondary" className="h-8" onClick={applyPreset} disabled={!presetKey}>
                  <Wand2 className="h-3 w-3 mr-1" /> Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Block list */}
        <ScrollArea className="max-h-[calc(100vh-320px)]">
          <div className="space-y-2 pr-2">
            {value.blocks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No blocks yet. Add blocks from the palette below or load a preset.
              </div>
            )}
            {value.blocks.map((block, i) => (
              <ReportBlockEditor
                key={block.id}
                block={block}
                index={i}
                total={value.blocks.length}
                onChange={b => updateBlock(i, b)}
                onRemove={() => removeBlock(i)}
                onMoveUp={() => moveBlock(i, i - 1)}
                onMoveDown={() => moveBlock(i, i + 1)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Palette */}
        <ReportBlockPalette onAddBlock={addBlock} />
      </div>

      {/* Right: Preview */}
      <div className="lg:col-span-2">
        <ReportPreview config={value} />
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText, Image, Heading, Table2, Grid3X3, AlignLeft,
  Camera, PenLine, Space, Minus,
} from 'lucide-react';
import { BlockType, BLOCK_TYPE_META, createDefaultBlock, ReportBlock } from './reportTypes';

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  Image: <Image className="h-4 w-4" />,
  Heading: <Heading className="h-4 w-4" />,
  Table2: <Table2 className="h-4 w-4" />,
  Grid3X3: <Grid3X3 className="h-4 w-4" />,
  AlignLeft: <AlignLeft className="h-4 w-4" />,
  Camera: <Camera className="h-4 w-4" />,
  PenLine: <PenLine className="h-4 w-4" />,
  Space: <Space className="h-4 w-4" />,
  Minus: <Minus className="h-4 w-4" />,
};

interface Props {
  onAddBlock: (block: ReportBlock) => void;
}

export default function ReportBlockPalette({ onAddBlock }: Props) {
  const blockTypes = Object.entries(BLOCK_TYPE_META) as [BlockType, typeof BLOCK_TYPE_META[BlockType]][];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Add Block</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {blockTypes.map(([type, meta]) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            className="h-auto flex-col items-start gap-0.5 px-3 py-2 text-left"
            onClick={() => onAddBlock(createDefaultBlock(type))}
          >
            <span className="flex items-center gap-1.5 text-xs font-medium">
              {ICON_MAP[meta.icon]}
              {meta.label}
            </span>
            <span className="text-[10px] text-muted-foreground font-normal leading-tight">
              {meta.description}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

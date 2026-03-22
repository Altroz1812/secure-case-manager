import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { parseCSV, useBulkUpload, type ParsedRow } from '@/hooks/useBulkUpload';

export default function BulkUploadPage() {
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const { validatedRows, validateRows, uploadMutation, setValidatedRows } = useBulkUpload();
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{ processed: number; failed: number; total: number } | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsValidating(true);

    const text = await file.text();
    const rows = parseCSV(text);
    await validateRows(rows);
    setIsValidating(false);
    setStep('preview');
  }, [validateRows]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) return;
    setFileName(file.name);
    setIsValidating(true);

    const text = await file.text();
    const rows = parseCSV(text);
    await validateRows(rows);
    setIsValidating(false);
    setStep('preview');
  }, [validateRows]);

  const handleUpload = () => {
    uploadMutation.mutate(
      { rows: validatedRows, fileName },
      {
        onSuccess: (res) => {
          setResult(res);
          setStep('result');
        },
      }
    );
  };

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setValidatedRows([]);
    setResult(null);
  };

  const validCount = validatedRows.filter(r => r.errors.length === 0).length;
  const errorCount = validatedRows.filter(r => r.errors.length > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6" /> Bulk Case Upload
        </h1>
        <p className="text-muted-foreground">Upload CSV files to create multiple cases at once</p>
      </div>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file with columns: Client Name, Branch, Product, Category, Verification, Applicant Name, Co Applicant Name, Applicant Address, Mobile, FE Code, Geo Limit, Priority, Pin Code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              {isValidating ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Validating CSV...</p>
                </div>
              ) : (
                <>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                </>
              )}
              <Input
                id="csv-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">{fileName}</Badge>
              <Badge className="bg-emerald-100 text-emerald-700">{validCount} valid</Badge>
              {errorCount > 0 && <Badge className="bg-rose-100 text-rose-700">{errorCount} errors</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>Cancel</Button>
              <Button onClick={handleUpload} disabled={validCount === 0 || uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Import {validCount} Cases</>
                )}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Co-Applicant</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Pin Code</TableHead>
                      <TableHead>FE Code</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedRows.map((row, idx) => (
                      <TableRow key={idx} className={row.errors.length > 0 ? 'bg-rose-50' : ''}>
                        <TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
                        <TableCell>
                          {row.errors.length === 0 ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.clientName}</TableCell>
                        <TableCell>{row.branch}</TableCell>
                        <TableCell>{row.applicantName}</TableCell>
                        <TableCell>{row.coApplicantName || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{row.verification}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{row.priority || 'Normal'}</Badge></TableCell>
                        <TableCell>{row.pinCode}</TableCell>
                        <TableCell>{row.feCode || '-'}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <span className="text-xs text-rose-600">{row.errors.join(', ')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 'result' && result && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-emerald-600" />
            <h2 className="text-xl font-bold">Upload Complete</h2>
            <div className="flex justify-center gap-6">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{result.processed}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              {result.failed > 0 && (
                <div>
                  <p className="text-3xl font-bold text-rose-600">{result.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              )}
              <div>
                <p className="text-3xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            <Button onClick={handleReset} className="mt-4">Upload Another File</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

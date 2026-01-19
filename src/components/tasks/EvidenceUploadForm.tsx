import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  MapPin, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Navigation
} from 'lucide-react';
import { useUploadEvidence } from '@/hooks/useTaskEvidence';
import { toast } from 'sonner';

interface EvidenceUploadFormProps {
  taskId: string;
  expectedLatitude?: number;
  expectedLongitude?: number;
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export function EvidenceUploadForm({
  taskId,
  expectedLatitude,
  expectedLongitude,
  onUploadComplete,
  disabled = false,
}: EvidenceUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadEvidence = useUploadEvidence();

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGettingLocation(false);
        toast.success('Location captured successfully');
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);

      // Auto-capture location when file is selected
      if (!latitude || !longitude) {
        getCurrentLocation();
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!latitude || !longitude) {
      toast.error('GPS coordinates are required. Please capture your location.');
      return;
    }

    await uploadEvidence.mutateAsync({
      taskId,
      file,
      latitude,
      longitude,
      remarks: remarks || undefined,
      expectedLatitude,
      expectedLongitude,
    });

    // Reset form
    setFile(null);
    setPreview(null);
    setRemarks('');
    setLatitude(null);
    setLongitude(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onUploadComplete?.();
  };

  const hasLocation = latitude !== null && longitude !== null;
  const geoDeviation = hasLocation && expectedLatitude && expectedLongitude
    ? calculateDeviation(latitude, longitude, expectedLatitude, expectedLongitude)
    : null;
  const isDeviationExceeded = geoDeviation !== null && geoDeviation > 500;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Field Evidence
        </CardTitle>
        <CardDescription>
          Upload photos with GPS coordinates using GPS Map Camera app for best results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="evidence-file">Photo Evidence</Label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {preview ? (
              <div className="space-y-2">
                <img
                  src={preview}
                  alt="Evidence preview"
                  className="max-h-48 mx-auto rounded-md object-contain"
                />
                <p className="text-sm text-muted-foreground">{file?.name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div
                className="cursor-pointer py-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max file size: 10MB
                </p>
              </div>
            )}
          </div>
          <Input
            ref={fileInputRef}
            id="evidence-file"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>

        {/* GPS Coordinates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>GPS Coordinates</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={gettingLocation || disabled}
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Capture Location
                </>
              )}
            </Button>
          </div>

          {locationError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {locationError}
            </div>
          )}

          {hasLocation && (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Location Captured</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Latitude:</span>{' '}
                  <span className="font-mono">{latitude?.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Longitude:</span>{' '}
                  <span className="font-mono">{longitude?.toFixed(6)}</span>
                </div>
              </div>

              {geoDeviation !== null && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Distance from expected location:
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        isDeviationExceeded
                          ? 'border-destructive text-destructive'
                          : 'border-green-600 text-green-600'
                      }
                    >
                      {Math.round(geoDeviation)}m
                    </Badge>
                    {isDeviationExceeded && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  {isDeviationExceeded && (
                    <p className="text-xs text-destructive mt-1">
                      Warning: Location deviation exceeds 500m limit
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!hasLocation && !locationError && (
            <p className="text-sm text-muted-foreground">
              GPS coordinates are required for field evidence validation
            </p>
          )}
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks (Optional)</Label>
          <Textarea
            id="remarks"
            placeholder="Add any observations or notes about this evidence..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={disabled || !file || !hasLocation || uploadEvidence.isPending}
          className="w-full"
        >
          {uploadEvidence.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence
            </>
          )}
        </Button>

        {/* Warning for deviation */}
        {isDeviationExceeded && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Geo-deviation Flagged</p>
              <p className="text-muted-foreground">
                This evidence will be flagged for QC review due to significant location
                deviation from the expected address.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to calculate deviation
function calculateDeviation(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

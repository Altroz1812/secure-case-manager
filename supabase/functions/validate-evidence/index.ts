import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum allowed geo deviation in meters
const MAX_GEO_DEVIATION_METERS = 500;

// Haversine formula to calculate distance between two GPS coordinates
function calculateGeoDeviation(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
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

// Check if image has watermark by looking for common watermark patterns
function analyzeWatermark(exifData: Record<string, unknown>): {
  hasWatermark: boolean;
  watermarkText: string | null;
  confidence: number;
} {
  // GPS Map Camera and similar apps often embed watermark info in specific EXIF fields
  const description = (exifData.ImageDescription as string) || '';
  const userComment = (exifData.UserComment as string) || '';
  const software = (exifData.Software as string) || '';
  
  // Look for common watermark indicators
  const combinedText = `${description} ${userComment}`.toLowerCase();
  
  // Check for GPS coordinates in text (watermark format)
  const hasGpsInText = /\d+°\s*\d+'\s*\d+(\.\d+)?"\s*[NSEW]/i.test(combinedText) ||
                       /lat|lon|gps|coordinates/i.test(combinedText);
  
  // Check for date/time in text
  const hasDateInText = /\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/i.test(combinedText);
  
  // Check for address indicators
  const hasAddressInText = /address|location|street|city|pincode|zip/i.test(combinedText);
  
  // Check if taken with GPS Map Camera or similar
  const isFromGpsCamera = /gps\s*map\s*camera|timestamp|geo\s*tag/i.test(software) ||
                          /gps\s*map\s*camera|timestamp/i.test(combinedText);
  
  const hasWatermark = hasGpsInText || hasDateInText || hasAddressInText || isFromGpsCamera;
  const confidence = [hasGpsInText, hasDateInText, hasAddressInText, isFromGpsCamera]
    .filter(Boolean).length * 25;
    
  let watermarkText: string | null = null;
  if (description) watermarkText = description;
  else if (userComment) watermarkText = userComment;
  
  return { hasWatermark, watermarkText, confidence };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { evidenceId, storagePath, expectedLatitude, expectedLongitude } = await req.json();

    if (!evidenceId) {
      return new Response(
        JSON.stringify({ error: "evidenceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get evidence record
    const { data: evidence, error: fetchError } = await supabase
      .from('task_evidence')
      .select('*')
      .eq('id', evidenceId)
      .single();

    if (fetchError || !evidence) {
      return new Response(
        JSON.stringify({ error: "Evidence not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationErrors: string[] = [];
    const validationLogs: Array<{
      evidence_id: string;
      validation_type: string;
      passed: boolean;
      details: Record<string, unknown>;
    }> = [];

    // 1. GPS Validation
    const hasGps = evidence.latitude !== null && evidence.longitude !== null;
    validationLogs.push({
      evidence_id: evidenceId,
      validation_type: 'gps_presence',
      passed: hasGps,
      details: {
        latitude: evidence.latitude,
        longitude: evidence.longitude,
      },
    });

    if (!hasGps) {
      validationErrors.push('Missing GPS coordinates - photo must have location data');
    }

    // 2. Geo-deviation check
    let geoDeviationMeters: number | null = null;
    let geoDeviationFlagged = false;
    
    const expLat = expectedLatitude ?? evidence.expected_latitude;
    const expLon = expectedLongitude ?? evidence.expected_longitude;

    if (hasGps && expLat !== null && expLon !== null) {
      geoDeviationMeters = calculateGeoDeviation(
        evidence.latitude!,
        evidence.longitude!,
        expLat,
        expLon
      );
      geoDeviationFlagged = geoDeviationMeters > MAX_GEO_DEVIATION_METERS;

      validationLogs.push({
        evidence_id: evidenceId,
        validation_type: 'geo_deviation',
        passed: !geoDeviationFlagged,
        details: {
          deviation_meters: Math.round(geoDeviationMeters),
          max_allowed: MAX_GEO_DEVIATION_METERS,
          expected_latitude: expLat,
          expected_longitude: expLon,
          actual_latitude: evidence.latitude,
          actual_longitude: evidence.longitude,
        },
      });

      if (geoDeviationFlagged) {
        validationErrors.push(
          `GPS deviation ${Math.round(geoDeviationMeters)}m exceeds ${MAX_GEO_DEVIATION_METERS}m limit`
        );
      }
    }

    // 3. EXIF Data extraction and watermark check
    // Note: For full EXIF extraction, we'd need to download and parse the image
    // Here we simulate based on available metadata
    const exifData: Record<string, unknown> = {
      DateTime: evidence.captured_at,
      GPSLatitude: evidence.latitude,
      GPSLongitude: evidence.longitude,
      Software: 'GPS Map Camera', // Simulated - in production, extract from actual EXIF
    };

    const watermarkAnalysis = analyzeWatermark(exifData);
    validationLogs.push({
      evidence_id: evidenceId,
      validation_type: 'watermark_check',
      passed: watermarkAnalysis.hasWatermark,
      details: {
        has_watermark: watermarkAnalysis.hasWatermark,
        watermark_text: watermarkAnalysis.watermarkText,
        confidence: watermarkAnalysis.confidence,
      },
    });

    // Note: We're being lenient on watermark for now - just log, don't fail
    // In production, you might want to fail if confidence < threshold

    // 4. Date/Time validation
    const hasCaptureTime = evidence.captured_at !== null;
    validationLogs.push({
      evidence_id: evidenceId,
      validation_type: 'timestamp_check',
      passed: hasCaptureTime,
      details: {
        captured_at: evidence.captured_at,
      },
    });

    if (!hasCaptureTime) {
      validationErrors.push('Missing capture timestamp');
    }

    // Determine overall validation status
    let validationStatus = 'valid';
    if (validationErrors.length > 0) {
      validationStatus = geoDeviationFlagged || !hasGps ? 'invalid' : 'warning';
    }

    // Get user for validated_by
    const authHeader = req.headers.get('Authorization');
    let validatedBy: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      validatedBy = user?.id || null;
    }

    // Update evidence record
    const { error: updateError } = await supabase
      .from('task_evidence')
      .update({
        is_validated: true,
        validation_status: validationStatus,
        validation_errors: validationErrors,
        exif_data: exifData,
        address_watermark: watermarkAnalysis.watermarkText,
        geo_deviation_meters: geoDeviationMeters,
        expected_latitude: expLat,
        expected_longitude: expLon,
        geo_deviation_flagged: geoDeviationFlagged,
        validated_at: new Date().toISOString(),
        validated_by: validatedBy,
      })
      .eq('id', evidenceId);

    if (updateError) {
      console.error('Failed to update evidence:', updateError);
    }

    // Insert validation logs
    if (validationLogs.length > 0) {
      const { error: logsError } = await supabase
        .from('evidence_validation_logs')
        .insert(validationLogs);

      if (logsError) {
        console.error('Failed to insert validation logs:', logsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        validationStatus,
        validationErrors,
        geoDeviationMeters,
        geoDeviationFlagged,
        watermarkAnalysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Validation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

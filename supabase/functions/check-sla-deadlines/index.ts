import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting SLA deadline check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Find tasks that have passed their SLA deadline and are not yet marked as overdue
    // Only check tasks that are in active states (not completed, approved, or rejected)
    const { data: overdueTasks, error: fetchError } = await supabase
      .from("tasks")
      .select("id, task_number, sla_deadline, status, assigned_to")
      .lt("sla_deadline", now)
      .in("status", ["pending", "assigned", "in_progress", "qc_review"])
      .or("is_overdue.is.null,is_overdue.eq.false");

    if (fetchError) {
      console.error("Error fetching tasks:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${overdueTasks?.length || 0} tasks that are now overdue`);

    if (!overdueTasks || overdueTasks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No overdue tasks found",
          tasksUpdated: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update all overdue tasks
    const taskIds = overdueTasks.map((t) => t.id);
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ is_overdue: true })
      .in("id", taskIds);

    if (updateError) {
      console.error("Error updating tasks:", updateError);
      throw updateError;
    }

    console.log(`Successfully marked ${taskIds.length} tasks as overdue`);

    // Log details of overdue tasks
    overdueTasks.forEach((task) => {
      console.log(
        `Task ${task.task_number} (ID: ${task.id}) marked as overdue. ` +
        `SLA deadline was: ${task.sla_deadline}, Status: ${task.status}`
      );
    });

    // Find tasks approaching SLA deadline (within next 2 hours) for warning notifications
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { data: approachingTasks, error: approachingError } = await supabase
      .from("tasks")
      .select("id, task_number, sla_deadline, status, assigned_to")
      .gt("sla_deadline", now)
      .lt("sla_deadline", twoHoursFromNow)
      .in("status", ["pending", "assigned", "in_progress"])
      .or("is_overdue.is.null,is_overdue.eq.false");

    if (approachingError) {
      console.error("Error fetching approaching tasks:", approachingError);
    } else {
      console.log(`Found ${approachingTasks?.length || 0} tasks approaching SLA deadline`);
      
      approachingTasks?.forEach((task) => {
        console.log(
          `Task ${task.task_number} approaching deadline. ` +
          `SLA deadline: ${task.sla_deadline}, Status: ${task.status}`
        );
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Marked ${taskIds.length} tasks as overdue`,
        tasksUpdated: taskIds.length,
        tasksApproachingDeadline: approachingTasks?.length || 0,
        overdueTaskNumbers: overdueTasks.map((t) => t.task_number),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-sla-deadlines function:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

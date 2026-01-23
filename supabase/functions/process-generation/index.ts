/**
 * Edge Function: Process Generation Jobs
 *
 * Reads messages from the pgmq generation_jobs queue and processes them.
 * Each job generates AI outputs for all scenarios in a project.
 *
 * This function:
 * 1. Reads a batch of messages from the queue
 * 2. For each job, fetches scenarios and generates outputs
 * 3. Updates job progress in real-time
 * 4. Increments usage quota after successful generation
 * 5. Deletes processed messages from the queue
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Types
interface GenerationJob {
  job_id: string;
  project_id: number;
  workbench_id: string;
}

interface JobStatus {
  id: string;
  project_id: number;
  workbench_id: string;
  status: string;
  total_scenarios: number;
  completed_scenarios: number;
  failed_scenarios: number;
  output_ids: number[];
  errors: Array<{ scenario_id: number; error: string }>;
  model_config: ModelConfig;
  api_keys_snapshot: UserApiKeys | null;
}

interface ModelConfig {
  model: string;
  system_prompt?: string;
  variables?: Record<string, string>;
}

interface UserApiKeys {
  openai?: string;
  anthropic?: string;
}

interface Scenario {
  id: number;
  input_text: string;
  order: number;
}

interface QueueMessage {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: GenerationJob;
}

// Model tier mapping for quota tracking
const MODEL_TIERS: Record<string, string> = {
  // Free tier models
  "gpt-5-nano": "free",

  // Standard tier models
  "gpt-4o-mini": "standard",
  "gpt-4o": "standard",
  "gpt-4.1-mini": "standard",
  "gpt-4.1": "standard",
  "gpt-4.5-preview": "standard",
  "claude-3-5-haiku-latest": "standard",
  "claude-3-5-sonnet-latest": "standard",

  // Premium tier models
  "gpt-5": "premium",
  "claude-opus-4": "premium",
  "claude-sonnet-4": "premium",
};

function getModelTier(modelName: string): string {
  return MODEL_TIERS[modelName] || "standard";
}

/**
 * Interpolates variables into a prompt using {{variable_name}} syntax
 */
function interpolateVariables(
  prompt: string,
  variables?: Record<string, string>,
): string {
  if (!variables || Object.keys(variables).length === 0) {
    return prompt;
  }

  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }, prompt);
}

/**
 * Generate completion using OpenAI
 */
async function generateOpenAI(
  client: OpenAI,
  model: string,
  systemPrompt: string | undefined,
  userMessage: string,
): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userMessage });

  const completion = await client.chat.completions.create({
    model,
    messages,
  });

  return {
    text: completion.choices[0]?.message?.content || "",
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
  };
}

/**
 * Generate completion using Anthropic
 */
async function generateAnthropic(
  client: Anthropic,
  model: string,
  systemPrompt: string | undefined,
  userMessage: string,
): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return {
    text: message.content[0]?.type === "text" ? message.content[0].text : "",
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

/**
 * Process a single generation job
 */
async function processJob(
  supabase: ReturnType<typeof createClient>,
  job: JobStatus,
  openaiApiKey: string | undefined,
  anthropicApiKey: string | undefined,
): Promise<void> {
  const { id: jobId, project_id, workbench_id, model_config } = job;

  console.log(`Processing job ${jobId} for project ${project_id}`);

  // Mark job as processing
  await supabase.rpc("update_generation_job_progress", {
    p_job_id: jobId,
    p_status: "processing",
    p_started_at: new Date().toISOString(),
  });

  // Fetch scenarios for the project
  const { data: scenarios, error: scenariosError } = await supabase
    .from("scenarios")
    .select("id, input_text, order")
    .eq("project_id", project_id)
    .order("order", { ascending: true });

  if (scenariosError || !scenarios || scenarios.length === 0) {
    console.error(
      `No scenarios found for project ${project_id}:`,
      scenariosError,
    );
    await supabase.rpc("update_generation_job_progress", {
      p_job_id: jobId,
      p_status: "failed",
      p_errors: JSON.stringify([
        { scenario_id: 0, error: "No scenarios found" },
      ]),
      p_completed_at: new Date().toISOString(),
    });
    return;
  }

  // Determine provider and create client
  const modelName = model_config.model || "gpt-5-nano";
  const isClaudeModel = modelName.includes("claude");
  const provider = isClaudeModel ? "anthropic" : "openai";

  // Use user keys if available (Enterprise BYOK), otherwise system keys
  const effectiveApiKey = isClaudeModel
    ? job.api_keys_snapshot?.anthropic || anthropicApiKey
    : job.api_keys_snapshot?.openai || openaiApiKey;

  if (!effectiveApiKey) {
    console.error(`No API key available for ${provider}`);
    await supabase.rpc("update_generation_job_progress", {
      p_job_id: jobId,
      p_status: "failed",
      p_errors: JSON.stringify([
        { scenario_id: 0, error: `No ${provider} API key configured` },
      ]),
      p_completed_at: new Date().toISOString(),
    });
    return;
  }

  // Create appropriate client
  const openaiClient =
    provider === "openai" ? new OpenAI({ apiKey: effectiveApiKey }) : null;
  const anthropicClient =
    provider === "anthropic"
      ? new Anthropic({ apiKey: effectiveApiKey })
      : null;

  // Process scenarios
  const outputIds: number[] = [];
  const errors: Array<{ scenario_id: number; error: string }> = [];
  let completedCount = 0;
  let failedCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Interpolate system prompt once
  const interpolatedSystemPrompt = model_config.system_prompt
    ? interpolateVariables(model_config.system_prompt, model_config.variables)
    : undefined;

  for (const scenario of scenarios as Scenario[]) {
    try {
      // Interpolate user message
      const interpolatedUserMessage = interpolateVariables(
        scenario.input_text,
        model_config.variables,
      );

      // Generate completion
      let result: { text: string; inputTokens?: number; outputTokens?: number };

      if (openaiClient) {
        result = await generateOpenAI(
          openaiClient,
          modelName,
          interpolatedSystemPrompt,
          interpolatedUserMessage,
        );
      } else if (anthropicClient) {
        result = await generateAnthropic(
          anthropicClient,
          modelName,
          interpolatedSystemPrompt,
          interpolatedUserMessage,
        );
      } else {
        throw new Error("No AI client available");
      }

      // Track tokens
      if (result.inputTokens) totalInputTokens += result.inputTokens;
      if (result.outputTokens) totalOutputTokens += result.outputTokens;

      // Save output to database
      const { data: output, error: outputError } = await supabase
        .from("outputs")
        .insert({
          scenario_id: scenario.id,
          output_text: result.text,
          model_snapshot: {
            model: modelName,
            system_prompt: model_config.system_prompt,
            variables: model_config.variables,
            input_tokens: result.inputTokens,
            output_tokens: result.outputTokens,
          },
        })
        .select("id")
        .single();

      if (outputError) {
        throw new Error(`Failed to save output: ${outputError.message}`);
      }

      outputIds.push(output.id);
      completedCount++;

      // Update progress
      await supabase.rpc("update_generation_job_progress", {
        p_job_id: jobId,
        p_status: "processing",
        p_completed_scenarios: completedCount,
        p_failed_scenarios: failedCount,
        p_output_ids: outputIds,
      });

      console.log(
        `Completed scenario ${scenario.id} (${completedCount}/${scenarios.length})`,
      );
    } catch (error) {
      console.error(`Error processing scenario ${scenario.id}:`, error);
      errors.push({
        scenario_id: scenario.id,
        error: error instanceof Error ? error.message : "Generation failed",
      });
      failedCount++;

      // Update progress with error
      await supabase.rpc("update_generation_job_progress", {
        p_job_id: jobId,
        p_status: "processing",
        p_completed_scenarios: completedCount,
        p_failed_scenarios: failedCount,
        p_errors: JSON.stringify(errors),
      });
    }
  }

  // Increment usage quota for successful generations
  if (completedCount > 0) {
    const modelTier = getModelTier(modelName);
    await supabase.rpc("increment_usage", {
      workbench_uuid: workbench_id,
      model_tier: modelTier,
      model_name: modelName,
      count: completedCount,
      input_tokens: totalInputTokens || null,
      output_tokens: totalOutputTokens || null,
      project_id: project_id,
    });
  }

  // Determine final status
  let finalStatus: string;
  if (failedCount === 0) {
    finalStatus = "completed";
  } else if (completedCount === 0) {
    finalStatus = "failed";
  } else {
    finalStatus = "partial";
  }

  // Mark job as complete
  await supabase.rpc("update_generation_job_progress", {
    p_job_id: jobId,
    p_status: finalStatus,
    p_completed_scenarios: completedCount,
    p_failed_scenarios: failedCount,
    p_output_ids: outputIds,
    p_errors: JSON.stringify(errors),
    p_completed_at: new Date().toISOString(),
  });

  console.log(`Job ${jobId} finished with status: ${finalStatus}`);
}

/**
 * Main handler - processes messages from the queue
 */
Deno.serve(async (req) => {
  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read messages from the queue (batch of 1 for now)
    // Using visibility timeout of 300 seconds (5 minutes) for long-running jobs
    const { data: messages, error: queueError } = await supabase.rpc(
      "pgmq_read",
      {
        queue_name: "generation_jobs",
        vt: 300, // 5 minute visibility timeout
        qty: 1, // Process one job at a time
      },
    );

    if (queueError) {
      console.error("Error reading from queue:", queueError);
      return new Response(
        JSON.stringify({ error: "Failed to read from queue" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No messages in queue" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Process each message
    const results: Array<{ jobId: string; status: string }> = [];

    for (const msg of messages as QueueMessage[]) {
      const jobMessage = msg.message;

      try {
        // Fetch job status details
        const { data: jobStatus, error: jobError } = await supabase
          .from("generation_job_status")
          .select("*")
          .eq("id", jobMessage.job_id)
          .single();

        if (jobError || !jobStatus) {
          console.error(`Job ${jobMessage.job_id} not found:`, jobError);
          // Delete the orphaned message
          await supabase.rpc("pgmq_delete", {
            queue_name: "generation_jobs",
            msg_id: msg.msg_id,
          });
          results.push({ jobId: jobMessage.job_id, status: "not_found" });
          continue;
        }

        // Skip if job is already processed
        if (["completed", "failed", "partial"].includes(jobStatus.status)) {
          console.log(
            `Job ${jobMessage.job_id} already processed, deleting message`,
          );
          await supabase.rpc("pgmq_delete", {
            queue_name: "generation_jobs",
            msg_id: msg.msg_id,
          });
          results.push({
            jobId: jobMessage.job_id,
            status: "already_processed",
          });
          continue;
        }

        // Process the job
        await processJob(
          supabase,
          jobStatus as JobStatus,
          openaiApiKey,
          anthropicApiKey,
        );

        // Delete the message after successful processing
        await supabase.rpc("pgmq_delete", {
          queue_name: "generation_jobs",
          msg_id: msg.msg_id,
        });

        results.push({ jobId: jobMessage.job_id, status: "processed" });
      } catch (error) {
        console.error(`Error processing job ${jobMessage.job_id}:`, error);

        // Update job status to failed
        await supabase.rpc("update_generation_job_progress", {
          p_job_id: jobMessage.job_id,
          p_status: "failed",
          p_errors: JSON.stringify([
            {
              scenario_id: 0,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          ]),
          p_completed_at: new Date().toISOString(),
        });

        // Delete the message to prevent infinite retries
        await supabase.rpc("pgmq_delete", {
          queue_name: "generation_jobs",
          msg_id: msg.msg_id,
        });

        results.push({ jobId: jobMessage.job_id, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

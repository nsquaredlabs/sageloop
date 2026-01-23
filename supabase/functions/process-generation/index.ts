/**
 * Edge Function: Process Generation Queue
 *
 * Processes ONE scenario per invocation from the queue.
 * Each queue message = one scenario to generate.
 *
 * Flow:
 * 1. Read one message from queue
 * 2. Fetch scenario and job config
 * 3. Generate AI output
 * 4. Save output and update job progress
 * 5. Delete message from queue
 * 6. Return
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Types
interface QueueMessage {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: {
    job_id: string;
    scenario_id: number;
    project_id: number;
    workbench_id: string;
  };
}

interface JobStatus {
  id: string;
  project_id: number;
  workbench_id: string;
  status: string;
  total_scenarios: number;
  completed_scenarios: number;
  failed_scenarios: number;
  model_config: {
    model: string;
    system_prompt?: string;
    variables?: Record<string, string>;
  };
  api_keys_snapshot: {
    openai?: string;
    anthropic?: string;
  } | null;
}

interface Scenario {
  id: number;
  input_text: string;
}

// Model tier mapping for quota tracking
const MODEL_TIERS: Record<string, string> = {
  "gpt-5-nano": "free",
  "gpt-4o-mini": "standard",
  "gpt-4o": "standard",
  "gpt-4.1-mini": "standard",
  "gpt-4.1": "standard",
  "gpt-4.5-preview": "standard",
  "claude-3-5-haiku-latest": "standard",
  "claude-3-5-sonnet-latest": "standard",
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
  apiKey: string,
  model: string,
  systemPrompt: string | undefined,
  userMessage: string,
): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
  const client = new OpenAI({ apiKey });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userMessage });

  const completion = await client.chat.completions.create({ model, messages });

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
  apiKey: string,
  model: string,
  systemPrompt: string | undefined,
  userMessage: string,
): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
  const client = new Anthropic({ apiKey });

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
 * Main handler - processes ONE scenario from the queue
 */
Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read ONE message from the queue
  const { data: messages, error: queueError } = await supabase.rpc(
    "pgmq_read",
    { p_queue_name: "generation_jobs", p_vt: 60, p_qty: 1 },
  );

  if (queueError) {
    console.error("Error reading from queue:", queueError);
    return new Response(
      JSON.stringify({ error: "Failed to read from queue" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!messages || messages.length === 0) {
    return new Response(
      JSON.stringify({ processed: false, message: "No messages in queue" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const msg = messages[0] as QueueMessage;
  const { job_id, scenario_id, project_id, workbench_id } = msg.message;

  console.log(`Processing scenario ${scenario_id} for job ${job_id}`);

  try {
    // Fetch job status (for config)
    const { data: job, error: jobError } = await supabase
      .from("generation_job_status")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      console.error(`Job ${job_id} not found`);
      await supabase.rpc("pgmq_delete", {
        p_queue_name: "generation_jobs",
        p_msg_id: msg.msg_id,
      });
      return new Response(JSON.stringify({ error: "Job not found", job_id }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const typedJob = job as JobStatus;

    // Skip if job is already complete
    if (["completed", "failed"].includes(typedJob.status)) {
      console.log(`Job ${job_id} already ${typedJob.status}, skipping`);
      await supabase.rpc("pgmq_delete", {
        p_queue_name: "generation_jobs",
        p_msg_id: msg.msg_id,
      });
      return new Response(
        JSON.stringify({ processed: false, reason: "job_already_complete" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch the scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id, input_text")
      .eq("id", scenario_id)
      .single();

    if (scenarioError || !scenario) {
      console.error(`Scenario ${scenario_id} not found`);
      const isFirst =
        typedJob.completed_scenarios === 0 && typedJob.failed_scenarios === 0;
      await supabase.rpc("record_scenario_failure", {
        p_job_id: job_id,
        p_scenario_id: scenario_id,
        p_error: "Scenario not found",
        p_is_first: isFirst,
      });
      await supabase.rpc("pgmq_delete", {
        p_queue_name: "generation_jobs",
        p_msg_id: msg.msg_id,
      });
      return new Response(
        JSON.stringify({ error: "Scenario not found", scenario_id }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Determine provider and API key
    const modelConfig = typedJob.model_config;
    const modelName = modelConfig.model || "gpt-5-nano";
    const isClaudeModel = modelName.includes("claude");
    const provider = isClaudeModel ? "anthropic" : "openai";

    const effectiveApiKey = isClaudeModel
      ? typedJob.api_keys_snapshot?.anthropic || anthropicApiKey
      : typedJob.api_keys_snapshot?.openai || openaiApiKey;

    if (!effectiveApiKey) {
      console.error(`No API key for ${provider}`);
      const isFirst =
        typedJob.completed_scenarios === 0 && typedJob.failed_scenarios === 0;
      await supabase.rpc("record_scenario_failure", {
        p_job_id: job_id,
        p_scenario_id: scenario_id,
        p_error: `No ${provider} API key configured`,
        p_is_first: isFirst,
      });
      await supabase.rpc("pgmq_delete", {
        p_queue_name: "generation_jobs",
        p_msg_id: msg.msg_id,
      });
      return new Response(JSON.stringify({ error: `No ${provider} API key` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Interpolate prompts
    const systemPrompt = modelConfig.system_prompt
      ? interpolateVariables(modelConfig.system_prompt, modelConfig.variables)
      : undefined;
    const userMessage = interpolateVariables(
      (scenario as Scenario).input_text,
      modelConfig.variables,
    );

    // Generate the output
    let result: { text: string; inputTokens?: number; outputTokens?: number };

    if (isClaudeModel) {
      result = await generateAnthropic(
        effectiveApiKey,
        modelName,
        systemPrompt,
        userMessage,
      );
    } else {
      result = await generateOpenAI(
        effectiveApiKey,
        modelName,
        systemPrompt,
        userMessage,
      );
    }

    // Save the output
    const { data: output, error: outputError } = await supabase
      .from("outputs")
      .insert({
        scenario_id: scenario_id,
        output_text: result.text,
        model_snapshot: {
          model: modelName,
          system_prompt: modelConfig.system_prompt,
          variables: modelConfig.variables,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
        },
      })
      .select("id")
      .single();

    if (outputError || !output) {
      console.error(`Failed to save output:`, outputError);
      const isFirst =
        typedJob.completed_scenarios === 0 && typedJob.failed_scenarios === 0;
      await supabase.rpc("record_scenario_failure", {
        p_job_id: job_id,
        p_scenario_id: scenario_id,
        p_error: `Failed to save output: ${outputError?.message || "unknown"}`,
        p_is_first: isFirst,
      });
      await supabase.rpc("pgmq_delete", {
        p_queue_name: "generation_jobs",
        p_msg_id: msg.msg_id,
      });
      return new Response(JSON.stringify({ error: "Failed to save output" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Record completion (atomically updates job progress)
    const isFirst =
      typedJob.completed_scenarios === 0 && typedJob.failed_scenarios === 0;
    await supabase.rpc("record_scenario_completion", {
      p_job_id: job_id,
      p_output_id: output.id,
      p_is_first: isFirst,
    });

    // Increment usage quota
    const modelTier = getModelTier(modelName);
    await supabase.rpc("increment_usage", {
      workbench_uuid: workbench_id,
      model_tier: modelTier,
      model_name: modelName,
      count: 1,
      input_tokens: result.inputTokens || null,
      output_tokens: result.outputTokens || null,
      project_id: project_id,
    });

    // Delete the message
    await supabase.rpc("pgmq_delete", {
      p_queue_name: "generation_jobs",
      p_msg_id: msg.msg_id,
    });

    console.log(`Completed scenario ${scenario_id}, output ${output.id}`);

    return new Response(
      JSON.stringify({
        processed: true,
        job_id,
        scenario_id,
        output_id: output.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`Error processing scenario ${scenario_id}:`, error);

    // Record failure
    await supabase.rpc("record_scenario_failure", {
      p_job_id: job_id,
      p_scenario_id: scenario_id,
      p_error: error instanceof Error ? error.message : "Unknown error",
      p_is_first: false,
    });

    // Delete message to prevent infinite retries
    await supabase.rpc("pgmq_delete", {
      p_queue_name: "generation_jobs",
      p_msg_id: msg.msg_id,
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        job_id,
        scenario_id,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

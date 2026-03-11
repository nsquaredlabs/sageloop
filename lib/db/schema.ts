import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  model_config: text("model_config"), // JSON string
  created_at: text("created_at").default(sql`(current_timestamp)`),
  updated_at: text("updated_at").default(sql`(current_timestamp)`),
});

export const scenarios = sqliteTable("scenarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  input_text: text("input_text").notNull(),
  order: integer("order").notNull().default(0),
  created_at: text("created_at").default(sql`(current_timestamp)`),
});

export const outputs = sqliteTable("outputs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scenario_id: integer("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  output_text: text("output_text").notNull(),
  model_snapshot: text("model_snapshot"), // JSON string
  generated_at: text("generated_at").default(sql`(current_timestamp)`),
});

export const ratings = sqliteTable("ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  output_id: integer("output_id")
    .notNull()
    .references(() => outputs.id, { onDelete: "cascade" }),
  stars: integer("stars"),
  feedback_text: text("feedback_text"),
  tags: text("tags"), // JSON string
  metadata: text("metadata"), // JSON string
  created_at: text("created_at").default(sql`(current_timestamp)`),
});

export const extractions = sqliteTable("extractions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  criteria: text("criteria"), // JSON string
  dimensions: text("dimensions"), // JSON string
  confidence_score: real("confidence_score"),
  rated_output_count: integer("rated_output_count"),
  system_prompt_snapshot: text("system_prompt_snapshot"),
  created_at: text("created_at").default(sql`(current_timestamp)`),
});

export const metrics = sqliteTable("metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  extraction_id: integer("extraction_id").references(() => extractions.id),
  success_rate: real("success_rate"),
  criteria_breakdown: text("criteria_breakdown"), // JSON string
  snapshot_time: text("snapshot_time").default(sql`(current_timestamp)`),
});

export const prompt_versions = sqliteTable("prompt_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  version_number: integer("version_number").notNull(),
  system_prompt: text("system_prompt"),
  model_config: text("model_config"), // JSON string
  parent_version: integer("parent_version"),
  success_rate_before: real("success_rate_before"),
  success_rate_after: real("success_rate_after"),
  created_at: text("created_at").default(sql`(current_timestamp)`),
});

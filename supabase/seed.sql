-- Seed data for Tellah
-- Sample project with scenarios, outputs, ratings, and extractions for testing
-- Note: This seed data requires a test user to be created first via Supabase Studio or signup

-- Create test workbench (using a known UUID for consistency)
insert into workbenches (id, name)
values ('00000000-0000-0000-0000-000000000001'::uuid, 'Demo Workbench')
on conflict (id) do nothing;

-- Note: You need to create a test user and link them to the workbench manually:
-- 1. Sign up via the app at /auth/signup (auto-creates workbench)
-- OR
-- 2. Create user in Supabase Studio, then run:
--    insert into user_workbenches (user_id, workbench_id, role)
--    values ('<your-user-id>', '00000000-0000-0000-0000-000000000001', 'owner');

-- Insert sample project (requires workbench_id now)
insert into projects (name, description, model_config, workbench_id, created_by)
values (
  'Customer Support Assistant',
  'Evaluating tone and helpfulness of support responses',
  '{"model": "gpt-4", "temperature": 0.7, "system_prompt": "You are a helpful customer support assistant. Be concise, professional, and empathetic."}'::jsonb,
  '00000000-0000-0000-0000-000000000001'::uuid,
  null -- created_by can be null for seed data
)
on conflict do nothing;

-- Insert sample scenarios
insert into scenarios (project_id, input_text, "order")
values
  (1, 'My order hasn''t arrived yet and it''s been 2 weeks. What should I do?', 1),
  (1, 'How do I return a product that doesn''t fit?', 2),
  (1, 'Your app keeps crashing when I try to checkout. This is frustrating!', 3),
  (1, 'Can you help me track my shipment? Order #12345', 4),
  (1, 'I was charged twice for the same order. Please fix this immediately.', 5);

-- Insert first batch of outputs (5 outputs for all scenarios)
insert into outputs (scenario_id, output_text, model_snapshot, generated_at)
values
  (1, 'I sincerely apologize for the delay with your order. Two weeks is definitely longer than expected. Let me help you resolve this right away. Could you please provide your order number so I can track it and either expedite delivery or process a refund? I''ll make sure we get this sorted out for you today.', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '10 days'),
  (2, 'Our return process is simple: visit your account dashboard, select the order, and click "Return Item." Print the prepaid return label and drop it off at any shipping location. You''ll receive a refund within 5-7 business days after we receive the item. Need any help with these steps?', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '10 days'),
  (3, 'I understand how frustrating technical issues can be, especially when you''re trying to make a purchase. I''m sorry you''re experiencing this. Let''s troubleshoot: First, try clearing your browser cache or using a different browser. If that doesn''t work, I can process your order manually over the phone. What works best for you?', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '10 days'),
  (4, 'I''d be happy to help track your shipment! Looking up order #12345 now... Your package is currently in transit and scheduled for delivery on Thursday, March 14th. You can track it in real-time using this link: [tracking link]. Is there anything else I can help you with?', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '10 days'),
  (5, 'I completely understand your concern about being charged twice - that would worry me too. Let me investigate this right away. I see the duplicate charge on your account. I''ve already initiated a refund for the extra charge, which should appear in your account within 3-5 business days. I sincerely apologize for this error.', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '10 days');

-- Insert ratings for first batch (5 ratings - creating first extraction context)
insert into ratings (output_id, stars, feedback_text, tags, created_at)
values
  (1, 5, 'Perfect response - empathetic, offers clear next steps, takes ownership', '["appropriate_tone", "actionable"]'::jsonb, now() - interval '9 days'),
  (2, 4, 'Good detail but a bit long. Could be more concise.', '["too_long", "helpful"]'::jsonb, now() - interval '9 days'),
  (3, 5, 'Excellent - acknowledges frustration and offers multiple solutions', '["empathetic", "actionable", "appropriate_tone"]'::jsonb, now() - interval '9 days'),
  (4, 3, 'Provides tracking info but feels robotic. Needs more warmth.', '["lacks_empathy", "helpful"]'::jsonb, now() - interval '9 days'),
  (5, 5, 'Takes immediate action, apologizes, and gives timeline. Great!', '["empathetic", "actionable", "appropriate_tone"]'::jsonb, now() - interval '9 days');

-- First extraction (based on 5 ratings)
insert into extractions (project_id, criteria, confidence_score, rated_output_count, system_prompt_snapshot, created_at)
values (
  1,
  '{
    "summary": "High-quality support responses balance empathy with actionable solutions. The best responses acknowledge customer emotions, take ownership, and provide clear next steps with specific timelines.",
    "criteria": [
      {
        "dimension": "Tone",
        "pattern": "Empathetic yet professional communication style",
        "good_example": "Acknowledges customer frustration, uses phrases like \"I understand\" and \"I apologize\"",
        "bad_example": "Robotic or formulaic responses that lack emotional awareness",
        "importance": "high"
      },
      {
        "dimension": "Length",
        "pattern": "Concise responses that balance detail with brevity",
        "good_example": "3-4 sentences with clear structure and no unnecessary information",
        "bad_example": "Overly verbose explanations with too many steps or details",
        "importance": "medium"
      },
      {
        "dimension": "Content",
        "pattern": "Provides specific, actionable solutions with timelines",
        "good_example": "Offers concrete next steps with timeframes (e.g., \"refund within 3-5 days\")",
        "bad_example": "Vague promises or lack of specific actions",
        "importance": "high"
      }
    ],
    "key_insights": [
      "Top-rated responses (5 stars) consistently combine empathy with immediate action",
      "Responses that feel robotic or lack warmth receive lower ratings even when helpful",
      "Specific timelines and clear next steps are highly valued by customers"
    ],
    "recommendations": [
      "Always acknowledge the customer''s emotional state before diving into solutions",
      "Provide specific timelines for resolution rather than vague promises",
      "Aim for 3-4 sentence responses - enough detail without overwhelming"
    ]
  }'::jsonb,
  0.25,
  5,
  'You are a helpful customer support assistant. Be concise, professional, and empathetic.',
  now() - interval '8 days'
);

-- First metric snapshot
insert into metrics (project_id, extraction_id, success_rate, criteria_breakdown, snapshot_time)
values (
  1,
  1,
  0.60,
  '{"Tone": "high", "Length": "medium", "Content": "high"}'::jsonb,
  now() - interval '8 days'
);

-- Insert second batch of outputs (7 more outputs - scenarios repeated with improved prompt)
insert into outputs (scenario_id, output_text, model_snapshot, generated_at)
values
  (1, 'I understand waiting two weeks must be frustrating. Let me check your order status right away. Could you share your order number? I''ll either expedite delivery or process a full refund today.', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '3 days'),
  (2, 'Returns are easy! Go to your account, select the order, click "Return Item," and print the prepaid label. Drop it at any carrier location. Questions? I''m here to help!', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '3 days'),
  (3, 'Checkout crashes are incredibly frustrating - I apologize! Try clearing your cache or using a different browser. If that doesn''t work, I can process your order right now over the phone.', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '3 days'),
  (4, 'Happy to help! Order #12345 is on its way and will arrive Thursday, March 14th. Here''s your tracking link: [link]. Anything else I can do for you today?', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '3 days'),
  (5, 'I see the duplicate charge and completely understand your concern. I''ve processed the refund immediately - you''ll see it in 3-5 business days. My sincere apologies for this error.', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '3 days'),
  (1, 'Two weeks is way too long! I''m so sorry about this delay. Please provide your order number so I can investigate and get you either expedited shipping or a full refund processed today. You have my commitment we''ll resolve this.', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '3 days'),
  (3, 'I''m really sorry the app is crashing during checkout - that must be incredibly frustrating when you''re ready to buy! Can you try clearing your browser cache? If the issue persists, I''ll personally process your order over the phone right now.', '{"model": "gpt-4", "temperature": 0.7}'::jsonb, now() - interval '3 days');

-- Insert ratings for second batch (7 new ratings)
insert into ratings (output_id, stars, feedback_text, tags, created_at)
values
  (6, 5, 'Much better! Concise, empathetic, actionable. Perfect length.', '["appropriate_tone", "actionable", "concise"]'::jsonb, now() - interval '2 days'),
  (7, 5, 'Love the brevity and friendly tone. Clear steps without overwhelming.', '["appropriate_tone", "concise", "helpful"]'::jsonb, now() - interval '2 days'),
  (8, 5, 'Great balance of empathy and solutions. Just the right length.', '["empathetic", "actionable", "concise"]'::jsonb, now() - interval '2 days'),
  (9, 4, 'Good info and friendly tone, but could be slightly warmer.', '["helpful", "appropriate_tone"]'::jsonb, now() - interval '2 days'),
  (10, 5, 'Perfect - immediate action, apologetic, specific timeline.', '["empathetic", "actionable", "appropriate_tone"]'::jsonb, now() - interval '2 days'),
  (11, 3, 'A bit too enthusiastic/over-apologetic. Feels less professional.', '["wrong_tone", "actionable"]'::jsonb, now() - interval '2 days'),
  (12, 4, 'Good empathy and solutions, but slightly wordy. Almost perfect.', '["empathetic", "actionable", "too_long"]'::jsonb, now() - interval '2 days');

-- Second extraction (based on 7 new ratings only - incremental)
-- System prompt was updated to emphasize brevity after first extraction
insert into extractions (project_id, criteria, confidence_score, rated_output_count, system_prompt_snapshot, created_at)
values (
  1,
  '{
    "summary": "Analysis of 7 new rated responses shows significant improvement with the updated prompt. The sweet spot for support messages is 2-3 concise sentences that balance warmth with professionalism. Responses should acknowledge emotions without being overly apologetic, and provide immediate, specific actions.",
    "criteria": [
      {
        "dimension": "Tone",
        "pattern": "Warm and empathetic without being overly apologetic or effusive",
        "good_example": "\"I understand your frustration\" followed by action, avoiding excessive apologies like \"I''m so sorry\" repeatedly",
        "bad_example": "Either robotic/cold responses or overly enthusiastic/apologetic ones that feel unprofessional",
        "importance": "high"
      },
      {
        "dimension": "Length",
        "pattern": "2-3 sentences maximum - concise and scannable",
        "good_example": "Brief acknowledgment + specific action + offer to help further. Total under 40 words.",
        "bad_example": "Lengthy explanations over 4 sentences or very terse single-sentence responses",
        "importance": "high"
      },
      {
        "dimension": "Structure",
        "pattern": "Clear three-part structure: acknowledge, act, assist",
        "good_example": "Empathy statement → Concrete action taken → Offer additional help",
        "bad_example": "Jumping straight to solutions or ending without offering further assistance",
        "importance": "medium"
      },
      {
        "dimension": "Content",
        "pattern": "Immediate action with specific timelines and next steps",
        "good_example": "\"I''ve processed the refund - you''ll see it in 3-5 days\" rather than \"We''ll look into this\"",
        "bad_example": "Vague promises like \"We''ll investigate\" without specific actions or timelines",
        "importance": "high"
      }
    ],
    "key_insights": [
      "Length emerged as critical - responses rated 5 stars average 30-35 words vs 50+ for lower-rated ones",
      "There''s a \"Goldilocks zone\" for empathy - too little feels robotic, too much feels unprofessional",
      "The 3-part structure (acknowledge-act-assist) appears in 100% of 5-star responses",
      "Specific timelines (\"3-5 days\") are strongly preferred over vague promises (\"soon\")"
    ],
    "recommendations": [
      "Target 2-3 sentences and 30-35 words total for optimal response length",
      "Use one empathy statement at the start, then focus on action - avoid repeated apologies",
      "Always follow the acknowledge-act-assist structure for consistency",
      "Replace vague language with specific timelines and concrete next steps",
      "End with a brief offer to help further (\"Anything else I can do?\")"
    ]
  }'::jsonb,
  0.35,
  7,
  'You are a helpful customer support assistant. Provide concise, 2-3 sentence responses. Be professional and empathetic without being overly apologetic. Always include specific timelines.',
  now() - interval '1 day'
);

-- Second metric snapshot (based on 7 new ratings: 5 out of 7 were 4+ stars = 71%)
insert into metrics (project_id, extraction_id, success_rate, criteria_breakdown, snapshot_time)
values (
  1,
  2,
  0.71,
  '{"Tone": "high", "Length": "high", "Structure": "medium", "Content": "high"}'::jsonb,
  now() - interval '1 day'
);

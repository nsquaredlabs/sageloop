# Future Ideas & Explorations

This document captures promising ideas that are **not current priorities** but worth exploring once core product-market fit is achieved.

## Guiding Principle

Stay focused on the core mission: **turning PM taste into testable behavior specs**. Only pursue these if they amplify that mission without distracting from it.

---

## Phase 3+: Prompt Hosting API

**The Idea**: Allow production applications to pull versioned prompts from Sageloop via API.

**Use Case**:

- PM iterates on prompt in Sageloop
- Production workflows (Zapier, Make, custom apps) automatically use latest version
- No copy-paste needed when prompt changes

**Target Users**: No-code/low-code users who iterate frequently on prompts

**Benefits**:

- Single source of truth for prompts
- Automatic version propagation
- A/B testing capability (route % of traffic to new version)
- Rollback safety

**Requirements**:

- Read API for prompts + model configs
- API authentication & rate limiting
- SLA guarantees (becomes critical infrastructure)
- Versioning & canarying support
- Analytics (production success vs eval scores)

**Validation Needed**:

- User interviews: Would you pay extra vs copy-paste?
- What latency is acceptable? (~50-100ms overhead)
- What reliability guarantees needed? (99.9%? 99.99%?)

**Competitive Positioning**:

- vs. LangSmith/Helicone: They do observability + management
- vs. Zapier AI: They want to own prompt UX
- **Our wedge**: PM-defined quality → executable production prompts

**Why Defer**:

- Doesn't strengthen core differentiation
- Infrastructure-heavy (API reliability, auth, monitoring)
- Serves existing users incrementally vs acquiring new ones
- Need PMF on core eval workflow first

**Decision Gate**: Only pursue if:

1. Core eval loop is bulletproof
2. 4+ users actively request this feature
3. Willingness to pay is validated
4. Team has bandwidth for infrastructure work

---

## Template for New Ideas

When adding ideas here, include:

- **The Idea**: One sentence description
- **Use Case**: Specific user workflow
- **Benefits**: Why users would want this
- **Why Defer**: Why not now
- **Decision Gate**: What needs to be true to pursue it

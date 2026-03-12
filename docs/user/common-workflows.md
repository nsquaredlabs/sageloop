# Common Workflows

> Learn the most effective ways to use Sageloop for your specific needs.

## Workflow 1: Evaluating a New Feature

**Time**: 30 minutes | **Goal**: Define quality for a new AI feature

### Steps

1. **Create Project** (2 min)
   - Name: "Feature Name - Evaluation"
   - Write initial system prompt based on requirements

2. **Add Scenarios** (5 min)
   - 15-20 real examples from product spec
   - Include edge cases and boundary conditions

3. **Generate & Rate** (15 min)
   - Generate outputs
   - Rate all outputs (5 min)
   - Add feedback on low ratings

4. **Extract Patterns** (2 min)
   - Run extraction
   - Review quality patterns

5. **Document Findings** (5 min)
   - Export golden examples
   - Share with engineering team

### Output

Clear quality definition ready for implementation.

---

## Workflow 2: Iterating on Existing Prompt

**Time**: 20 minutes per iteration | **Goal**: Improve underperforming feature

### Steps

1. **Rate Current Outputs** (5 min)
   - Open existing project
   - Rate all outputs if not already done

2. **Extract Patterns** (2 min)
   - Identify failure clusters
   - Review root causes

3. **Apply Suggested Fix** (3 min)
   - Click "Apply Fix & Retest"
   - Review prompt changes
   - Confirm update

4. **Rate New Outputs** (5 min)
   - Rate regenerated scenarios
   - Check if quality improved

5. **Iterate or Ship** (5 min)
   - If `>90%` success: Export and ship
   - If `<90%`: Repeat steps 2-5

### Expected Result

Success rate improves 10-20% per iteration.

---

## Workflow 3: Evaluating with Multiple Reviewers

**Time**: Ongoing | **Goal**: Align multiple perspectives on quality standards

### Setup

1. Create project (PM)
2. Add scenarios (PM or team)
3. Generate outputs (PM)
4. Have each team member rate outputs independently (all)

### Why It Works

- Multiple perspectives on quality
- Discover subjective vs. objective failures
- Align team on standards

### Deliverable

- Consensus on quality definition
- Points of disagreement documented
- Clear behavioral spec

---

## Workflow 4: Comparing Two Models

**Time**: 30 minutes | **Goal**: Decide between GPT-4 vs Claude

### Steps

1. **Create Two Projects**
   - Project A: GPT-4
   - Project B: Claude
   - Same system prompt and scenarios

2. **Generate Outputs** (3 min)
   - Run Generation on both

3. **Rate Independently** (15 min)
   - Rate Project A outputs
   - Rate Project B outputs

4. **Compare Results** (5 min)
   - Check success rates
   - Read actual outputs
   - Assess quality differences

5. **Document Decision** (7 min)
   - Model choice
   - Success rate difference
   - Quality rationale

### Quick Decision Matrix

| Metric      | GPT-4  | Claude |
| ----------- | ------ | ------ |
| Quality (%) | 92%    | 88%    |
| Speed       | Slower | Faster |

**Decision**: Choose based on quality needs and performance trade-offs.

---

## Workflow 5: Export for CI/CD Integration

**Time**: 10 minutes | **Goal**: Get test suite into engineering workflow

### Prerequisites

- Achieved `>90%` success rate
- Have golden examples and failure patterns

### Steps

1. **Go to Insights**
2. Click **"Export"**
3. Choose **"Test Suite (pytest)"**
4. Download JSON
5. Share with engineering

### Engineering Integration

Engineers can now run:

```bash
pytest sageloop_tests.json
```

Automatically tests AI behavior in CI/CD pipeline.

---

## Workflow 6: Testing Multiple Variations

**Time**: 40 minutes | **Goal**: A/B test different prompt versions

### Steps

1. **Create Base Project** (5 min)
   - Name: "Support Bot - Base"
   - Initial system prompt
   - Add 15 scenarios

2. **Generate & Rate Base** (15 min)
   - Generate outputs
   - Rate all outputs
   - Success rate: 70%

3. **Create Variation Project** (5 min)
   - Clone scenarios
   - Modify system prompt (e.g., "be more casual")
   - Generate

4. **Rate Variation** (10 min)
   - Rate new outputs
   - Compare success rates

5. **Choose Winner** (5 min)
   - Which variation performed better?
   - Update production prompt

### Example Variations

- **Version A**: Formal tone
- **Version B**: Casual tone
- **Version C**: Balanced

Results might show Version B gets higher ratings, so you'd use that.

---

## Quick Reference: Common Scenarios by Role

### Product Manager

1. **Daily**: Rate outputs as they're generated
2. **Weekly**: Run extraction to find patterns
3. **Monthly**: Export insights to engineering

### Design Lead

1. **Discovery**: Define tone and personality
2. **Evaluation**: Rate based on brand alignment
3. **Feedback**: Add feedback explaining brand misalignment

### Engineering Lead

1. **Review**: Examine extracted patterns
2. **Implement**: Build bot using specifications
3. **Test**: Run exported test suite in CI/CD

### Customer Support Lead

1. **Input**: Provide real support questions
2. **Rating**: Rate responses from customer perspective
3. **Feedback**: Explain what customers expect

---

## Tips for Smooth Workflows

**Naming Convention**: Use consistent project naming

```
Feature Name - Version Number - Date
Example: "Support Bot - v2 - Jan 2026"
```

**Feedback Standards**: Always explain 1-2 star ratings

```
Bad:  "Bad"
Good: "Too formal; customers expect casual, friendly tone"
```

**Rating Speed**: Use keyboard shortcuts for fast rating

```
Press 1-5 to rate, ↓ to next output = 5 min for 15 outputs
```

**Version History**: Keep all projects for comparison

```
Support Bot v1 (65% success)
Support Bot v2 (85% success)
Support Bot v3 (95% success)
```

**Export Results**: Export for offline review and stakeholder sharing

```
Share PDF/JSON export for offline review
Easier to reference and discuss with stakeholders
```

---

## Troubleshooting Common Workflow Issues

### Issue: Patterns Not Found

**Cause**: Fewer than 15 rated outputs or all high ratings

**Fix**: Add more scenarios and rate them. Need minimum 15-30 ratings.

### Issue: Reviewers Have Different Standards

**Cause**: Subjective quality definitions

**Fix**:

1. Compare ratings
2. Discuss disagreements
3. Document final standard
4. Re-rate together if needed

### Issue: Iterations Not Improving Quality

**Cause**: Root cause not properly addressed

**Fix**:

1. Review failure cluster reasoning
2. Make larger prompt changes
3. Add more specific instructions

---

## Next Steps

- [Quick Start](quickstart.md) - Back to getting started
- [Rating Guide](guide/rating-outputs.md) - Master rating

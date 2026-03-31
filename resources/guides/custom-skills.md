# Creating Custom Skills

Skills are markdown files that give Terminator domain-specific expertise. When a task matches a skill's domain, Terminator reads the skill file for guidance on how to approach it.

---

## Skill Structure

Each skill lives in its own folder under `skills/`:

```
skills/
├── my-skill/
│   └── SKILL.md
```

The folder name is the skill identifier. The `SKILL.md` file contains the instructions.

---

## SKILL.md Template

```markdown
# Skill: My Custom Skill

## When to Use
Describe when this skill should be activated. Be specific about trigger phrases and task types.

## Approach
Step-by-step instructions for how to handle tasks in this domain.

1. First, do this...
2. Then check this...
3. Finally, produce this output...

## Tools to Use
List the MCP tools most relevant to this skill:
- `memory_search` — Check for prior context
- `browse_url` — Research online
- `files_template_render` — Generate output from templates

## Quality Checklist
- [ ] Did you check memory for relevant context?
- [ ] Is the output well-structured?
- [ ] Did you save results to memory?

## Examples

### Example 1: [Task type]
Input: "User says this..."
Approach: Do X, then Y, then Z.
Output: Produce this kind of result.
```

---

## Example: Social Media Skill

```markdown
# Skill: Social Media

## When to Use
When the user asks to create social media posts, plan a content calendar, 
or draft tweets/LinkedIn posts/threads.

## Approach
1. Check memory for brand voice, past posts, and audience info
2. Research trending topics if relevant
3. Draft the post with appropriate tone and length
4. Include hashtag suggestions
5. Save the draft and offer to schedule or send

## Tools to Use
- `memory_search` — Brand voice, audience preferences
- `browse_search` — Trending topics
- `memory_store` — Save drafts and post history

## Platform Guidelines
- **Twitter/X**: 280 chars, conversational, 2-3 hashtags
- **LinkedIn**: Professional tone, 1300 chars optimal, 3-5 hashtags
- **Instagram**: Visual focus, 2200 char caption limit, 20-30 hashtags
```

---

## Registering Your Skill

After creating the skill folder and SKILL.md:

1. Re-run the installer to update the skills index:
   ```bash
   node installer/dist/install.js
   ```

2. Or manually add to `.terminator/skills-index.json`:
   ```json
   {
     "my-skill": {
       "name": "my-skill",
       "path": "skills/my-skill/SKILL.md",
       "description": "Brief description of what this skill does"
     }
   }
   ```

3. Update `TERMINATOR.md` to include your skill in the skills table.

---

## Best Practices

- **Be specific** — Vague instructions produce vague results. Include concrete steps.
- **Include examples** — Show what good input and output looks like.
- **Reference tools** — Tell the skill which MCP tools to use.
- **Use checklists** — Quality checklists help ensure consistent output.
- **Keep it focused** — One skill per domain. Don't make a skill that does everything.
- **Test it** — Try prompts that should trigger the skill and verify the approach works.

---

## Sharing Skills

Skills are just markdown files. Share them by:
- Copying the skill folder to another workspace
- Publishing to a GitHub repository
- Submitting a PR to the Terminator Package repository

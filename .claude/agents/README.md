# Biggus Agents

A collection of specialized Claude Code agents for project development and management.

## Overview

This repository contains agent configurations for the "biggus" development workflow system. These agents work together to create a structured, incremental development process with proper planning, implementation, and knowledge management.

## Agents

### biggus-init
Initializes new projects with the biggus scheme, including:
- Project directory structure
- GitHub repository setup
- Initial commit and remote configuration

### biggus-make-specs
Interactive specifications creation agent that:
- Conducts thorough requirements gathering through dialogue
- Documents comprehensive project specifications
- Creates structured spec documents in `/specs` directory

### biggus-search
Code archaeology specialist that:
- Searches codebase to determine if features already exist
- Prevents duplicate work
- Returns binary "Found" or "Not Found" determination

### biggus-learns
Knowledge management agent that:
- Captures important project discoveries
- Documents architectural patterns and learnings
- Updates `biggus_brain.md` with institutional knowledge

### biggus-worker
Feature implementation specialist that:
- Implements ONE feature at a time from `biggus_plan.md`
- Uses biggus-search before implementing to prevent duplicates
- Uses biggus-learns to capture important discoveries
- Creates focused, incremental commits with proper testing
- Stops after each feature and reports back

## Project Files

The biggus workflow uses two key files to organize project information:

### biggus_plan.md
**Purpose:** Development roadmap and task tracking
- Lists all features and their implementation status
- Tracks bugs and issues
- Defines priorities and what's next
- Gets updated as features are completed
- Think of it as your "TODO list"

### biggus_brain.md
**Purpose:** Institutional knowledge and learnings
- Stores accumulated project wisdom
- Documents architectural patterns and decisions
- Records environment configurations and gotchas
- Captures workflow optimizations
- Think of it as your "knowledge base"

**Why separate files?**
- The plan file changes frequently (features completed, new bugs)
- The brain file grows slowly but persists long-term
- Different agents need different information
- Cleaner separation of concerns

## Usage

These agents are designed to work with Claude Code. Place them in your project's `.claude/agents/` directory to use them.

### Typical Workflow

1. **Initialize**: Use `biggus-init` to set up a new project
2. **Specify**: Use `biggus-make-specs` to create comprehensive specifications
3. **Implement**: Use `biggus-worker` repeatedly to implement features one at a time
4. **Learn**: biggus-worker automatically uses biggus-learns to capture knowledge
5. **Search**: biggus-worker automatically uses biggus-search to prevent duplicates

## Key Principles

- **Incremental Development**: One feature per commit
- **Knowledge Preservation**: Important learnings are captured for future agents
- **Duplicate Prevention**: Always search before implementing
- **Complete Implementation**: No placeholders or stub code
- **Comprehensive Testing**: Every feature includes tests

## Installation

Copy the agent files to your project:

```bash
mkdir -p .claude/agents
cp biggus-*.md .claude/agents/
```

Or add `.claude/agents/` to your `.gitignore` and use these agents locally.

## License

MIT License - See LICENSE file for details

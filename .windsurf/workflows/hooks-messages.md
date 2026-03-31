---
description: Process incoming messages and commands
---

# Message Handler Hook

This workflow processes incoming messages. Invoke with /hooks-messages.

## Instructions

An incoming message has been received on a communication channel. Please do the following:
1. Read the message content and determine if it contains a command:
   - /status — report current task status using schedule_list
   - /tasks — list all scheduled and active tasks
   - /do <instruction> — execute the instruction using appropriate skills
   - /pause — pause all active scheduled tasks
   - /resume — resume paused scheduled tasks
   - /memory <query> — search memory and return results
2. If it's a command, execute it and send the response back via the same channel
3. If it's a regular message, store it in memory and acknowledge receipt
4. Log the interaction in memory for continuity
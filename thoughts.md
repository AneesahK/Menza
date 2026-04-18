SETUP + PROBLEM

Some users have been complaining that they always have to repeat specific instructions to the AI in each conversation, such as:
- ⁠"I'm based in the UK and all of our data is in pounds. I keep asking for revenue in **pounds* and the assistant gives it to me in dollars."*
- ⁠"When I ask for 'active customers', we define that as customers who've placed an order AND haven't requested a refund in the last 90 days how many active users do have. The assistant always gives another definiton when I just ask for active users."

This has been frustrating for our customers, especially since the AI employee is supposed to understand their business.

TLDR: User provides information to the AI, AI needs to apply it such that user doesn't need to remind them again
- Revenue in pounds + defenition of active customers

My questions/assumptions:
- Should it apply across multiple conversations or just this one chat?
- Active users == active customers? (I assume yes - some sort of semantic def?)


Initial thoughts
- Persistent memory system of some sort
    - Keeping some sort of user persistent instructions in an md and adding it to the end of the system prompt?
    - System prompt = [base agent prompt] + [user persistent instructions]
    - When defining active customers (or any definition) express user may use semantic equivalent to term unless otherwise specified?
    - Either set in Settings manually (by user) or auto-extraction of some sort and maybe a "Save this as a permanant instruction?" shown in chat

Potential Plan
- BE: Some sort of get/set for user persistent instructions (+ semantic def and unless otherwise stated rules etc)
- UI: Preferences/bottom left screen showing current ones
- Ext: auto-extracting rules and asking for user confirmation and saving

(1hr)
---------------

Read the README.md, then explore the project structure. I need to understand:
1. How the agent system prompt is constructed — find the file and function responsible
2. How users/sessions are modelled — find the schema or model definition
3. How API routes are structured — find an example endpoint so I can match the pattern
4. How the frontend settings or profile pages are structured — find an existing settings component if one exists

Don't make any changes. Just summarise what you find with file paths.

-----

Look at packages/db/src/schema/user.ts. Add a new column `instructions` to the users table — a text field that defaults to an empty string. Match the exact column definition style already used in that file.

Then check how existing schema changes are handled in this project — look for a drizzle config file or any existing migration files. Apply the migration so the column is added to the database.

Don't change anything else.

-----------

Look at packages/app/src/server/api/routers/chat.ts for the exact pattern used (how context is accessed, how the db is queried, how auth is checked). Then create a new router file at packages/app/src/server/api/routers/user.ts with two procedures:

- getInstructions: a query that returns the current authed user's `instructions` field from the users table
- updateInstructions: a mutation that accepts { instructions: z.string() } and updates the current authed user's `instructions` field

Register this new router in packages/app/src/server/api/root.ts under the key `user`, matching the pattern used for existing routers.

--------

I need to pass user instructions into the agent system prompt. Here's the chain to modify:

1. packages/worker/src/jobs/run-agent.ts — this is the entry point (processRunAgent). Find where the userId is available here. Before constructing the DataAgent, fetch the user's `instructions` field from the database. Pass it down to wherever DataAgent is instantiated.

2. packages/llm/src/agents/data-agent.ts — modify the createConversation() or run() method to accept an optional `userInstructions: string` parameter. When non-empty, append the following block as an additional system message (same way the data source schema context is injected as a system message):

"--- User Instructions ---\nThe following are permanent instructions set by the user. Always follow these precisely, even if the question implies otherwise:\n\n{userInstructions}\n--- End User Instructions ---"

3. Make sure this is added AFTER the schema context system message so it has high recency in the prompt.

Don't change any other agent logic or the BaseChatAgent.

--------

In the tRPC updateInstructions mutation you just created, after saving the instructions to the database, make a single Anthropic API call. Look at how the Anthropic client is instantiated elsewhere in the codebase (likely in packages/llm/) and use the same client/pattern.

The call should be:
- Model: same model used elsewhere in the project
- System: "You are confirming to a user what business instructions you will now follow. Be concise and specific. Do not be sycophantic."
- User message: "The user just saved these instructions: '{instructions}'. Summarise back to them in 1-2 sentences exactly what you will now always remember, using natural language."
- Max tokens: 200

Return both the saved instructions and the confirmation string from the mutation: { instructions: string, confirmation: string }

If the instructions string is empty, skip the API call and return { instructions: "", confirmation: "" }.

If importing the Anthropic client from packages/llm is difficult, just instantiate a new Anthropic client directly in the router using the same ANTHROPIC_API_KEY environment variable used elsewhere in the project.

------

I need a settings page. There is no existing settings page — build it from scratch using whatever component library is already used in packages/app.

1. Create packages/app/src/app/(app)/settings/page.tsx

2. The page should have a single section titled "Assistant Instructions" with:
   - A textarea that fetches from api.user.getInstructions on mount
   - Saves via api.user.updateInstructions on blur
   - After a successful save, display the `confirmation` string returned by the mutation inline below the textarea in a muted/secondary text style — not a toast
   - Placeholder: "Tell the assistant about your business. e.g. All revenue is in GBP. 'Active customers' means customers who have placed an order with no refund in the last 90 days."
   - A subtle loading state while fetching

3. Add a "Settings" link to the sidebar in packages/app/src/components/layout/app-sidebar.tsx, below the conversations list and above the sign out button. Match the exact style of the sign out button.

Use only components and styles already present in the codebase. Don't introduce any new libraries.

-----
Trace the full flow end to end and check for any gaps:
1. Does the settings page correctly load and save instructions via tRPC?
2. Does updateInstructions return a confirmation string?
3. Does processRunAgent in packages/worker fetch the user's instructions and pass them to DataAgent?
4. Does DataAgent include the instructions block in the system messages sent to the Anthropic API?

Fix any broken links in the chain without changing the overall approach.
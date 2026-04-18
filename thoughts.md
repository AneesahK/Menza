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

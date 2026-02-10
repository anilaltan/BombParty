# PRD From Idea

Transform a rough idea or notes into a structured PRD.

Input: $ARGUMENTS

If no arguments are provided, ask:
"Provide a high-level description of your idea. Include as much detail as you like. You can also paste notes or reference a file (for example, @notes.md)."

Process:
1) If the input is long, summarize the key points in 5-8 bullets.
2) Produce a PRD using the same structure as /prd-wizard.
3) Make assumptions explicit.
4) End with a short list of open questions the user can answer to refine the PRD.

After generating the PRD, ask if the user wants it saved to a file, and if so, write it to the provided path.

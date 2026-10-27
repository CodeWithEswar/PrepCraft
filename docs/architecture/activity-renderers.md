# Activity renderer registry

activity-renderer.tsx uses a registry rather than a page switch: choices (including true/false and scenarios), multiple selection, numeric input, ordering and ordered matching. Unsupported activity types return an explicit unavailable state. The schema allows future short answer, concept review, interview, Java and SQL exercises without separate applications. Publishing one requires its real evaluator.

Server evaluation validates numeric/choice/array shapes and bounds, then compares private expected values. Multiple selection compares sorted choices, ordering compares sequence. No arbitrary code/SQL is executed by the assessment RPC.

Shadcn/Base UI owns tabs, accordion, select, radio, checkbox, drawer and inputs. Safe React text nodes render original educational content. Labs are bounded deterministic teaching tools with textual descriptions. No Three.js or always-running background motion exists.

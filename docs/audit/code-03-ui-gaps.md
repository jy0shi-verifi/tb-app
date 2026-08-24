# Audit 03 — UI and functional completeness (walked, not read)

**Date:** 2026-08-24 · **Branch:** `mass-extraction` · **Method:** `npm run dev`, driven with Playwright at
a 390×844 phone viewport, clean IndexedDB, then demo history.
Findings tagged **[observed]** were seen in a live browser. **[read]** means code only.

_Report in progress — being topped up as the walkthrough proceeds._

## Verdict

Grey Man *computes* correctly — the loads on Today and the Session screen match the p.51 grid cell for
cell, the A/B letter is right, plate rounding is right, and bodyweight reps are right. What is missing is
almost entirely **the connective tissue around that math**. A brand-new install never hears the words
"Grey Man": onboarding is still pure Beginner-mode copy, there is no protocol choice, and the app drops
you into Beginner. Getting to MASS requires knowing to open Settings and change a dropdown. From there
the two screens that make Grey Man usable — `/maxes` and `/plan` — are reachable only through Settings,
are absent from the tab bar, have no back button, and **disagree with each other about what the S cluster
is**: anything you add in the builder can never be given a 1RM, so it is permanently un-loadable. The
Session screen, the thing Josh touches 24 times a morning, clips the weight to a 14-pixel-wide box — a
102.5 kg deadlift renders as "10". Ranked worst first below.


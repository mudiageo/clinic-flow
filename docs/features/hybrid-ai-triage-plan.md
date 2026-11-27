# Hybrid AI Architecture & Implementation Plan: ClinicFlow #BuildHybridAI 2026

## 1. Overview & Objective

ClinicFlow operates in low-resource Primary Healthcare Centres (PHCs) across Nigeria with intermittent connectivity and privacy constraints.
This implementation introduces an on-device first, cloud-fallback Hybrid AI pipeline via Firebase AI Logic (`firebase/ai`), targeting desktop/laptop environments running Chrome with on-device Gemini Nano capability, seamlessly falling back to cloud-hosted Gemini when required.

## 2. Core Architecture

- **Inference Strategy**: `InferenceMode.PREFER_ON_DEVICE` with dual schema configuration (`onDeviceParams.promptOptions.responseConstraint` & `inCloudParams.generationConfig.responseSchema`).
- **PII Guardrail**: Pre-routing sanitization strips names, phone numbers, and addresses locally via tokenization before any cloud transmission.
- **Server-Side Compatibility**: Preserves existing `@google/genai` infrastructure in `ai.remote.ts` for offline server-to-server fallback.
- **Security & Integrity**: Firebase App Check integration (supports debug tokens in local testing) and Remote Config parameters for operational control.

## 3. Four Net-New Clinical Capabilities

1. **Multimodal Document & Lab-Strip Scanner**:
   - Extract clinical metrics and drug items from photos of paper notes, rapid test cassettes (e.g. Malaria RDT), or blister packs using on-device vision/text capabilities.
2. **Care Plan & Vernacular Instructions Generator**:
   - Synthesizes complex clinical encounter notes into Grade-4 reading level instructions with vernacular translations (Nigerian Pidgin, Hausa, Yoruba, Igbo) via cloud fallback when local fidelity is insufficient.
3. **Intelligent Pre-Triage Assistant**:
   - Parses unstructured patient presenting complaints, normalizes vital signs context, suggests Manchester/Emergency Triage categories (Red/Amber/Green), and generates 2-3 clinical clarifying prompts for nurses.
4. **Encounter Completeness Guard & Hybrid Policy Console**:
   - Pre-close clinical audit validating diagnostic-treatment parity.
   - Admin telemetry visualizing on-device vs cloud execution metrics, token latency, and Remote Config overrides.

## 4. Permissions & Safety Framework

- **Role Scoping**:
  - Superadmin: Global kill-switch and platform-wide fallback rules.
  - Facility Admin: PHC-specific AI module enablement and threshold adjustments.
  - Clinician / Nurse: Operational interaction with explicit verification step.
- **Clinical AI Disclaimers**: `<AiDisclaimer>` present on all generated views. No autonomous medical actions or state mutations without explicit confirmation.

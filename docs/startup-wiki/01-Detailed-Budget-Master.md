# ClinicFlow: Master Financial Operating Plan (₦30,000,000)

## Chapter 1: Executive Financial Summary & Strategic Allocation

### 1.1 The Macroeconomic Context (Nigeria 2026)

Operating a hardware-enabled startup in Nigeria requires a defensive financial posture. The ₦30,000,000 grant must be insulated against parallel market FX (Foreign Exchange) fluctuations and local inflation. Because 70% of our budget relies on imported hardware (GPUs, Apple Silicon, Solar Inverters, Android Tablets), the primary financial directive of the CEO is **immediate CapEx deployment**. Upon receipt of the grant, all hardware must be procured within the first 14 days to lock in the exchange rate and prevent capital depreciation.

### 1.2 Burn Rate Philosophy

ClinicFlow operates on a "Default Alive" trajectory for the 12-month pilot.

- **Total Capital:** ₦30,000,000
- **Total CapEx (Months 1-2):** ₦21,000,000 (Hardware, Solar, Lab)
- **Remaining OpEx Runway:** ₦9,000,000
- **Monthly Burn Rate (Months 3-12):** ₦900,000 / month.
  This controlled burn rate guarantees that the company will survive the full 12-month pilot phase across 3 clinics without running out of cash for cloud hosting, APIs, or travel.

### 1.3 The "Valley of Death" Bridge

Hardware and HealthTech startups face a notorious "Valley of Death"—the period between building the prototype and proving clinical efficacy, where capital dries up. This ₦30M budget is strictly designed as a bridge. It funds the creation of the proprietary AI infrastructure and the real-world clinical validation required to raise a $500,000+ Pre-Seed venture capital round in Month 10.

---

## Chapter 2: Phase 1 CapEx Deep Dive - R&D Infrastructure & AI Lab

To achieve our core value proposition (100% offline AI running in rural clinics), we must transition from relying on Google Gemini's Cloud API to running our own open-weight models (MedGemma) via WebGPU.

### 2.1 The "Cloud vs. On-Prem" Financial Dilemma

Typically, AI startups rent cloud GPUs (AWS A100s or RunPod). However, fine-tuning an LLM on highly sensitive, un-anonymized Nigerian medical data on foreign servers violates the Nigeria Data Protection Act (NDPA). Furthermore, continuous cloud GPU rental would consume our entire ₦9M OpEx budget within 4 months.
**The Solution:** We are utilizing ₦15,000,000 (50% of the grant) to build a permanent, on-premise AI Development Lab. This is a one-time CapEx that reduces our monthly AI R&D server costs to zero.

### 2.2 The Central AI Lab Workstation (₦7,500,000 Allocation)

This machine is the engine of the company. It will be stationed at ClinicFlow HQ and used strictly for training, quantizing, and running QLoRA fine-tuning on medical datasets (NPHCDA guidelines and Pidgin medical corpora).

- **GPU Engine (₦3,800,000):** 1x NVIDIA GeForce RTX 4090 (24GB GDDR6X VRAM).
  - _Justification:_ Fine-tuning a 4B to 8B parameter model requires keeping the model weights, gradients, and optimizer states in memory. 24GB of VRAM is the absolute minimum required for local LoRA fine-tuning without spilling over to system RAM (which throttles training speeds by 90%).
- **CPU & Motherboard (₦1,800,000):** AMD Ryzen Threadripper PRO 5955WX (16-Core/32-Thread) or Intel Core i9-14900K on an E-ATX workstation motherboard.
  - _Justification:_ Dataset preprocessing (tokenizing millions of rows of clinical data) is entirely CPU-bound. A massive multi-core processor cuts dataset prep time from days to hours.
- **System Memory (₦700,000):** 128GB DDR5 6000MHz RAM.
  - _Justification:_ When combining datasets, the entire corpus must often be loaded into RAM. 128GB prevents out-of-memory (OOM) crashes during data sanitization.
- **High-Speed Storage (₦600,000):** 4TB Gen5 NVMe M.2 SSD.
  - _Justification:_ LLM checkpoints are massive (often 10GB+ each). Fast read/write speeds are required to save epochs during training without bottlenecking the GPU.
- **Power & Thermal Infrastructure (₦600,000):** 1200W 80+ Titanium Power Supply, 360mm AIO Liquid Cooler, and a dedicated 3KVA Pure Sine Wave UPS.
  - _Justification:_ Training runs can take 48-72 hours continuously. The Nigerian climate requires extreme liquid cooling to prevent thermal throttling, and the UPS ensures a split-second grid fluctuation doesn't destroy 3 days of AI training progress.

### 2.3 The Mobile ML Development Workstation (₦7,500,000 Allocation)

While the Central AI Lab stays at HQ, the CTO and engineering team must travel to the 3 rural clinics for deployment and debugging.

- **The Hardware:** Apple MacBook Pro 16-inch (M3 Max or M4 Max) with 128GB Unified Memory and 2TB SSD.
- **The Technical Justification:**
  1.  **Unified Memory Architecture:** Unlike standard laptops that cap VRAM at 16GB, Apple Silicon allows the GPU to access all 128GB of system RAM. This makes it the _only_ mobile machine capable of running massive, unquantized LLM inference locally while in the field.
  2.  **Battery Efficiency:** During field deployments at clinics where the solar inverters are reserved strictly for medical tablets, the CTO needs a machine that can compile heavy Tauri (Rust/SvelteKit) cross-platform binaries and run Docker containers for 12+ hours on a single battery charge.
  3.  **Cross-Compilation:** ClinicFlow requires deploying to Android (tablets), Windows (admin desktops), and Linux (local servers). A UNIX-based macOS environment with XCode and Android Studio is required to compile and sign all three targets locally.

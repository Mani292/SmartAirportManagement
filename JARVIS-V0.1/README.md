# 🧠 AI-OS (Formerly JARVIS V0.1)

> **Status: Next-Gen Agentic Architecture** | A 100% local, multi-agent AI Operating System running on your machine.

AI-OS has evolved from a simple voice assistant into a fully-fledged local Artificial Intelligence Operating System. It handles multi-threaded local speech processing, continuous autonomous reasoning via a multi-agent state graph, and persistent asynchronous long-term memory via local Markdown graph databases.

---

## ⚡ Core System Architecture

### Layer 1: The UI (V.A.U.L.T. HUD)
A dedicated multi-threaded GUI built with `CustomTkinter`. Audio acquisition, orchestration processing, and text streaming execute on decoupled background threads to prevent main interface freezing.

### Layer 2: The Voice (100% Offline Pipe)
* **Ears (STT):** `faster-whisper-small.en` running on local CPU utilizing ahead-of-time ambient acoustic calibration.
* **Mouth (TTS):** `Kokoro v1.0` executing natively via ONNX runtimes to produce studio-grade natural human speech patterns without cloud overhead.

### Layer 3: AI Kernel (The Brain)
Powered by **LangGraph** and an open-source local LLM running on **Ollama** (e.g., `qwen2.5:7b`). The AI Kernel coordinates continuous reasoning loops:
* **Planner Agent**: Decomposes user goals into actionable step-by-step logic.
* **Executor Agent**: Runs system automation tools.

### Layer 4: Memory Engine (Long-Term Vector DB)
Local Markdown notes inside a Vault (e.g., Obsidian) are dynamically chunked and vectorized using **FAISS** and local **OllamaEmbeddings**.
Before the Planner acts, it retrieves relevant contextual history, bridging the gap between passive storage and active semantic reasoning.

### Layer 5: Skill Marketplace
Dynamic skills (`open_website`, `shutdown_system`) are loaded as modular LangChain tools. The AI Kernel dynamically routes requests to the required sub-skills.

---

## 🛠️ Installation & Setup

### 1. Pre-requisites

Ensure your system has **Python 3.12+**, the fast package manager **uv**, and **Ollama** installed locally.

### 2. Workspace Initialization

```bash
git clone https://github.com/BhargavaKandala/JARVIS-V0.1.git
cd JARVIS-V0.1
uv venv
uv pip install -r requirements.txt
```

### 3. Start Local AI Services (Ollama)

Ensure Ollama is running in the background with your target LLM and embedding models pulled:
```bash
ollama pull qwen2.5:7b-instruct
ollama pull nomic-embed-text
```

### 4. Local Voice Models

Initialize the included setup downloader to fetch offline speech assets:
```bash
uv run download_kokoro.py
```

### 5. Memory Vault Configuration
Create a local folder to serve as the Memory Vault, or point it to an existing Obsidian Vault directory.

Configure your `.env`:
```env
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

---

## 🚀 Ignition Sequence

With your Ollama server active, fire up the command interface:

```bash
uv run main.py
```

* When the HUD reads **AWAITING AUDIO**, call out: *"Hey Jarvis..."*
* Instruct it: *"Jarvis, research the latest local LLMs and save a summary into my memory vault."*
* Watch as the **Planner Agent** parses the intent, queries the **Memory Engine** for context, executes the **Browser Skill**, and uses the **Memory Skill** to save its findings—all 100% locally.

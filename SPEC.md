# Product Specification: LLM Texas Hold'em Desktop Game

## 1. Overview
The LLM Texas Hold'em Desktop Game is a sophisticated application that allows users to configure and run poker matches driven by Large Language Models. Users can set up custom games to pit different AI models against each other or play against AI themselves.

## 2. Tech Stack
- **Framework**: Electron (Desktop integration)
- **Frontend Build Tool**: Vite
- **Frontend Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Styling**: TailwindCSS (recommended for rapid UI development)
- **State Management**: Pinia (for managing complex game states)

## 3. Architecture Vision
### 3.1 Main Process (Electron/Node.js)
- **LLM Orchestrator**: Manages API keys, handles requests to various LLM providers (e.g., OpenAI, Anthropic, Local models via Ollama), and formats game state into structured prompts.
- **File System/Config Management**: Saves and loads user configurations, match histories, and AI profiles.
- **Game Engine (Optional/Shared)**: Contains the core Texas Hold'em logic (deck shuffling, hand evaluation, betting rounds). Keeping this logic separate from the UI ensures security and consistency.

### 3.2 Renderer Process (Vue 3/Vite)
- **Configuration UI**: Screens to set up players, starting chips, blind structures, and assign LLM models or humans to seats.
- **Game Board UI**: Visual representation of the poker table, cards (hole and community), chips, pot sizes, and player actions.
- **Action Panel**: Controls for human players to Check, Call, Raise, or Fold.
- **Event Log**: A real-time log of actions, betting, and potentially the 'thoughts' or justifications provided by the AI models.

### 3.3 IPC (Inter-Process Communication)
- The Renderer communicates with the Main process to request AI moves.
- The Main process sends updates regarding LLM responses back to the Renderer.

## 4. Key Features
- **Flexible Matchmaking**: Support for Human vs. AIs, or AI vs. AI simulation modes.
- **Customizable AI Personas**: Configure different LLMs with varying temperature settings, prompt instructions, and risk tolerances.
- **Robust Poker Engine**: Accurate rule enforcement, side-pot calculations, and standard hand evaluations.
- **Interactive UI**: Responsive desktop interface tailored for clarity during complex poker scenarios.
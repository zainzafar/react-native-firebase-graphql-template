# Agent Guide — API (Node.js + TypeScript + Express)

## Project Shape
- **Type:** Node.js backend API written in TypeScript (CommonJS modules).  
- **Entry:** `src/index.ts` (may use Express).  
- **Build:** `tsc` outputs to `dist/`.  
- **Dev:** `nodemon` + `ts-node` with live reload.  
- **Package manager:** npm only (`package-lock.json` present).  

## How to Run
- **Development:** `npm run dev`  
- **Build:** `npm run build`  
- **Production:** `npm start` → runs `node dist/index.js`  

## Conventions
- Use **strict typing**; avoid `any`. Explicitly type all exported/public APIs.  
- Prefer **async/await**; centralize error handling in middleware.  
- Organize under `src/`:  
  - `routes/`  
  - `controllers/`  
  - `services/`  
  - `middleware/`  
  - `utils/`  
  - `config/`  
- Validate inputs at **route boundaries** (e.g. `zod` or `joi`) when needed.  
- Use environment variables via `process.env`; commit `.env.example` only.  
- Keep module system aligned with `tsconfig.json` (`module: CommonJS`, `esModuleInterop: true`).  

## Boundaries
- Scope changes to `api/` only for API tasks.  
- Do not commit `dist/` or `node_modules/`.  
- Do not rename scripts or alter `tsconfig`/`nodemon` config unless explicitly requested.  
- When given a task, **focus only on that task** and avoid unrelated changes.  
- If these rules need updating, update **this file** as part of the task.  

## Dependencies
- When adding libraries (e.g. `express`, `cors`, `helmet`, `morgan`), also install types:  
  ```bash
  npm i -D @types/<pkg>
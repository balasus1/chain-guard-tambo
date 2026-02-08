# Chain-Guard Quick Reference

## 🎯 Project Goal
Build an **immutable auditing tool** for logistics tracking that uses Tambo AI to provide intelligent, conversational interfaces for supply chain monitoring.

## 🔑 Key Files to Know

### Configuration
- **`src/lib/tambo.ts`** - ⭐ **MOST IMPORTANT** - Register all components and tools here
- **`src/app/chat/page.tsx`** - Chat interface with TamboProvider
- **`.env.local`** - Add your Tambo API key here

### Component Examples
- **`src/components/tambo/graph.tsx`** - Example of a registered component (charts)
- **`src/components/ui/card-data.tsx`** - Example of an interactable component with state

### Tool Examples
- **`src/services/population-stats.ts`** - Example tool implementation (mock data)

## 🛠️ How to Add New Features

### Adding a New Component
1. Create component in `src/components/tambo/` or `src/components/ui/`
2. Define Zod schema for props
3. Register in `src/lib/tambo.ts` → `components` array

### Adding a New Tool
1. Create service function in `src/services/`
2. Define input/output Zod schemas
3. Register in `src/lib/tambo.ts` → `tools` array

### Example: Adding a Timeline Component

```typescript
// src/components/tambo/timeline.tsx
import { z } from "zod";

export const timelineSchema = z.object({
  events: z.array(z.object({
    timestamp: z.string(),
    location: z.string(),
    status: z.string(),
  })),
  title: z.string(),
});

export type TimelineProps = z.infer<typeof timelineSchema>;

export const Timeline = ({ events, title }: TimelineProps) => {
  // Component implementation
};
```

```typescript
// src/lib/tambo.ts
import { Timeline, timelineSchema } from "@/components/tambo/timeline";

export const components: TamboComponent[] = [
  // ... existing components
  {
    name: "Timeline",
    description: "Displays an immutable timeline of tracking events",
    component: Timeline,
    propsSchema: timelineSchema,
  },
];
```

## 📊 Tambo Hooks Cheat Sheet

- `useTamboThread()` - Access current conversation thread
- `useTamboStreaming()` - Real-time streaming updates
- `useTamboComponentState()` - Component-level state management
- `useTamboVoice()` - Voice input
- `useTamboSuggestions()` - AI suggestions

## 🚀 Development Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Build for production
npm run lint     # Check for errors
```

## 💡 Key Concepts

1. **Components** = UI elements AI can render dynamically
2. **Tools** = Functions AI can call to fetch data or perform actions
3. **Schemas** = Zod schemas define what AI can/cannot do
4. **Streaming** = Real-time updates as AI generates responses

## 🎨 Design Patterns

- Use **Zod schemas** for all component props and tool I/O
- Components should support **variants** and **sizes** for flexibility
- Use **Tailwind CSS** with dark mode support
- Follow existing patterns from `graph.tsx` and `card-data.tsx`

## 📚 Resources

- [Tambo Docs](https://docs.tambo.co)
- [Tambo Dashboard](https://tambo.co/dashboard)
- See `PROJECT_UNDERSTANDING.md` for detailed architecture plan

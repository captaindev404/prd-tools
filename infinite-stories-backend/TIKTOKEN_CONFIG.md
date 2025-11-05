# Tiktoken Configuration for Next.js 16+

## Problem
Tiktoken uses WebAssembly (WASM) files that require special configuration in Next.js:

```
Error: Missing tiktoken_bg.wasm
```

**Next.js 16+ Issue**: Turbopack is now the default bundler, and custom webpack configs trigger a warning.

## Solution

### 1. Next.js Configuration (`next.config.ts`)

For **Next.js 16+** with Turbopack (default):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16+ default)
  turbopack: {
    // Empty config acknowledges Turbopack usage
    // Turbopack handles WASM natively without special configuration
  },

  // Webpack configuration (fallback for --webpack mode)
  webpack: (config, { isServer, dev }) => {
    // Configure WASM support for tiktoken
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Fix for tiktoken WASM files in browser builds
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }

    return config;
  },
};

export default nextConfig;
```

### Why This Works

- **Turbopack**: Handles WASM natively, no special config needed
- **Webpack**: Fallback for `npm run dev --webpack` mode
- **Empty turbopack config**: Silences the webpack/turbopack warning

### 2. Package Installation

```bash
npm install tiktoken
```

### 3. Usage in API Routes

Based on [official tiktoken documentation](https://github.com/dqbd/tiktoken):

**Option A: Direct Usage (Recommended for Simple Cases)**
```typescript
import { get_encoding } from "tiktoken";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const encoding = get_encoding("cl100k_base");
  const tokens = encoding.encode("hello world");
  encoding.free();  // Always free when done!
  return res.status(200).json({ tokens });
}
```

**Option B: Wrapper Class (Our Implementation)**
```typescript
import { encoding_for_model, type Tiktoken } from 'tiktoken';

export class StoryTokenizer {
  private encoder: Tiktoken;

  constructor() {
    // GPT-4o uses cl100k_base encoding
    this.encoder = encoding_for_model('gpt-4o');
  }

  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  free() {
    this.encoder.free();  // Critical for memory management!
  }
}

// Usage in API route with proper cleanup
const tokenizer = new StoryTokenizer();
try {
  const count = tokenizer.countTokens(text);
  // ... use count
} finally {
  tokenizer.free();  // Always free in finally block
}
```

**Key Points from Official Docs:**
- ✅ Always call `free()` to release WASM memory
- ✅ Use try/finally pattern for guaranteed cleanup
- ✅ Especially important in serverless/edge functions

## Key Configuration Details

### `asyncWebAssembly: true`
- Enables webpack to handle `.wasm` files
- Required for tiktoken's WASM-based encoding

### `fs: false`
- Prevents tiktoken from trying to access the filesystem in browser builds
- Server-side code can still access fs, but browser bundles won't fail

## Testing

### Start the Dev Server

```bash
# With Turbopack (default, recommended)
npm run dev

# Or explicitly with webpack (if needed)
npm run dev -- --webpack
```

Expected output:
```
✓ Ready in 493ms
```

No errors about webpack/turbopack conflicts!

### Test Tiktoken Functionality

Run the test script:

```bash
./test-tiktoken-endpoint.sh
```

Or manually test:

```bash
curl -X POST http://localhost:3000/api/stories/extract-scenes \
  -H "Content-Type: application/json" \
  -d '{
    "storyContent": "Once upon a time...",
    "storyDuration": 60,
    "hero": {
      "name": "Luna",
      "primaryTrait": "Brave",
      "secondaryTrait": "Kind",
      "appearance": "Glowing character",
      "specialAbility": "Glows in the dark"
    },
    "eventContext": "bedtime"
  }'
```

## Verification

You should see:
- ✅ No WASM errors in the console
- ✅ Token counts calculated correctly
- ✅ Scene extraction working properly

## Performance Notes

- Tiktoken is ~10-20x more accurate than character-based estimation
- Token counts match OpenAI's actual token usage
- Essential for proper chunking of large stories
- WASM initialization happens once per encoder instance

## Alternatives

If WASM issues persist, consider character-based estimation:

```typescript
// Approximate: 1 token ≈ 4 characters for English
const estimatedTokens = Math.ceil(text.length / 4 * 1.1);
```

However, tiktoken provides **exact** token counts matching OpenAI's API.

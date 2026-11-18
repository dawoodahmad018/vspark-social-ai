// Run: node --env-file=.env.local scripts/check-gemini.mjs
// One real provider request; never prints captions, credentials or raw errors.
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) {
  console.log('NOT_CONFIGURED: GEMINI_API_KEY and GEMINI_MODEL are required.'); process.exit(1);
}
try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: 'Create 2 distinct short social captions about organizing study notes. Captions omit hashtags; return 1-3 hashtags per caption separately, starting with #. Do not invent factual claims.',
    config: { httpOptions: { timeout: 20000 }, responseMimeType: 'application/json',
      responseJsonSchema: { type: 'object', properties: { captions: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'object', properties: { caption: { type: 'string' }, hashtags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 } }, required: ['caption','hashtags'] } } }, required: ['captions'] } },
  });
  const schema = z.object({captions:z.array(z.object({caption:z.string().min(1).max(4000),hashtags:z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u)).min(1).max(8)})).min(2).max(3)});
  const result = schema.parse(JSON.parse(response.text || ''));
  console.log(`PASS: real Gemini response validated; ${result.captions.length} captions with hashtags. This checks the provider, not authenticated app/quota integration.`);
} catch (error) {
  const status = typeof error?.status === 'number' ? error.status : 'unavailable';
  console.log(`FAIL: real Gemini request or response validation failed (provider status: ${status}). Check model, key, quota and connectivity. No mock fallback used.`);
  process.exitCode = 1;
}

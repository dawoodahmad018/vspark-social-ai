import { integrationStatus } from '@/lib/config';
import { success } from '@/lib/http';
export async function GET() { return success({ integrations: integrationStatus(), contract: 'v1' }); }

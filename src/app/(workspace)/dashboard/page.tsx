import { Dashboard } from '@/components/dashboard';
import { integrationStatus } from '@/lib/config';
export default function DashboardPage() { return <Dashboard integrations={integrationStatus()} />; }

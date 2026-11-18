import { Dashboard } from '@/components/dashboard';
import { integrationStatus } from '@/lib/config';
export default function PostsPage() { return <Dashboard integrations={integrationStatus()} view="posts" />; }

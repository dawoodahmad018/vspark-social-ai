import { PreferencesForm } from '@/components/notifications/preferences-form';
import { hasSupabase } from '@/lib/config';
export default function SettingsPage() { return <><div className="page-heading"><div><p className="eyebrow">A WORKFLOW THAT WORKS FOR YOU</p><h1>Your preferences. Your pace.</h1><p>Manage your notification recipient and the details you want to receive.</p></div></div><PreferencesForm configured={hasSupabase()} /></>; }

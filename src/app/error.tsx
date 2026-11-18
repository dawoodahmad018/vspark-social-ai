'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="auth-main"><section className="panel"><h1>We couldn’t load this page.</h1><p>Check your connection and service configuration, then try again.</p><button className="button primary" onClick={reset}>Try again</button></section></main>; }

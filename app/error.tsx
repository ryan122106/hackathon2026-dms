'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="boot"><h1>Something interrupted this page.</h1><p>Your saved demo records are still in browser storage.</p><button className="button primary" onClick={reset}>Try again</button></div>;}

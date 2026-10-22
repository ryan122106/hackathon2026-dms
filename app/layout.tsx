import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import {DemoProvider} from '@/components/demo-provider';
import './globals.css';
export const metadata:Metadata={title:'DMS NextGen AI | Advisor Workspace',description:'Automotive Service Advisor Workspace. Student hackathon prototype using fictional data.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-theme="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('dms-nextgen-theme')==='light'?'light':'dark'}catch(e){}"}}/></head><body><DemoProvider>{children}</DemoProvider></body></html>;}

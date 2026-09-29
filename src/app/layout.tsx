import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Relay — Make the next step count',description:'A connected meeting workspace for conversations, decisions, and follow-through. Find the moment. Keep the work moving.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}

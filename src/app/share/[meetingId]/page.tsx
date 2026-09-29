import {PublicSession} from '@/components/relay/PublicSession';
export default async function SharePage({params}:{params:Promise<{meetingId:string}>}){return <PublicSession token={(await params).meetingId}/>;}

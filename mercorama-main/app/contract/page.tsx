import { redirect } from 'next/navigation';

// /contract is the legacy URL — permanently redirect to /deal-summary
export default function ContractRedirectPage() {
  redirect('/deal-summary');
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminRoot() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('admin_auth')?.value;

  if (auth && auth === process.env.ADMIN_PASSWORD) {
    redirect('/admin/dashboard');
  } else {
    redirect('/admin/login');
  }
}

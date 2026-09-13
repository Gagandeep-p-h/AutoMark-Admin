import { StudentsPage } from '@/components/smartattend-pages'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }

  const email = session.email || ''
  
  // Logic to determine dept
  let adminDept = 'CSE' // default fallback
  if (email === 'admin@ec') adminDept = 'ECE'
  else if (email === 'admin@eee') adminDept = 'EEE'
  else if (email === 'admin@cv') adminDept = 'CV'
  else if (email === 'admin@me') adminDept = 'ME'
  else if (email === 'admin@aiml') adminDept = 'AIML'
  else if (email === 'admin@ds') adminDept = 'DS'
  else if (email === 'admin' || email === 'admin@smartattend.edu' || email === 'admin@smartattend.edu.in') adminDept = 'ALL'

  return <StudentsPage adminDept={adminDept} /> 
}

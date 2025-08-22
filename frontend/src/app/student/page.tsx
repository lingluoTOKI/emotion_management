import { redirect } from 'next/navigation'

export default function StudentIndexPage() {
  // 重定向到学生仪表盘
  redirect('/student/dashboard')
}

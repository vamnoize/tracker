import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import FoodClient from './FoodClient'
import { Profile, MealLog } from '@/types'

export default async function FoodPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data: meals } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', startOfDay)
    .lt('logged_at', endOfDay)
    .order('logged_at', { ascending: false })

  return (
    <>
      <Navbar profile={profile as Profile | null} />
      <FoodClient
        initialMeals={(meals ?? []) as MealLog[]}
        profile={profile as Profile | null}
        userId={user.id}
      />
    </>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { target_id, action } = await req.json()
  if (!target_id || !['follow', 'unfollow'].includes(action)) {
    return NextResponse.json({ error: 'Invalid follow request' }, { status: 400 })
  }

  if (target_id === user.id) {
    return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 })
  }

  if (action === 'follow') {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: target_id })

    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: user.id, following_id: target_id })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

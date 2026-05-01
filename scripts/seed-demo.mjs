import fs from 'node:fs'

function loadEnv() {
  const parsed = {}

  if (fs.existsSync('.env.local')) {
    const lines = fs.readFileSync('.env.local', 'utf8').split(/\n+/)
    for (const line of lines) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const index = line.indexOf('=')
      parsed[line.slice(0, index)] = line.slice(index + 1)
    }
  }

  return {
    ...parsed,
    ...process.env,
  }
}

const env = loadEnv()
const BASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const DEMO_PASSWORD = env.DEMO_PASSWORD || 'HomePlateDemo123!'

if (!BASE_URL || !ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const PUBLIC_HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
}

const demoUsers = [
  {
    email: 'maya.homeplate.demo@example.com',
    username: 'maya_lopez',
    displayName: 'Maya Lopez',
    bio: 'Weeknight cook chasing bright, cozy dinners.',
    posts: [
      {
        dish_name: 'Lemon Herb Pasta',
        caption: 'Fast pantry pasta with parsley, lemon zest, and lots of black pepper.',
        image_url: '/demo/pasta-party.svg',
        cook_time: '25 min',
        servings: 2,
        difficulty: 'Easy',
        ingredients: ['200g spaghetti', '2 tbsp olive oil', '1 lemon', '2 garlic cloves', 'parsley'],
        steps: ['Boil the pasta.', 'Toast garlic in olive oil.', 'Toss everything together with lemon and parsley.'],
        tags: ['italian', 'vegetarian'],
        calories: 560,
        protein_g: 14,
        carbs_g: 78,
        fat_g: 21,
        fiber_g: 5,
        sodium_mg: 420,
        nutrition_labels: ['vegetarian'],
      },
    ],
  },
  {
    email: 'priya.homeplate.demo@example.com',
    username: 'priya_k',
    displayName: 'Priya K',
    bio: 'Comfort food, spice blends, and Sunday prep meals.',
    posts: [
      {
        dish_name: 'Weeknight Curry Bowl',
        caption: 'Creamy tomato curry with chickpeas over jasmine rice.',
        image_url: '/demo/curry-night.svg',
        cook_time: '35 min',
        servings: 3,
        difficulty: 'Easy',
        ingredients: ['1 can chickpeas', '1 cup rice', '1 onion', '1 cup tomato puree', '1/2 cup coconut milk'],
        steps: ['Cook the rice.', 'Simmer onion, tomato, and spices.', 'Add chickpeas and finish with coconut milk.'],
        tags: ['vegan', 'high-protein'],
        calories: 640,
        protein_g: 22,
        carbs_g: 86,
        fat_g: 22,
        fiber_g: 13,
        sodium_mg: 610,
        nutrition_labels: ['vegan', 'dairy-free'],
      },
    ],
  },
  {
    email: 'nico.homeplate.demo@example.com',
    username: 'nico_santos',
    displayName: 'Nico Santos',
    bio: 'Brunch plates and late-night snack experiments.',
    posts: [
      {
        dish_name: 'Avocado Egg Toast',
        caption: 'Crunchy toast, smashed avocado, jammy eggs, chili flakes.',
        image_url: '/demo/toast-morning.svg',
        cook_time: '15 min',
        servings: 2,
        difficulty: 'Easy',
        ingredients: ['2 slices sourdough', '1 avocado', '2 eggs', 'olive oil', 'chili flakes'],
        steps: ['Toast the bread.', 'Smash avocado with salt.', 'Top with jammy eggs and chili flakes.'],
        tags: ['breakfast', 'vegetarian'],
        calories: 420,
        protein_g: 15,
        carbs_g: 29,
        fat_g: 27,
        fiber_g: 8,
        sodium_mg: 340,
        nutrition_labels: ['vegetarian'],
      },
      {
        dish_name: 'Dumpling Night',
        caption: 'Frozen dumplings dressed up with sesame oil, greens, and a quick chili crisp dip.',
        image_url: '/demo/dumpling-board.svg',
        cook_time: '20 min',
        servings: 2,
        difficulty: 'Easy',
        ingredients: ['12 dumplings', 'sesame oil', 'soy sauce', 'scallions', 'baby bok choy'],
        steps: ['Steam or pan-fry the dumplings.', 'Wilt the greens.', 'Serve with sauce and scallions.'],
        tags: ['asian', 'dairy-free'],
        calories: 510,
        protein_g: 18,
        carbs_g: 58,
        fat_g: 21,
        fiber_g: 4,
        sodium_mg: 780,
        nutrition_labels: ['dairy-free'],
      },
    ],
  },
  {
    email: 'demo.debug.1777596622281@example.com',
    password: 'Monkeymanmeow123$',
    username: 'rae_chen',
    displayName: 'Rae Chen',
    bio: 'Late-night rice bowls and quick comfort meals from the freezer.',
    posts: [
      {
        dish_name: 'Midnight Rice Bowl',
        caption: 'Crispy rice, soy-glazed mushrooms, greens, and a jammy egg.',
        image_url: '/demo/rice-bowl.svg',
        cook_time: '18 min',
        servings: 1,
        difficulty: 'Easy',
        ingredients: ['1 cup cooked rice', '1 egg', '1 cup mushrooms', 'soy sauce', 'sesame oil', 'spinach'],
        steps: ['Crisp the rice in a skillet.', 'Glaze mushrooms with soy sauce.', 'Top with greens and a jammy egg.'],
        tags: ['asian', 'high-protein'],
        calories: 530,
        protein_g: 19,
        carbs_g: 57,
        fat_g: 24,
        fiber_g: 5,
        sodium_mg: 690,
        nutrition_labels: ['dairy-free'],
      },
    ],
  },
]

async function request(url, init = {}) {
  const res = await fetch(url, init)
  const text = await res.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data
        ? data.error_description || data.message || data.error || JSON.stringify(data)
        : text
    throw new Error(`${res.status} ${message}`)
  }

  return data
}

async function signIn(email, password) {
  return request(`${BASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
}

async function signUp(email, password) {
  return request(`${BASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
}

async function getSession(email, password) {
  try {
    return await signIn(email, password)
  } catch {
    await signUp(email, password)
    return signIn(email, password)
  }
}

function authHeaders(token, prefer = 'return=representation') {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  }
}

async function rest(path, { token, method = 'GET', body, prefer } = {}) {
  return request(`${BASE_URL}/rest/v1/${path}`, {
    method,
    headers: token ? authHeaders(token, prefer) : { ...PUBLIC_HEADERS, ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
}

async function ensureProfile(token, userId, profile) {
  await rest(`profiles?id=eq.${userId}`, {
    token,
    method: 'PATCH',
    body: {
      username: profile.username,
      display_name: profile.displayName,
      bio: profile.bio,
    },
  })
}

async function ensurePost(token, userId, post) {
  const existing = await rest(
    `posts?select=id,dish_name&user_id=eq.${userId}&dish_name=eq.${encodeURIComponent(post.dish_name)}`,
    { token }
  )

  if (existing.length > 0) return existing[0]

  const created = await rest('posts', {
    token,
    method: 'POST',
    body: {
      user_id: userId,
      ...post,
    },
  })

  return created[0]
}

async function ensureSingleRow(token, table, matchQuery, body) {
  const existing = await rest(`${table}?select=id&${matchQuery}`, { token })
  if (existing.length > 0) return existing[0]
  const created = await rest(table, { token, method: 'POST', body })
  return created[0]
}

async function getProfileByUsername(username) {
  const rows = await rest(`profiles?select=id,username,display_name&username=eq.${username}`)
  return rows[0] || null
}

async function getLatestPostForUser(userId) {
  const rows = await rest(`posts?select=id,dish_name,user_id&user_id=eq.${userId}&order=created_at.desc&limit=1`)
  return rows[0] || null
}

async function seed() {
  const seededUsers = []

  for (const profile of demoUsers) {
    const password = profile.password || DEMO_PASSWORD
    const session = await getSession(profile.email, password)
    const token = session.access_token
    const userId = session.user.id

    await ensureProfile(token, userId, profile)

    const posts = []
    for (const post of profile.posts) {
      posts.push(await ensurePost(token, userId, post))
    }

    seededUsers.push({
      ...profile,
      id: userId,
      token,
      posts,
    })
  }

  const [maya, priya, nico, rae] = seededUsers
  const ronok = await getProfileByUsername('ronoktanvir')
  const ronokPost = ronok ? await getLatestPostForUser(ronok.id) : null

  await ensureSingleRow(maya.token, 'follows', `follower_id=eq.${maya.id}&following_id=eq.${priya.id}`, {
    follower_id: maya.id,
    following_id: priya.id,
  })
  await ensureSingleRow(maya.token, 'follows', `follower_id=eq.${maya.id}&following_id=eq.${nico.id}`, {
    follower_id: maya.id,
    following_id: nico.id,
  })
  await ensureSingleRow(priya.token, 'follows', `follower_id=eq.${priya.id}&following_id=eq.${maya.id}`, {
    follower_id: priya.id,
    following_id: maya.id,
  })
  await ensureSingleRow(nico.token, 'follows', `follower_id=eq.${nico.id}&following_id=eq.${maya.id}`, {
    follower_id: nico.id,
    following_id: maya.id,
  })
  await ensureSingleRow(nico.token, 'follows', `follower_id=eq.${nico.id}&following_id=eq.${priya.id}`, {
    follower_id: nico.id,
    following_id: priya.id,
  })
  await ensureSingleRow(rae.token, 'follows', `follower_id=eq.${rae.id}&following_id=eq.${maya.id}`, {
    follower_id: rae.id,
    following_id: maya.id,
  })

  if (ronok) {
    await ensureSingleRow(maya.token, 'follows', `follower_id=eq.${maya.id}&following_id=eq.${ronok.id}`, {
      follower_id: maya.id,
      following_id: ronok.id,
    })
    await ensureSingleRow(priya.token, 'follows', `follower_id=eq.${priya.id}&following_id=eq.${ronok.id}`, {
      follower_id: priya.id,
      following_id: ronok.id,
    })
    await ensureSingleRow(rae.token, 'follows', `follower_id=eq.${rae.id}&following_id=eq.${ronok.id}`, {
      follower_id: rae.id,
      following_id: ronok.id,
    })
  }

  await ensureSingleRow(priya.token, 'likes', `user_id=eq.${priya.id}&post_id=eq.${maya.posts[0].id}`, {
    user_id: priya.id,
    post_id: maya.posts[0].id,
  })
  await ensureSingleRow(nico.token, 'likes', `user_id=eq.${nico.id}&post_id=eq.${maya.posts[0].id}`, {
    user_id: nico.id,
    post_id: maya.posts[0].id,
  })
  await ensureSingleRow(maya.token, 'likes', `user_id=eq.${maya.id}&post_id=eq.${priya.posts[0].id}`, {
    user_id: maya.id,
    post_id: priya.posts[0].id,
  })
  await ensureSingleRow(nico.token, 'likes', `user_id=eq.${nico.id}&post_id=eq.${priya.posts[0].id}`, {
    user_id: nico.id,
    post_id: priya.posts[0].id,
  })
  await ensureSingleRow(maya.token, 'saved_posts', `user_id=eq.${maya.id}&post_id=eq.${nico.posts[0].id}`, {
    user_id: maya.id,
    post_id: nico.posts[0].id,
  })
  await ensureSingleRow(priya.token, 'saved_posts', `user_id=eq.${priya.id}&post_id=eq.${nico.posts[1].id}`, {
    user_id: priya.id,
    post_id: nico.posts[1].id,
  })
  await ensureSingleRow(rae.token, 'likes', `user_id=eq.${rae.id}&post_id=eq.${priya.posts[0].id}`, {
    user_id: rae.id,
    post_id: priya.posts[0].id,
  })

  await ensureSingleRow(priya.token, 'comments', `user_id=eq.${priya.id}&post_id=eq.${maya.posts[0].id}&content=eq.${encodeURIComponent('Love the lemon and parsley combo.')}`, {
    user_id: priya.id,
    post_id: maya.posts[0].id,
    content: 'Love the lemon and parsley combo.',
  })
  await ensureSingleRow(nico.token, 'comments', `user_id=eq.${nico.id}&post_id=eq.${maya.posts[0].id}&content=eq.${encodeURIComponent('This looks like a perfect weeknight dinner.')}`, {
    user_id: nico.id,
    post_id: maya.posts[0].id,
    content: 'This looks like a perfect weeknight dinner.',
  })
  await ensureSingleRow(maya.token, 'comments', `user_id=eq.${maya.id}&post_id=eq.${priya.posts[0].id}&content=eq.${encodeURIComponent('The chickpea curry bowl is going on my meal prep list.')}`, {
    user_id: maya.id,
    post_id: priya.posts[0].id,
    content: 'The chickpea curry bowl is going on my meal prep list.',
  })
  await ensureSingleRow(priya.token, 'comments', `user_id=eq.${priya.id}&post_id=eq.${nico.posts[0].id}&content=eq.${encodeURIComponent('Jammy eggs always win me over.')}`, {
    user_id: priya.id,
    post_id: nico.posts[0].id,
    content: 'Jammy eggs always win me over.',
  })
  await ensureSingleRow(rae.token, 'comments', `user_id=eq.${rae.id}&post_id=eq.${maya.posts[0].id}&content=eq.${encodeURIComponent('The lemony pasta feels like peak weeknight comfort.')}`, {
    user_id: rae.id,
    post_id: maya.posts[0].id,
    content: 'The lemony pasta feels like peak weeknight comfort.',
  })

  if (ronokPost) {
    await ensureSingleRow(maya.token, 'likes', `user_id=eq.${maya.id}&post_id=eq.${ronokPost.id}`, {
      user_id: maya.id,
      post_id: ronokPost.id,
    })
    await ensureSingleRow(priya.token, 'comments', `user_id=eq.${priya.id}&post_id=eq.${ronokPost.id}&content=eq.${encodeURIComponent('Saving this for my next comfort-food weekend.')}`, {
      user_id: priya.id,
      post_id: ronokPost.id,
      content: 'Saving this for my next comfort-food weekend.',
    })
    await ensureSingleRow(rae.token, 'likes', `user_id=eq.${rae.id}&post_id=eq.${ronokPost.id}`, {
      user_id: rae.id,
      post_id: ronokPost.id,
    })
  }

  console.log('Seeded demo users:')
  for (const user of seededUsers) {
    console.log(`- ${user.displayName} (@${user.username})`)
  }
  console.log('')
  console.log('Demo sign-in password:')
  console.log(`- ${DEMO_PASSWORD}`)
  console.log('- Rae Chen uses Monkeymanmeow123$')
}

seed().catch(error => {
  console.error(error)
  process.exit(1)
})

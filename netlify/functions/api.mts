import { getStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'

interface Recipe {
  id: number
  title: string
  description: string
  category: string
  difficulty: string
  cook_time: number
  servings: number
  image_url: string
  ingredients: string[]
  steps: string[]
  tags: string[]
  likes: number
  created_at: string
}

interface StoreData {
  nextId: number
  recipes: Recipe[]
}

const SEED_RECIPES: Recipe[] = [
  {
    id: 1,
    title: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with eggs, cheese, pancetta and pepper.',
    category: 'dinner',
    difficulty: 'Medium',
    cook_time: 25,
    servings: 4,
    image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
    ingredients: ['400g spaghetti', '200g pancetta', '4 eggs', '100g Pecorino Romano', 'Black pepper', 'Salt'],
    steps: ['Boil pasta in salted water.', 'Fry pancetta until crispy.', 'Mix eggs and cheese in a bowl.', 'Combine hot pasta with pancetta off heat.', 'Add egg mixture, toss quickly.', 'Season with black pepper and serve.'],
    tags: ['italian', 'pasta', 'classic'],
    likes: 142,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Avocado Toast',
    description: 'Simple, nutritious breakfast with ripe avocado on sourdough.',
    category: 'breakfast',
    difficulty: 'Easy',
    cook_time: 10,
    servings: 2,
    image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=800',
    ingredients: ['2 slices sourdough', '1 ripe avocado', 'Lemon juice', 'Red pepper flakes', 'Salt', '2 eggs (optional)'],
    steps: ['Toast the bread until golden.', 'Mash avocado with lemon juice and salt.', 'Spread on toast.', 'Top with red pepper flakes.', 'Add a poached egg on top if desired.'],
    tags: ['healthy', 'quick', 'vegetarian'],
    likes: 89,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'Thai Green Curry',
    description: 'Aromatic coconut milk curry with vegetables and your choice of protein.',
    category: 'dinner',
    difficulty: 'Medium',
    cook_time: 35,
    servings: 4,
    image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
    ingredients: ['400ml coconut milk', '2 tbsp green curry paste', '500g chicken breast', '1 zucchini', '1 bell pepper', 'Fish sauce', 'Lime leaves', 'Thai basil', 'Jasmine rice'],
    steps: ['Heat oil in a wok.', 'Fry curry paste for 1 minute.', 'Add coconut milk and bring to simmer.', 'Add chicken and cook through.', 'Add vegetables and cook 5 mins.', 'Season with fish sauce.', 'Serve with jasmine rice.'],
    tags: ['thai', 'spicy', 'curry'],
    likes: 203,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 4,
    title: 'Chocolate Lava Cake',
    description: 'Decadent warm chocolate cake with a molten centre.',
    category: 'dessert',
    difficulty: 'Hard',
    cook_time: 20,
    servings: 4,
    image_url: 'https://images.unsplash.com/photo-1617305855105-0e5f77a5c4e2?w=800',
    ingredients: ['200g dark chocolate', '100g butter', '4 eggs', '100g sugar', '50g flour', 'Cocoa powder for dusting'],
    steps: ['Preheat oven to 200\u00b0C.', 'Melt chocolate and butter together.', 'Whisk eggs and sugar until pale.', 'Fold chocolate into eggs.', 'Add flour and mix gently.', 'Pour into greased ramekins.', 'Bake 12 minutes.', 'Invert onto plate and serve immediately.'],
    tags: ['chocolate', 'dessert', 'french'],
    likes: 317,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 5,
    title: 'Caesar Salad',
    description: 'Crisp romaine lettuce with homemade Caesar dressing and croutons.',
    category: 'lunch',
    difficulty: 'Easy',
    cook_time: 15,
    servings: 2,
    image_url: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=800',
    ingredients: ['1 romaine lettuce', '50g Parmesan', 'Croutons', '2 tbsp Caesar dressing', '1 lemon', 'Black pepper', 'Anchovy fillets'],
    steps: ['Tear lettuce into large pieces.', 'Make dressing with anchovy, lemon, and Parmesan.', 'Toss lettuce with dressing.', 'Top with croutons and shaved Parmesan.', 'Crack black pepper generously.'],
    tags: ['salad', 'classic', 'quick'],
    likes: 76,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 6,
    title: 'Shakshuka',
    description: 'Eggs poached in spiced tomato and pepper sauce \u2014 perfect any time of day.',
    category: 'breakfast',
    difficulty: 'Easy',
    cook_time: 25,
    servings: 2,
    image_url: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800',
    ingredients: ['4 eggs', '400g crushed tomatoes', '1 onion', '2 bell peppers', '3 garlic cloves', '1 tsp cumin', '1 tsp paprika', 'Feta cheese', 'Fresh parsley'],
    steps: ['Saut\u00e9 onion and peppers until soft.', 'Add garlic, cumin and paprika.', 'Add crushed tomatoes and simmer 10 mins.', 'Make wells and crack eggs in.', 'Cover and cook until eggs are set.', 'Top with feta and parsley.'],
    tags: ['middle-eastern', 'eggs', 'vegetarian'],
    likes: 158,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 7,
    title: 'Beef Tacos',
    description: 'Juicy seasoned ground beef in corn tortillas with all the toppings.',
    category: 'dinner',
    difficulty: 'Easy',
    cook_time: 20,
    servings: 4,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    ingredients: ['500g ground beef', '8 corn tortillas', 'Taco seasoning', 'Shredded cheese', 'Sour cream', 'Salsa', 'Avocado', 'Lime'],
    steps: ['Brown beef in a pan.', 'Add taco seasoning and water.', 'Simmer until sauce thickens.', 'Warm tortillas in dry pan.', 'Fill with beef and toppings.', 'Squeeze lime and serve.'],
    tags: ['mexican', 'quick', 'family'],
    likes: 224,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 8,
    title: 'Mango Smoothie Bowl',
    description: 'Thick blended mango base topped with granola, berries and coconut.',
    category: 'breakfast',
    difficulty: 'Easy',
    cook_time: 5,
    servings: 1,
    image_url: 'https://images.unsplash.com/photo-1490323914169-4b1e1c9862be?w=800',
    ingredients: ['2 frozen mangoes', '1/2 banana', '3 tbsp coconut milk', 'Granola', 'Fresh berries', 'Coconut flakes', 'Chia seeds'],
    steps: ['Blend frozen mango and banana with coconut milk.', 'Pour into a bowl.', 'Top with granola, berries and coconut flakes.', 'Sprinkle chia seeds.', 'Serve immediately.'],
    tags: ['healthy', 'vegan', 'no-cook'],
    likes: 91,
    created_at: '2025-01-01T00:00:00Z',
  },
]

function getRecipeStore() {
  return getStore({ name: 'recipes', consistency: 'strong' })
}

async function getData(): Promise<StoreData> {
  const store = getRecipeStore()
  const data = await store.get('data', { type: 'json' }) as StoreData | null
  if (!data) {
    const seeded: StoreData = { nextId: 9, recipes: SEED_RECIPES }
    await store.setJSON('data', seeded)
    return seeded
  }
  return data
}

async function saveData(data: StoreData): Promise<void> {
  const store = getRecipeStore()
  await store.setJSON('data', data)
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  try {
    // GET /api/categories
    if (path === '/api/categories') {
      return Response.json(['all', 'breakfast', 'lunch', 'dinner', 'dessert'])
    }

    // GET /api/health
    if (path === '/api/health') {
      return Response.json({ status: 'ok', message: 'RecipeVault API running' })
    }

    // POST /api/recipes/:id/like
    const likeMatch = path.match(/^\/api\/recipes\/(\d+)\/like$/)
    if (likeMatch && method === 'POST') {
      const id = parseInt(likeMatch[1])
      const data = await getData()
      const recipe = data.recipes.find((r) => r.id === id)
      if (!recipe) {
        return Response.json({ detail: 'Recipe not found' }, { status: 404 })
      }
      recipe.likes += 1
      await saveData(data)
      return Response.json({ likes: recipe.likes })
    }

    // GET/DELETE /api/recipes/:id
    const detailMatch = path.match(/^\/api\/recipes\/(\d+)$/)
    if (detailMatch) {
      const id = parseInt(detailMatch[1])
      const data = await getData()

      if (method === 'DELETE') {
        data.recipes = data.recipes.filter((r) => r.id !== id)
        await saveData(data)
        return Response.json({ message: 'Deleted' })
      }

      const recipe = data.recipes.find((r) => r.id === id)
      if (!recipe) {
        return Response.json({ detail: 'Recipe not found' }, { status: 404 })
      }
      return Response.json(recipe)
    }

    // GET/POST /api/recipes
    if (path === '/api/recipes') {
      if (method === 'POST') {
        const body = await req.json()
        const data = await getData()
        const newRecipe: Recipe = {
          id: data.nextId,
          title: body.title,
          description: body.description || '',
          category: body.category,
          difficulty: body.difficulty || 'Easy',
          cook_time: body.cook_time || 30,
          servings: body.servings || 4,
          image_url: body.image_url || '',
          ingredients: body.ingredients || [],
          steps: body.steps || [],
          tags: body.tags || [],
          likes: 0,
          created_at: new Date().toISOString(),
        }
        data.recipes.push(newRecipe)
        data.nextId += 1
        await saveData(data)
        return Response.json({ id: newRecipe.id, message: 'Recipe created!' }, { status: 201 })
      }

      // GET — list with optional filters
      const data = await getData()
      let recipes = [...data.recipes]

      const category = url.searchParams.get('category')
      if (category && category !== 'all') {
        recipes = recipes.filter((r) => r.category === category)
      }

      const difficulty = url.searchParams.get('difficulty')
      if (difficulty) {
        recipes = recipes.filter((r) => r.difficulty === difficulty)
      }

      const search = url.searchParams.get('search')
      if (search) {
        const s = search.toLowerCase()
        recipes = recipes.filter(
          (r) =>
            r.title.toLowerCase().includes(s) ||
            r.description.toLowerCase().includes(s) ||
            r.tags.some((t) => t.toLowerCase().includes(s)),
        )
      }

      recipes.sort((a, b) => b.likes - a.likes)

      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 100)
      recipes = recipes.slice(0, limit)

      return Response.json(recipes)
    }

    return Response.json({ detail: 'Not Found' }, { status: 404 })
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

export const config: Config = {
  path: ['/api/health', '/api/recipes', '/api/recipes/:id', '/api/recipes/:id/like', '/api/categories'],
}

const BASE = '/api'

export const api = {
  getRecipes: (params = {}) => {
    const q = new URLSearchParams()
    if (params.category && params.category !== 'all') q.set('category', params.category)
    if (params.search) q.set('search', params.search)
    if (params.difficulty) q.set('difficulty', params.difficulty)
    return fetch(`${BASE}/recipes?${q}`).then(r => r.json())
  },
  getRecipe: (id) => fetch(`${BASE}/recipes/${id}`).then(r => r.json()),
  createRecipe: (data) => fetch(`${BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  likeRecipe: (id) => fetch(`${BASE}/recipes/${id}/like`, { method: 'POST' }).then(r => r.json()),
  deleteRecipe: (id) => fetch(`${BASE}/recipes/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getCategories: () => fetch(`${BASE}/categories`).then(r => r.json()),
}

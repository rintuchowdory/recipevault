import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Clock, Users, ChefHat, Heart, Plus, X,
  ArrowLeft, Flame, Leaf, Coffee, Moon, Sun, Trash2
} from 'lucide-react'
import { api } from './api.js'

// ── Difficulty badge ──────────────────────────────────────────────────────────
const difficultyColor = {
  Easy: 'bg-sage/20 text-sage',
  Medium: 'bg-gold/20 text-amber-700',
  Hard: 'bg-spice/20 text-spice',
}

const categoryIcon = {
  breakfast: <Coffee size={14} />,
  lunch: <Sun size={14} />,
  dinner: <Moon size={14} />,
  dessert: <Flame size={14} />,
  all: <Leaf size={14} />,
}

// ── Recipe Card ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onClick, onLike, onDelete }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(recipe.likes)

  const handleLike = async (e) => {
    e.stopPropagation()
    if (liked) return
    setLiked(true)
    const res = await onLike(recipe.id)
    setLikes(res.likes)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (confirm(`Delete "${recipe.title}"?`)) onDelete(recipe.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="recipe-card bg-white rounded-2xl overflow-hidden cursor-pointer border border-bark/10"
      onClick={() => onClick(recipe)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-bark/10">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
        )}
        {/* Category pill */}
        <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-bark backdrop-blur-sm">
          {categoryIcon[recipe.category]} {recipe.category}
        </span>
        {/* Delete */}
        <button onClick={handleDelete}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-spice hover:text-white transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-bark line-clamp-1">
            {recipe.title}
          </h3>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[recipe.difficulty] || 'bg-gray-100 text-gray-600'}`}>
            {recipe.difficulty}
          </span>
        </div>

        <p className="text-bark/60 text-sm line-clamp-2">{recipe.description}</p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-bark/50">
            <span className="flex items-center gap-1"><Clock size={12} /> {recipe.cook_time}m</span>
            <span className="flex items-center gap-1"><Users size={12} /> {recipe.servings}</span>
          </div>
          <button onClick={handleLike}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full transition-all
              ${liked ? 'bg-spice text-white' : 'bg-spice/10 text-spice hover:bg-spice/20'}`}>
            <Heart size={12} className={liked ? 'fill-current' : ''} /> {likes}
          </button>
        </div>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-bark/50 border border-bark/10">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Recipe Detail Modal ───────────────────────────────────────────────────────
function RecipeDetail({ recipe, onClose, onLike }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(recipe.likes)

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    const res = await onLike(recipe.id)
    setLikes(res.likes)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-bark/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-cream rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative h-64">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover rounded-t-3xl" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl bg-bark/10 rounded-t-3xl">🍽️</div>
          )}
          <button onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-3xl font-bold text-bark">{recipe.title}</h2>
              <button onClick={handleLike}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-medium transition-all
                  ${liked ? 'bg-spice text-white' : 'bg-spice/10 text-spice hover:bg-spice hover:text-white'}`}>
                <Heart size={16} className={liked ? 'fill-current' : ''} /> {likes}
              </button>
            </div>
            <p className="text-bark/60">{recipe.description}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Clock size={18} />, label: 'Cook time', value: `${recipe.cook_time} min` },
              { icon: <Users size={18} />, label: 'Servings', value: recipe.servings },
              { icon: <ChefHat size={18} />, label: 'Difficulty', value: recipe.difficulty },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl p-3 text-center">
                <div className="flex justify-center text-spice mb-1">{m.icon}</div>
                <div className="text-xs text-bark/50">{m.label}</div>
                <div className="font-semibold text-bark text-sm">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="font-display text-xl font-bold text-bark mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-bark/80">
                  <span className="w-5 h-5 rounded-full bg-spice/10 text-spice flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h3 className="font-display text-xl font-bold text-bark mb-3">Instructions</h3>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-spice text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-bark/80 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tags */}
          {recipe.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white border border-bark/10 text-bark/60">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Add Recipe Modal ──────────────────────────────────────────────────────────
function AddRecipeModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'dinner',
    difficulty: 'Easy', cook_time: 30, servings: 4,
    image_url: '', ingredientsRaw: '', stepsRaw: '', tagsRaw: '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title || !form.ingredientsRaw || !form.stepsRaw) {
      alert('Title, ingredients and steps are required!')
      return
    }
    setLoading(true)
    const payload = {
      title: form.title, description: form.description,
      category: form.category, difficulty: form.difficulty,
      cook_time: Number(form.cook_time), servings: Number(form.servings),
      image_url: form.image_url,
      ingredients: form.ingredientsRaw.split('\n').map(s => s.trim()).filter(Boolean),
      steps: form.stepsRaw.split('\n').map(s => s.trim()).filter(Boolean),
      tags: form.tagsRaw.split(',').map(s => s.trim()).filter(Boolean),
    }
    await onAdd(payload)
    setLoading(false)
    onClose()
  }

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-white border border-bark/15 text-bark text-sm focus:outline-none focus:ring-2 focus:ring-spice/40"
  const labelClass = "block text-xs font-semibold text-bark/60 mb-1 uppercase tracking-wide"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-bark/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-cream rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-bark">Add Recipe</h2>
            <button onClick={onClose} className="p-2 hover:bg-bark/10 rounded-full transition-all"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Title *</label>
              <input className={inputClass} placeholder="e.g. Mushroom Risotto"
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Description</label>
              <input className={inputClass} placeholder="Short description..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
                {['breakfast','lunch','dinner','dessert'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Difficulty</label>
              <select className={inputClass} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                {['Easy','Medium','Hard'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cook time (min)</label>
              <input type="number" className={inputClass} value={form.cook_time}
                onChange={e => set('cook_time', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Servings</label>
              <input type="number" className={inputClass} value={form.servings}
                onChange={e => set('servings', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Image URL</label>
              <input className={inputClass} placeholder="https://..."
                value={form.image_url} onChange={e => set('image_url', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Ingredients * (one per line)</label>
              <textarea className={`${inputClass} h-28 resize-none`}
                placeholder={"200g pasta\n2 eggs\n..."}
                value={form.ingredientsRaw} onChange={e => set('ingredientsRaw', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Steps * (one per line)</label>
              <textarea className={`${inputClass} h-28 resize-none`}
                placeholder={"Boil water.\nCook pasta until al dente.\n..."}
                value={form.stepsRaw} onChange={e => set('stepsRaw', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Tags (comma separated)</label>
              <input className={inputClass} placeholder="italian, pasta, quick"
                value={form.tagsRaw} onChange={e => set('tagsRaw', e.target.value)} />
            </div>
          </div>

          <button onClick={submit} disabled={loading}
            className="w-full py-3 bg-spice text-white rounded-xl font-semibold hover:bg-spice/90 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'Saving…' : '🍳 Add Recipe'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [recipes, setRecipes]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('all')
  const [difficulty, setDifficulty] = useState('')
  const [selected, setSelected]     = useState(null)
  const [showAdd, setShowAdd]       = useState(false)
  const categories = ['all','breakfast','lunch','dinner','dessert']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getRecipes({ category, search, difficulty })
      setRecipes(data)
    } catch {
      console.error('API not available — is the backend running?')
      setRecipes([])
    }
    setLoading(false)
  }, [category, search, difficulty])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const handleAdd = async (data) => {
    await api.createRecipe(data)
    load()
  }

  const handleDelete = async (id) => {
    await api.deleteRecipe(id)
    setSelected(null)
    load()
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-bark/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <h1 className="font-display text-2xl font-bold text-bark">RecipeVault</h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark/40" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-bark/15 text-sm text-bark placeholder-bark/40 focus:outline-none focus:ring-2 focus:ring-spice/40"
              placeholder="Search recipes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-spice text-white rounded-xl text-sm font-semibold hover:bg-spice/90 active:scale-95 transition-all">
            <Plus size={16} /> Add Recipe
          </button>
        </div>

        {/* Category tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${category === cat
                  ? 'bg-spice text-white shadow-sm'
                  : 'bg-white border border-bark/10 text-bark/60 hover:border-spice/40'}`}>
              {categoryIcon[cat]}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}

          {/* Difficulty filter */}
          <select
            className="ml-auto px-3 py-1.5 rounded-full text-sm border border-bark/10 bg-white text-bark/60 focus:outline-none"
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
          >
            <option value="">All levels</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </header>

      {/* ── Hero ── */}
      {category === 'all' && !search && (
        <div className="bg-bark text-cream py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold mb-2">
              Cook something <em>delicious</em> today.
            </motion.h2>
            <p className="text-cream/60 text-lg">{recipes.length} recipes ready to make.</p>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-24 text-bark/40">
            <div className="text-6xl mb-4">🫙</div>
            <p className="font-display text-2xl">No recipes found</p>
            <p className="text-sm mt-1">Try a different search or add your own!</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {recipes.map(r => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onClick={setSelected}
                  onLike={api.likeRecipe}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {selected && (
          <RecipeDetail
            recipe={selected}
            onClose={() => setSelected(null)}
            onLike={api.likeRecipe}
          />
        )}
        {showAdd && (
          <AddRecipeModal
            onClose={() => setShowAdd(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-bark/10 py-6 text-center text-bark/30 text-xs">
        RecipeVault — Built with React + FastAPI + Docker 🐳
      </footer>
    </div>
  )
}

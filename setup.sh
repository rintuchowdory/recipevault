#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  RecipeVault — one-shot bootstrap                       ║
# ║  Usage: bash setup.sh                                   ║
# ╚══════════════════════════════════════════════════════════╝
set -e

PROJECT="recipevault"
echo "🍳  Creating RecipeVault project..."
mkdir -p "$PROJECT"/{backend,frontend}
cd "$PROJECT"

# ── .dockerignore ─────────────────────────────────────────────────────────────
cat > .dockerignore << 'EOF'
node_modules/
dist/
.git/
.env
*.log
__pycache__/
*.pyc
*.db
EOF

# ── docker-compose.yml ────────────────────────────────────────────────────────
cat > docker-compose.yml << 'EOF'
version: '3.9'
services:
  backend:
    build: { context: ./backend, dockerfile: Dockerfile }
    container_name: recipevault-backend
    restart: unless-stopped
    volumes: [recipe-data:/data]
    environment: [PYTHONUNBUFFERED=1]
    networks: [app-network]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  frontend:
    build: { context: ./frontend, dockerfile: Dockerfile }
    container_name: recipevault-frontend
    restart: unless-stopped
    ports: ["3000:80"]
    depends_on: [backend]
    networks: [app-network]
volumes:
  recipe-data:
networks:
  app-network:
    driver: bridge
EOF

# ── backend/requirements.txt ──────────────────────────────────────────────────
cat > backend/requirements.txt << 'EOF'
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
EOF

# ── backend/Dockerfile ────────────────────────────────────────────────────────
cat > backend/Dockerfile << 'EOF'
FROM python:3.12-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
RUN mkdir -p /data
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# ── backend/main.py ───────────────────────────────────────────────────────────
cat > backend/main.py << 'PYEOF'
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3, json, os

app = FastAPI(title="RecipeVault API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB_PATH = "/data/recipes.db"

def get_db():
    os.makedirs("/data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL, description TEXT, category TEXT NOT NULL,
        difficulty TEXT DEFAULT 'Easy', cook_time INTEGER DEFAULT 30,
        servings INTEGER DEFAULT 4, image_url TEXT,
        ingredients TEXT NOT NULL, steps TEXT NOT NULL,
        tags TEXT DEFAULT '[]', likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    conn.commit()
    count = conn.execute("SELECT COUNT(*) FROM recipes").fetchone()[0]
    if count == 0:
        seeds = [
            {"title":"Spaghetti Carbonara","description":"Classic Roman pasta with eggs, cheese and pancetta.","category":"dinner","difficulty":"Medium","cook_time":25,"servings":4,"image_url":"https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800","ingredients":json.dumps(["400g spaghetti","200g pancetta","4 eggs","100g Pecorino Romano","Black pepper","Salt"]),"steps":json.dumps(["Boil pasta in salted water.","Fry pancetta until crispy.","Mix eggs and cheese in a bowl.","Combine hot pasta with pancetta off heat.","Add egg mixture, toss quickly.","Season with black pepper and serve."]),"tags":json.dumps(["italian","pasta","classic"]),"likes":142},
            {"title":"Avocado Toast","description":"Simple nutritious breakfast with ripe avocado on sourdough.","category":"breakfast","difficulty":"Easy","cook_time":10,"servings":2,"image_url":"https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=800","ingredients":json.dumps(["2 slices sourdough","1 ripe avocado","Lemon juice","Red pepper flakes","Salt"]),"steps":json.dumps(["Toast the bread until golden.","Mash avocado with lemon juice and salt.","Spread on toast.","Top with red pepper flakes."]),"tags":json.dumps(["healthy","quick","vegetarian"]),"likes":89},
            {"title":"Thai Green Curry","description":"Aromatic coconut milk curry with vegetables and chicken.","category":"dinner","difficulty":"Medium","cook_time":35,"servings":4,"image_url":"https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800","ingredients":json.dumps(["400ml coconut milk","2 tbsp green curry paste","500g chicken breast","1 zucchini","1 bell pepper","Fish sauce","Jasmine rice"]),"steps":json.dumps(["Heat oil in a wok.","Fry curry paste for 1 minute.","Add coconut milk and bring to simmer.","Add chicken and cook through.","Add vegetables and cook 5 mins.","Season with fish sauce.","Serve with jasmine rice."]),"tags":json.dumps(["thai","spicy","curry"]),"likes":203},
            {"title":"Chocolate Lava Cake","description":"Decadent warm chocolate cake with a molten centre.","category":"dessert","difficulty":"Hard","cook_time":20,"servings":4,"image_url":"https://images.unsplash.com/photo-1617305855105-0e5f77a5c4e2?w=800","ingredients":json.dumps(["200g dark chocolate","100g butter","4 eggs","100g sugar","50g flour"]),"steps":json.dumps(["Preheat oven to 200C.","Melt chocolate and butter.","Whisk eggs and sugar until pale.","Fold chocolate into eggs.","Add flour and mix.","Pour into greased ramekins.","Bake 12 minutes.","Serve immediately."]),"tags":json.dumps(["chocolate","dessert","french"]),"likes":317},
            {"title":"Shakshuka","description":"Eggs poached in spiced tomato sauce — perfect any time of day.","category":"breakfast","difficulty":"Easy","cook_time":25,"servings":2,"image_url":"https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800","ingredients":json.dumps(["4 eggs","400g crushed tomatoes","1 onion","2 bell peppers","3 garlic cloves","1 tsp cumin","1 tsp paprika","Feta cheese"]),"steps":json.dumps(["Saute onion and peppers until soft.","Add garlic, cumin and paprika.","Add crushed tomatoes and simmer 10 mins.","Make wells and crack eggs in.","Cover and cook until eggs are set.","Top with feta and parsley."]),"tags":json.dumps(["middle-eastern","eggs","vegetarian"]),"likes":158},
            {"title":"Beef Tacos","description":"Juicy seasoned ground beef in corn tortillas with all the toppings.","category":"dinner","difficulty":"Easy","cook_time":20,"servings":4,"image_url":"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800","ingredients":json.dumps(["500g ground beef","8 corn tortillas","Taco seasoning","Shredded cheese","Sour cream","Salsa","Avocado"]),"steps":json.dumps(["Brown beef in a pan.","Add taco seasoning and water.","Simmer until sauce thickens.","Warm tortillas.","Fill with beef and toppings.","Squeeze lime and serve."]),"tags":json.dumps(["mexican","quick","family"]),"likes":224},
        ]
        for r in seeds:
            conn.execute("INSERT INTO recipes (title,description,category,difficulty,cook_time,servings,image_url,ingredients,steps,tags,likes) VALUES (:title,:description,:category,:difficulty,:cook_time,:servings,:image_url,:ingredients,:steps,:tags,:likes)", r)
        conn.commit()
    conn.close()

init_db()

class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str
    difficulty: Optional[str] = "Easy"
    cook_time: Optional[int] = 30
    servings: Optional[int] = 4
    image_url: Optional[str] = ""
    ingredients: List[str]
    steps: List[str]
    tags: Optional[List[str]] = []

@app.get("/api/health")
def health(): return {"status":"ok"}

@app.get("/api/recipes")
def get_recipes(category: Optional[str]=None, search: Optional[str]=None, difficulty: Optional[str]=None, limit: int=Query(default=50,le=100)):
    conn = get_db()
    q = "SELECT * FROM recipes WHERE 1=1"; p = []
    if category and category != "all": q += " AND category=?"; p.append(category)
    if difficulty: q += " AND difficulty=?"; p.append(difficulty)
    if search: q += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)"; s=f"%{search}%"; p.extend([s,s,s])
    q += " ORDER BY likes DESC LIMIT ?"; p.append(limit)
    rows = conn.execute(q, p).fetchall(); conn.close()
    result = []
    for row in rows:
        r = dict(row); r["ingredients"]=json.loads(r["ingredients"]); r["steps"]=json.loads(r["steps"]); r["tags"]=json.loads(r["tags"]); result.append(r)
    return result

@app.get("/api/recipes/{recipe_id}")
def get_recipe(recipe_id: int):
    conn = get_db(); row = conn.execute("SELECT * FROM recipes WHERE id=?", (recipe_id,)).fetchone(); conn.close()
    if not row: raise HTTPException(status_code=404, detail="Not found")
    r = dict(row); r["ingredients"]=json.loads(r["ingredients"]); r["steps"]=json.loads(r["steps"]); r["tags"]=json.loads(r["tags"]); return r

@app.post("/api/recipes", status_code=201)
def create_recipe(recipe: RecipeCreate):
    conn = get_db()
    cur = conn.execute("INSERT INTO recipes (title,description,category,difficulty,cook_time,servings,image_url,ingredients,steps,tags) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (recipe.title,recipe.description,recipe.category,recipe.difficulty,recipe.cook_time,recipe.servings,recipe.image_url,json.dumps(recipe.ingredients),json.dumps(recipe.steps),json.dumps(recipe.tags)))
    conn.commit(); new_id=cur.lastrowid; conn.close(); return {"id":new_id,"message":"Created!"}

@app.post("/api/recipes/{recipe_id}/like")
def like_recipe(recipe_id: int):
    conn = get_db(); conn.execute("UPDATE recipes SET likes=likes+1 WHERE id=?", (recipe_id,)); conn.commit()
    row = conn.execute("SELECT likes FROM recipes WHERE id=?", (recipe_id,)).fetchone(); conn.close()
    if not row: raise HTTPException(status_code=404, detail="Not found")
    return {"likes":row["likes"]}

@app.delete("/api/recipes/{recipe_id}")
def delete_recipe(recipe_id: int):
    conn = get_db(); conn.execute("DELETE FROM recipes WHERE id=?", (recipe_id,)); conn.commit(); conn.close(); return {"message":"Deleted"}

@app.get("/api/categories")
def get_categories(): return ["all","breakfast","lunch","dinner","dessert"]
PYEOF

# ── frontend/package.json ─────────────────────────────────────────────────────
cat > frontend/package.json << 'EOF'
{
  "name": "recipevault-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
EOF

# ── frontend/vite.config.js ───────────────────────────────────────────────────
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } },
})
EOF

# ── frontend/tailwind.config.js ───────────────────────────────────────────────
cat > frontend/tailwind.config.js << 'EOF'
export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: { extend: {
    fontFamily: { display: ["'Playfair Display'","serif"], body: ["'DM Sans'","sans-serif"] },
    colors: { cream:"#FDF8F0", bark:"#3D2B1F", spice:"#C84B31", sage:"#5A7A5A", gold:"#E8A838" }
  }},
  plugins: [],
}
EOF

# ── frontend/postcss.config.js ────────────────────────────────────────────────
cat > frontend/postcss.config.js << 'EOF'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
EOF

# ── frontend/index.html ───────────────────────────────────────────────────────
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RecipeVault 🍳</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# ── frontend/nginx.conf ───────────────────────────────────────────────────────
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# ── frontend/Dockerfile ───────────────────────────────────────────────────────
cat > frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# ── frontend/src files ────────────────────────────────────────────────────────
mkdir -p frontend/src

cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
EOF

cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  body { background-color: #FDF8F0; color: #3D2B1F; font-family: 'DM Sans', sans-serif; }
  h1, h2, h3 { font-family: 'Playfair Display', serif; }
}
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #C84B31; border-radius: 3px; }
.recipe-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
.recipe-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(61,43,31,0.15); }
EOF

cat > frontend/src/api.js << 'EOF'
const BASE = '/api'
export const api = {
  getRecipes: (params={}) => { const q=new URLSearchParams(); if(params.category&&params.category!=='all')q.set('category',params.category); if(params.search)q.set('search',params.search); if(params.difficulty)q.set('difficulty',params.difficulty); return fetch(`${BASE}/recipes?${q}`).then(r=>r.json()) },
  getRecipe: (id) => fetch(`${BASE}/recipes/${id}`).then(r=>r.json()),
  createRecipe: (data) => fetch(`${BASE}/recipes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()),
  likeRecipe: (id) => fetch(`${BASE}/recipes/${id}/like`,{method:'POST'}).then(r=>r.json()),
  deleteRecipe: (id) => fetch(`${BASE}/recipes/${id}`,{method:'DELETE'}).then(r=>r.json()),
}
EOF

# Copy the full App.jsx (it's long so we write it inline)
# NOTE: After running this script, the App.jsx is the main UI file.
# Download it separately from the zip or copy from the Claude output.
echo "⚠️  Copy App.jsx manually from the provided zip file into frontend/src/App.jsx"

echo ""
echo "✅  RecipeVault project created!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next steps:"
echo ""
echo "  1. Copy App.jsx into frontend/src/"
echo "  2. Install Docker Desktop or Docker Engine"
echo "  3. Run:"
echo ""
echo "     cd recipevault"
echo "     docker compose up --build"
echo ""
echo "  4. Open http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

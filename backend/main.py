from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import json
import os

app = FastAPI(title="RecipeVault API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/data/recipes.db"

# ── DB setup ──────────────────────────────────────────────────────────────────
def get_db():
    os.makedirs("/data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            difficulty TEXT DEFAULT 'Easy',
            cook_time INTEGER DEFAULT 30,
            servings INTEGER DEFAULT 4,
            image_url TEXT,
            ingredients TEXT NOT NULL,
            steps TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Seed data if empty
    count = conn.execute("SELECT COUNT(*) FROM recipes").fetchone()[0]
    if count == 0:
        seed_recipes = [
            {
                "title": "Spaghetti Carbonara",
                "description": "Classic Roman pasta with eggs, cheese, pancetta and pepper.",
                "category": "dinner",
                "difficulty": "Medium",
                "cook_time": 25,
                "servings": 4,
                "image_url": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
                "ingredients": json.dumps(["400g spaghetti", "200g pancetta", "4 eggs", "100g Pecorino Romano", "Black pepper", "Salt"]),
                "steps": json.dumps(["Boil pasta in salted water.", "Fry pancetta until crispy.", "Mix eggs and cheese in a bowl.", "Combine hot pasta with pancetta off heat.", "Add egg mixture, toss quickly.", "Season with black pepper and serve."]),
                "tags": json.dumps(["italian", "pasta", "classic"]),
                "likes": 142,
            },
            {
                "title": "Avocado Toast",
                "description": "Simple, nutritious breakfast with ripe avocado on sourdough.",
                "category": "breakfast",
                "difficulty": "Easy",
                "cook_time": 10,
                "servings": 2,
                "image_url": "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=800",
                "ingredients": json.dumps(["2 slices sourdough", "1 ripe avocado", "Lemon juice", "Red pepper flakes", "Salt", "2 eggs (optional)"]),
                "steps": json.dumps(["Toast the bread until golden.", "Mash avocado with lemon juice and salt.", "Spread on toast.", "Top with red pepper flakes.", "Add a poached egg on top if desired."]),
                "tags": json.dumps(["healthy", "quick", "vegetarian"]),
                "likes": 89,
            },
            {
                "title": "Thai Green Curry",
                "description": "Aromatic coconut milk curry with vegetables and your choice of protein.",
                "category": "dinner",
                "difficulty": "Medium",
                "cook_time": 35,
                "servings": 4,
                "image_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
                "ingredients": json.dumps(["400ml coconut milk", "2 tbsp green curry paste", "500g chicken breast", "1 zucchini", "1 bell pepper", "Fish sauce", "Lime leaves", "Thai basil", "Jasmine rice"]),
                "steps": json.dumps(["Heat oil in a wok.", "Fry curry paste for 1 minute.", "Add coconut milk and bring to simmer.", "Add chicken and cook through.", "Add vegetables and cook 5 mins.", "Season with fish sauce.", "Serve with jasmine rice."]),
                "tags": json.dumps(["thai", "spicy", "curry"]),
                "likes": 203,
            },
            {
                "title": "Chocolate Lava Cake",
                "description": "Decadent warm chocolate cake with a molten centre.",
                "category": "dessert",
                "difficulty": "Hard",
                "cook_time": 20,
                "servings": 4,
                "image_url": "https://images.unsplash.com/photo-1617305855105-0e5f77a5c4e2?w=800",
                "ingredients": json.dumps(["200g dark chocolate", "100g butter", "4 eggs", "100g sugar", "50g flour", "Cocoa powder for dusting"]),
                "steps": json.dumps(["Preheat oven to 200°C.", "Melt chocolate and butter together.", "Whisk eggs and sugar until pale.", "Fold chocolate into eggs.", "Add flour and mix gently.", "Pour into greased ramekins.", "Bake 12 minutes.", "Invert onto plate and serve immediately."]),
                "tags": json.dumps(["chocolate", "dessert", "french"]),
                "likes": 317,
            },
            {
                "title": "Caesar Salad",
                "description": "Crisp romaine lettuce with homemade Caesar dressing and croutons.",
                "category": "lunch",
                "difficulty": "Easy",
                "cook_time": 15,
                "servings": 2,
                "image_url": "https://images.unsplash.com/photo-1512852939750-1305098529bf?w=800",
                "ingredients": json.dumps(["1 romaine lettuce", "50g Parmesan", "Croutons", "2 tbsp Caesar dressing", "1 lemon", "Black pepper", "Anchovy fillets"]),
                "steps": json.dumps(["Tear lettuce into large pieces.", "Make dressing with anchovy, lemon, and Parmesan.", "Toss lettuce with dressing.", "Top with croutons and shaved Parmesan.", "Crack black pepper generously."]),
                "tags": json.dumps(["salad", "classic", "quick"]),
                "likes": 76,
            },
            {
                "title": "Shakshuka",
                "description": "Eggs poached in spiced tomato and pepper sauce — perfect any time of day.",
                "category": "breakfast",
                "difficulty": "Easy",
                "cook_time": 25,
                "servings": 2,
                "image_url": "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800",
                "ingredients": json.dumps(["4 eggs", "400g crushed tomatoes", "1 onion", "2 bell peppers", "3 garlic cloves", "1 tsp cumin", "1 tsp paprika", "Feta cheese", "Fresh parsley"]),
                "steps": json.dumps(["Sauté onion and peppers until soft.", "Add garlic, cumin and paprika.", "Add crushed tomatoes and simmer 10 mins.", "Make wells and crack eggs in.", "Cover and cook until eggs are set.", "Top with feta and parsley."]),
                "tags": json.dumps(["middle-eastern", "eggs", "vegetarian"]),
                "likes": 158,
            },
            {
                "title": "Beef Tacos",
                "description": "Juicy seasoned ground beef in corn tortillas with all the toppings.",
                "category": "dinner",
                "difficulty": "Easy",
                "cook_time": 20,
                "servings": 4,
                "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
                "ingredients": json.dumps(["500g ground beef", "8 corn tortillas", "Taco seasoning", "Shredded cheese", "Sour cream", "Salsa", "Avocado", "Lime"]),
                "steps": json.dumps(["Brown beef in a pan.", "Add taco seasoning and water.", "Simmer until sauce thickens.", "Warm tortillas in dry pan.", "Fill with beef and toppings.", "Squeeze lime and serve."]),
                "tags": json.dumps(["mexican", "quick", "family"]),
                "likes": 224,
            },
            {
                "title": "Mango Smoothie Bowl",
                "description": "Thick blended mango base topped with granola, berries and coconut.",
                "category": "breakfast",
                "difficulty": "Easy",
                "cook_time": 5,
                "servings": 1,
                "image_url": "https://images.unsplash.com/photo-1490323914169-4b1e1c9862be?w=800",
                "ingredients": json.dumps(["2 frozen mangoes", "1/2 banana", "3 tbsp coconut milk", "Granola", "Fresh berries", "Coconut flakes", "Chia seeds"]),
                "steps": json.dumps(["Blend frozen mango and banana with coconut milk.", "Pour into a bowl.", "Top with granola, berries and coconut flakes.", "Sprinkle chia seeds.", "Serve immediately."]),
                "tags": json.dumps(["healthy", "vegan", "no-cook"]),
                "likes": 91,
            },
        ]
        for r in seed_recipes:
            conn.execute("""
                INSERT INTO recipes (title, description, category, difficulty, cook_time,
                    servings, image_url, ingredients, steps, tags, likes)
                VALUES (:title, :description, :category, :difficulty, :cook_time,
                    :servings, :image_url, :ingredients, :steps, :tags, :likes)
            """, r)
        conn.commit()
    conn.close()

init_db()

# ── Models ────────────────────────────────────────────────────────────────────
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

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "message": "RecipeVault API running 🍳"}

@app.get("/api/recipes")
def get_recipes(
    category: Optional[str] = None,
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = Query(default=50, le=100),
):
    conn = get_db()
    query = "SELECT * FROM recipes WHERE 1=1"
    params = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    if difficulty:
        query += " AND difficulty = ?"
        params.append(difficulty)
    if search:
        query += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])

    query += " ORDER BY likes DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    result = []
    for row in rows:
        r = dict(row)
        r["ingredients"] = json.loads(r["ingredients"])
        r["steps"] = json.loads(r["steps"])
        r["tags"] = json.loads(r["tags"])
        result.append(r)
    return result

@app.get("/api/recipes/{recipe_id}")
def get_recipe(recipe_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Recipe not found")
    r = dict(row)
    r["ingredients"] = json.loads(r["ingredients"])
    r["steps"] = json.loads(r["steps"])
    r["tags"] = json.loads(r["tags"])
    return r

@app.post("/api/recipes", status_code=201)
def create_recipe(recipe: RecipeCreate):
    conn = get_db()
    cur = conn.execute("""
        INSERT INTO recipes (title, description, category, difficulty, cook_time,
            servings, image_url, ingredients, steps, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        recipe.title, recipe.description, recipe.category, recipe.difficulty,
        recipe.cook_time, recipe.servings, recipe.image_url,
        json.dumps(recipe.ingredients), json.dumps(recipe.steps),
        json.dumps(recipe.tags),
    ))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "message": "Recipe created!"}

@app.post("/api/recipes/{recipe_id}/like")
def like_recipe(recipe_id: int):
    conn = get_db()
    conn.execute("UPDATE recipes SET likes = likes + 1 WHERE id = ?", (recipe_id,))
    conn.commit()
    row = conn.execute("SELECT likes FROM recipes WHERE id = ?", (recipe_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"likes": row["likes"]}

@app.delete("/api/recipes/{recipe_id}")
def delete_recipe(recipe_id: int):
    conn = get_db()
    conn.execute("DELETE FROM recipes WHERE id = ?", (recipe_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@app.get("/api/categories")
def get_categories():
    return ["all", "breakfast", "lunch", "dinner", "dessert"]

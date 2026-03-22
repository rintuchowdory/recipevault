// localStorage-based storage — no backend needed!
const STORAGE_KEY = 'recipevault_recipes'

const SEED_RECIPES = [
  { id:1, title:'Spaghetti Carbonara', category:'dinner', difficulty:'Medium', time_minutes:30, servings:4, likes:312, description:'Classic Roman pasta with eggs, cheese, pancetta and black pepper.', image_url:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', ingredients:['400g spaghetti','200g pancetta','4 eggs','100g Pecorino Romano','Black pepper'], steps:['Boil pasta','Fry pancetta','Mix eggs and cheese','Combine off heat'], tags:['italian','pasta','quick'] },
  { id:2, title:'Beef Tacos', category:'dinner', difficulty:'Easy', time_minutes:20, servings:4, likes:224, description:'Juicy seasoned ground beef in corn tortillas with all the toppings.', image_url:'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400', ingredients:['500g ground beef','8 corn tortillas','Cumin','Chili powder','Lettuce','Tomato','Cheese'], steps:['Brown the beef','Season with spices','Warm tortillas','Assemble with toppings'], tags:['mexican','quick','family'] },
  { id:3, title:'Thai Green Curry', category:'dinner', difficulty:'Medium', time_minutes:35, servings:4, likes:203, description:'Aromatic coconut milk curry with vegetables and your choice of protein.', image_url:'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', ingredients:['400ml coconut milk','2 tbsp green curry paste','500g chicken','Bamboo shoots','Thai basil'], steps:['Fry curry paste','Add coconut milk','Add chicken','Simmer 20 mins','Add vegetables'], tags:['thai','spicy','curry'] },
  { id:4, title:'Shakshuka', category:'breakfast', difficulty:'Easy', time_minutes:25, servings:2, likes:158, description:'Eggs poached in spiced tomato and pepper sauce.', image_url:'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=400', ingredients:['6 eggs','400g canned tomatoes','2 peppers','1 onion','Cumin','Paprika'], steps:['Sauté onion and peppers','Add spices','Add tomatoes and simmer','Make wells and add eggs','Cover and cook'], tags:['middle-eastern','eggs','vegetarian'] },
  { id:5, title:'Chocolate Lava Cake', category:'dessert', difficulty:'Hard', time_minutes:20, servings:4, likes:317, description:'Decadent warm chocolate cake with a molten centre.', image_url:'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400', ingredients:['200g dark chocolate','100g butter','4 eggs','80g sugar','50g flour'], steps:['Melt chocolate and butter','Whisk eggs and sugar','Fold in flour','Bake 12 mins at 200°C'], tags:['chocolate','dessert','french'] },
  { id:6, title:'Avocado Toast', category:'breakfast', difficulty:'Easy', time_minutes:10, servings:2, likes:189, description:'Creamy avocado on toasted sourdough with toppings of your choice.', image_url:'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400', ingredients:['2 slices sourdough','1 avocado','Lemon juice','Red chili flakes','Salt'], steps:['Toast the bread','Mash avocado with lemon','Spread on toast','Season and top'], tags:['breakfast','healthy','quick'] },
  { id:7, title:'Mango Smoothie Bowl', category:'breakfast', difficulty:'Easy', time_minutes:10, servings:2, likes:142, description:'Thick and creamy mango smoothie bowl with granola and fresh fruit.', image_url:'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400', ingredients:['2 frozen mangoes','100ml coconut milk','Granola','Banana','Berries'], steps:['Blend frozen mango with coconut milk','Pour into bowl','Add toppings'], tags:['healthy','tropical','vegan'] },
  { id:8, title:'Caesar Salad', category:'lunch', difficulty:'Easy', time_minutes:15, servings:2, likes:176, description:'Crisp romaine lettuce with homemade Caesar dressing and croutons.', image_url:'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', ingredients:['1 romaine lettuce','Parmesan','Croutons','Caesar dressing','Lemon'], steps:['Wash and chop lettuce','Make dressing','Toss together','Top with croutons and cheese'], tags:['salad','classic','quick'] },
]

function load() {
  try { const d = localStorage.getItem(STORAGE_KEY); if (d) return JSON.parse(d) } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RECIPES))
  return SEED_RECIPES
}
function save(r) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)) }
const ok = d => Promise.resolve(d)

export const api = {
  getRecipes: (p = {}) => {
    let r = load()
    if (p.category && p.category !== 'all') r = r.filter(x => x.category === p.category)
    if (p.search) { const q = p.search.toLowerCase(); r = r.filter(x => x.title.toLowerCase().includes(q) || x.description.toLowerCase().includes(q)) }
    if (p.difficulty) r = r.filter(x => x.difficulty === p.difficulty)
    return ok(r)
  },
  getRecipe: id => ok(load().find(r => r.id === Number(id)) || null),
  createRecipe: data => { const r = load(); const n = {...data, id:Date.now(), likes:0, image_url:data.image_url||'https://images.unsplash.com/photo-1546069901857-b2d88e7e1d5a?w=400'}; save([n,...r]); return ok(n) },
  likeRecipe: id => { const r = load().map(x => x.id===Number(id)?{...x,likes:(x.likes||0)+1}:x); save(r); return ok(r.find(x=>x.id===Number(id))) },
  deleteRecipe: id => { save(load().filter(r => r.id !== Number(id))); return ok({success:true}) },
  getCategories: () => ok(['breakfast','lunch','dinner','dessert']),
}

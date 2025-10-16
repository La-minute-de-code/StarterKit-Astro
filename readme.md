# 🚀 Astro Starterkit La minute de code

[![npm version](https://img.shields.io/npm/v/create-astro-starterkit.svg)](https://www.npmjs.com/package/create-astro-starterkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/create-astro-starterkit.svg)](https://nodejs.org)

> 🎯 **Le starterkit Astro le plus complet de 2025** - Créez des sites web modernes en quelques minutes avec tout ce dont vous avez besoin : E-commerce, CMS, déploiement... tout est automatisé !

---

## ✨ Pourquoi ce starterkit ?

**Parce que configurer un projet moderne prend des heures** ⏰

Au lieu de passer votre temps à :
- ⚙️ Configurer manuellement Astro, React, TailwindCSS...
- 🛒 Installer et connecter un backend e-commerce
- 📝 Intégrer un CMS pour gérer le contenu
- 🚀 Configurer le déploiement sur Netlify/Vercel
- 🎨 Créer des composants de base (Header, Footer, Cart...)

**Ce starterkit fait tout automatiquement en 5 minutes** ⚡

---

## 🎁 Ce que vous obtenez

### 🎨 **Composants prêts à l'emploi**
- ✅ Header responsive avec menu mobile
- ✅ Footer avec newsletter et réseaux sociaux
- ✅ Cards produits modernes (Container Queries + OKLCH colors)
- ✅ Panier d'achat complet (si Medusa)
- ✅ Blog cards optimisées (si Sanity)
- ✅ Design accessible (ARIA, reduced-motion)

### 🛒 **E-commerce complet avec Medusa**
- ✅ Backend Medusa installé automatiquement
- ✅ Base de données configurée (PostgreSQL/SQLite)
- ✅ Produits de test inclus
- ✅ Admin panel prêt à l'emploi
- ✅ Client JS connecté au frontend

### 📝 **CMS Headless avec Sanity**
- ✅ Projet Sanity initialisé
- ✅ Client configuré avec helpers
- ✅ Images optimisées automatiquement
- ✅ Requêtes GROQ simplifiées

### 🚀 **Déploiement en un clic**
- ✅ Netlify (adaptateur + config)
- ✅ Vercel (adaptateur + config)
- ✅ Node.js (mode standalone)

### 🎯 **Stack moderne 2025**
- ✅ Astro 5.14+ (dernière version)
- ✅ TypeScript strict
- ✅ TailwindCSS (optionnel)
- ✅ React/Vue/Svelte/Solid (au choix)
- ✅ ESLint + Prettier configurés

---

## 📦 Installation rapide

### **Prérequis**

```bash
# Node.js 2018+ requis
node --version  # Doit afficher v18.0.0 ou supérieur

# PostgreSQL (optionnel, uniquement si vous choisissez Medusa avec PostgreSQL)
# Windows: Télécharger sur postgresql.org
# Mac: brew install postgresql && brew services start postgresql
# Linux: sudo apt install postgresql && sudo systemctl start postgresql
```

### **Création du projet**

```bash
# Avec npm
npm install

# Avec pnpm (plus rapide)
pnpm install

# Avec yarn
yarn install

---

## 🎬 Guide pas à pas

### **Étape 1 : Lancer le script**

```bash
npm install

npm run config
```

### **Étape 2 : Répondre aux questions**

Le script vous pose quelques questions simples :

#### 📝 **Nom du projet**
```
✔ Nom du projet: mon-super-site
```
> 💡 Utilisez uniquement des lettres minuscules, chiffres et tirets

#### 🎨 **Template de départ**
```
✔ Template de départ:
  › Empty (vide)         - Partir de zéro
    Blog                 - Blog pré-configuré
    Portfolio            - Portfolio créatif
    Minimal              - Minimaliste
```

#### ⚛️ **Framework UI** (optionnel)
```
✔ Framework UI à intégrer:
  › Aucun (Astro pur)    - Recommandé pour la performance
    React                - Pour l'écosystème React
    Vue                  - Pour Vue 3
    Svelte               - Ultra léger
    Solid                - Performance maximale
```

#### 🎨 **TailwindCSS**
```
✔ Installer TailwindCSS? › Oui / Non
```
> 💡 Recommandé : Oui (styling rapide avec utility classes)

#### 📝 **Sanity CMS** (optionnel)
```
✔ Intégrer Sanity CMS? › Oui / Non
```
> 🎯 Choisir "Oui" si vous avez besoin d'un blog ou de contenu géré

#### 🛒 **Medusa E-commerce** (optionnel)
```
✔ Intégrer Medusa e-commerce? › Oui / Non
```
> 🎯 Choisir "Oui" pour créer une boutique en ligne

Si vous choisissez Medusa :
```
✔ Configuration Medusa:
  › Installer le backend complet (recommandé)
    Utiliser un backend existant
    Installer uniquement le client

✔ Type de base de données:
  › PostgreSQL (recommandé)   - Production
    SQLite (développement)    - Tests rapides

✔ Voulez-vous ajouter des données de test? › Oui / Non
```

#### 🚀 **Plateforme de déploiement**
```
✔ Plateforme de déploiement:
  › Aucune (statique)    - Site statique pur
    Node.js (SSR)        - Serveur Node.js
    Netlify              - Déploiement Netlify
    Vercel               - Déploiement Vercel
```

### **Étape 3 : Laisser la magie opérer ✨**

Le script va :
1. ⏳ Créer le projet Astro (30 secondes)
2. ⏳ Installer les dépendances (1-2 minutes)
3. ⏳ Générer tous les composants (10 secondes)
4. ⏳ Configurer Medusa si choisi (5-10 minutes)
5. ⏳ Initialiser Sanity si choisi (1 minute)

### **Étape 4 : Démarrer !**

```bash
# Aller dans le dossier du projet
cd mon-super-site

# Lancer le serveur de développement
npm run dev

# Ouvrir http://localhost:4321
```

Si vous avez installé Medusa :
```bash
# Dans un autre terminal
cd medusa-backend
npm run dev

# Admin Medusa : http://localhost:7001
# Email: admin@medusa-test.com
# Password: supersecret
```

---

## 📁 Structure du projet créé

```
mon-super-site/
├── 📂 public/              # Fichiers statiques (images, favicon...)
├── 📂 src/
│   ├── 📂 components/      # Composants Astro/React/Vue
│   │   ├── Header.astro    # ✅ Header responsive généré
│   │   ├── Footer.astro    # ✅ Footer avec newsletter généré
│   │   ├── ProductCard.astro # ✅ Card produit moderne
│   │   └── Cart.astro      # ✅ Panier (si Medusa)
│   ├── 📂 layouts/
│   │   └── Layout.astro    # Layout principal
│   ├── 📂 pages/           # Routes du site
│   │   └── index.astro     # Page d'accueil
│   ├── 📂 lib/             # Utilitaires
│   │   ├── medusa.ts       # ✅ Client Medusa (si activé)
│   │   └── sanity.ts       # ✅ Client Sanity (si activé)
│   └── 📂 styles/          # Styles globaux
├── 📄 astro.config.mjs     # ✅ Configuration Astro optimisée
├── 📄 package.json         # ✅ Scripts npm configurés
├── 📄 tsconfig.json        # ✅ TypeScript strict mode
├── 📄 .env                 # ✅ Variables d'environnement
├── 📄 .gitignore           # ✅ Git ignore optimisé
└── 📄 README.md            # ✅ Documentation générée
```

Si Medusa installé :
```
medusa-backend/             # Backend e-commerce complet
├── 📂 src/
├── 📄 .env                 # Config base de données
├── 📄 start.sh             # ✅ Script de démarrage
└── 📄 medusa-config.js     # Configuration Medusa
```

---

## 💻 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | 🚀 Serveur de développement sur `localhost:4321` |
| `npm run build` | 📦 Build pour la production dans `./dist/` |
| `npm run preview` | 👀 Prévisualiser le build localement |
| `npm run check` | ✅ Vérifier les erreurs TypeScript/Astro |
| `npm run sync` | 🔄 Synchroniser les types Astro |

---

## 🎯 Exemples d'utilisation

### **1. Blog simple**
```bash
npm create la-minute-code@starterkit

✔ Nom: mon-blog
✔ Template: Blog
✔ Framework: Aucun
✔ TailwindCSS: Oui
✔ Sanity CMS: Oui
✔ Medusa: Non
✔ Déploiement: Netlify
```
**Résultat** : Blog moderne avec Sanity CMS prêt à déployer sur Netlify

### **2. E-commerce complet**
```bash
npm create la-minute-code@starterkit

✔ Nom: ma-boutique
✔ Template: Empty
✔ Framework: React
✔ TailwindCSS: Oui
✔ Sanity CMS: Non
✔ Medusa: Oui → Backend complet → PostgreSQL
✔ Déploiement: Vercel
```
**Résultat** : Boutique en ligne avec panier, backend Medusa, admin panel

### **3. Portfolio minimaliste**
```bash
npm create la-minute-code@starterkit

✔ Nom: mon-portfolio
✔ Template: Portfolio
✔ Framework: Aucun
✔ TailwindCSS: Oui
✔ Sanity CMS: Non
✔ Medusa: Non
✔ Déploiement: Netlify
```
**Résultat** : Portfolio léger et rapide, 100% statique

---

## 🛠️ Configuration post-installation

### **Variables d'environnement (.env)**

```env
# Medusa (si activé)
PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... # À récupérer dans l'admin Medusa

# Sanity (si activé)
PUBLIC_SANITY_PROJECT_ID=your_project_id  # Fourni après sanity init
PUBLIC_SANITY_DATASET=production
```

### **Personnaliser le site**

1. **Logo et nom** : Éditez `src/components/Header.astro`
2. **Couleurs** : Modifiez les variables OKLCH dans les styles
3. **Contenu** : Éditez `src/pages/index.astro`
4. **Footer** : Personnalisez `src/components/Footer.astro`

---

## 🚀 Déploiement en production

### **Netlify**

```bash
# Le starterkit a créé netlify.toml automatiquement

# Option 1 : Via l'interface Netlify
# 1. Connecter votre repo GitHub
# 2. Netlify détecte automatiquement la config
# 3. Deploy!

# Option 2 : CLI
npm install -g netlify-cli
netlify deploy --prod
```

### **Vercel**

```bash
# Option 1 : Via l'interface Vercel
# 1. Importer votre repo GitHub
# 2. Vercel détecte Astro automatiquement
# 3. Deploy!

# Option 2 : CLI
npm install -g vercel
vercel --prod
```

### **Node.js (VPS/serveur)**

```bash
npm run build
node ./dist/server/entry.mjs

# Ou avec PM2 (recommandé)
npm install -g pm2
pm2 start ./dist/server/entry.mjs --name mon-site
pm2 save
```

---

## 🎨 Composants inclus - Guide d'utilisation

### **Header.astro**

```astro
---
import Header from '../components/Header.astro';
---

<Header />
<!-- Header responsive avec menu mobile automatique -->
```

**Fonctionnalités** :
- ✅ Menu desktop/mobile adaptatif
- ✅ Panier d'achat (si Medusa)
- ✅ Animations smooth
- ✅ Accessible (ARIA, keyboard navigation)

### **ProductCard.astro** (si Medusa)

```astro
---
import ProductCard from '../components/ProductCard.astro';
---

<ProductCard
  id={product.id}
  title={product.title}
  description={product.description}
  thumbnail={product.thumbnail}
  price={product.variants[0].prices[0].amount}
  currency="EUR"
  handle={product.handle}
/>
```

**Fonctionnalités** :
- ✅ Design moderne (OKLCH colors)
- ✅ Container Queries responsive
- ✅ Ajout au panier en 1 clic
- ✅ Format prix international
- ✅ Images optimisées

### **Cart.astro** (si Medusa)

```astro
---
import Cart from '../components/Cart.astro';
---

<Cart />
<!-- Panier complet automatique (sidebar, quantités, total) -->
```

**Fonctionnalités** :
- ✅ Sidebar animé
- ✅ Gestion quantités (+/-)
- ✅ Calcul total automatique
- ✅ Persistance dans localStorage
- ✅ Notifications toast

### **Footer.astro**

```astro
---
import Footer from '../components/Footer.astro';
---

<Footer />
<!-- Footer complet avec newsletter et réseaux sociaux -->
```

**Fonctionnalités** :
- ✅ Formulaire newsletter
- ✅ Liens réseaux sociaux
- ✅ Grid responsive 4 colonnes
- ✅ Copyright automatique

---

## 🔧 Personnalisation avancée

### **Changer les couleurs**

Les composants utilisent OKLCH (meilleur que HSL) :

```css
/* Dans vos composants .astro */
<style>
  .mon-element {
    /* Couleur primaire */
    background: oklch(0.55 0.22 264);
    
    /* oklch(Luminosité Chroma Teinte) */
    /* Luminosité: 0-1 (0=noir, 1=blanc) */
    /* Chroma: 0-0.4 (intensité) */
    /* Teinte: 0-360 (couleur) */
  }
</style>
```

### **Ajouter une page**

```bash
# Créer src/pages/about.astro
---
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<Layout title="À propos">
  <Header />
  <main>
    <h1>À propos de nous</h1>
    <p>Notre histoire...</p>
  </main>
  <Footer />
</Layout>
```

Accès automatique sur : `http://localhost:4321/about`

### **Connecter Medusa**

```typescript
// src/pages/products.astro
---
import medusaClient from '../lib/medusa';

const { products } = await medusaClient.products.list();
---

{products.map(product => (
  <ProductCard {...product} />
))}
```

### **Requêtes Sanity**

```typescript
// src/pages/blog.astro
---
import { sanityFetch } from '../lib/sanity';

const posts = await sanityFetch({
  query: `*[_type == "post"] | order(publishedAt desc)`,
});
---

{posts.map(post => (
  <BlogCard {...post} />
))}
```

---

## ❓ FAQ

### **Puis-je utiliser ce starterkit pour des projets commerciaux ?**
✅ Oui ! Licence MIT.

### **Dois-je installer PostgreSQL obligatoirement ?**
Non. Vous pouvez :
- Choisir SQLite (plus simple)
- Utiliser un backend Medusa existant
- Ne pas installer Medusa du tout

### **Les composants sont-ils personnalisables ?**
✅ Oui, 100% ! Ce sont vos fichiers, modifiez-les librement.

### **Ça coûte combien ?**
🎉 **Gratuit et open-source !** (MIT License)

### **Puis-je contribuer ?**
✅ Absolument ! PRs bienvenues sur GitHub.

---

## 🐛 Résolution de problèmes

### **Erreur : `Cannot find package 'prompts'`**
```bash
npm install prompts
```

### **PostgreSQL n'est pas accessible**
```bash
# Démarrer PostgreSQL
# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Démarrer le service PostgreSQL dans Services
```

### **Le port 4321 est déjà utilisé**
```bash
# Utiliser un autre port
npm run dev -- --port 3000
```

### **Erreur lors de l'installation Medusa**
```bash
# Vérifier Node.js 18+
node --version

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Installation manuelle
npx create-medusa-app@latest
```

---

## 📚 Ressources utiles

- 📖 [Documentation Astro](https://docs.astro.build)
- 🛒 [Documentation Medusa](https://docs.medusajs.com)
- 📝 [Documentation Sanity](https://www.sanity.io/docs)
- 🎨 [Documentation TailwindCSS](https://tailwindcss.com/docs)
- 🚀 [Astro Discord](https://astro.build/chat)

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

```bash
# 1. Fork le projet
# 2. Créer une branche
git checkout -b feature/super-feature

# 3. Commit
git commit -m "feat: ajoute super feature"

# 4. Push
git push origin feature/super-feature

# 5. Ouvrir une Pull Request
```

---

## 📝 Changelog

### [1.0.0]
- 🎉 Version initiale
- ✨ Support Astro 5.14
- 🛒 Installation automatique Medusa
- 📝 Intégration Sanity complète
- 🎨 Composants modernes (OKLCH, Container Queries)
- ♿ Accessibilité complète (ARIA, keyboard nav)
- 🚀 Déploiement Netlify/Vercel/Node.js

---

## 📄 License

MIT © 2025

**Vous êtes libre de** :
- ✅ Utiliser commercialement
- ✅ Modifier le code
- ✅ Distribuer
- ✅ Utiliser en privé


## 📧 Support & Contact

- **Bugs** : [GitHub Issues](https://github.com/La-minute-de-code/astro_starterkit/issues)
- **Discord** : [Discord](https://discord.gg/HErpkxbmbS)

---

<div align="center">

### ⭐ Si ce projet vous aide, pensez à lui donner une étoile sur GitHub !

</div>

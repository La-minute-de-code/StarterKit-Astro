#!/usr/bin/env node

import { execSync } from "child_process";
import prompts from "prompts";
import fs from "fs/promises";
import path from "path";

// ==================== CONFIGURATION ====================
const CONFIG = {
  FILES_TO_UPDATE: ["astro.config.mjs"],
  SUPPORTED_PLATFORMS: ["nodejs", "netlify", "vercel"],
  MIN_NODE_VERSION: 18,
  TIMEOUT: 300000,
};

// ==================== UTILITAIRES ====================
class Logger {
  static info(msg) { console.log(`ℹ️  ${msg}`); }
  static success(msg) { console.log(`✅ ${msg}`); }
  static error(msg) { console.error(`❌ ${msg}`); }
  static warn(msg) { console.warn(`⚠️  ${msg}`); }
  static step(msg) { console.log(`🔹 ${msg}`); }
}

class ConfigError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ConfigError";
    this.details = details;
  }
}

// ==================== VALIDATIONS ====================
class Validator {
  static async checkNodeVersion() {
    const version = process.version.match(/^v(\d+)/)?.[1];
    if (!version || parseInt(version) < CONFIG.MIN_NODE_VERSION) {
      throw new ConfigError(
        `Node.js version ${CONFIG.MIN_NODE_VERSION}+ requis (actuel: ${process.version})`
      );
    }
  }

  static async checkFileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  static async validateProjectStructure(projectDir) {
    const requiredFiles = ["package.json"];
    const missing = [];

    for (const file of requiredFiles) {
      if (!(await this.checkFileExists(path.join(projectDir, file)))) {
        missing.push(file);
      }
    }

    if (missing.length > 0) {
      throw new ConfigError(
        `Fichiers manquants: ${missing.join(", ")}`,
        { missing }
      );
    }
  }

  static validateProjectName(name) {
    // Vérifier que le nom est valide pour npm
    const validNameRegex = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
    
    if (!name || name.trim().length === 0) {
      return "Le nom du projet ne peut pas être vide";
    }
    
    if (name.length > 214) {
      return "Le nom du projet est trop long (max 214 caractères)";
    }
    
    if (!validNameRegex.test(name)) {
      return "Le nom doit contenir uniquement des lettres minuscules, chiffres, tirets et underscores";
    }
    
    if (name.startsWith('.') || name.startsWith('_')) {
      return "Le nom ne peut pas commencer par . ou _";
    }
    
    return true;
  }

  static async checkDirectoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

// ==================== GESTION DES FICHIERS ====================
class FileManager {
  static async findFile(dir, fileName, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) return null;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.name === "node_modules") continue;
        
        if (entry.isFile() && entry.name === fileName) {
          return fullPath;
        }
        
        if (entry.isDirectory()) {
          const result = await this.findFile(fullPath, fileName, maxDepth, currentDepth + 1);
          if (result) return result;
        }
      }
    } catch (error) {
      Logger.warn(`Erreur lecture dossier ${dir}: ${error.message}`);
    }
    
    return null;
  }

  static async safeWriteFile(filepath, content, backup = true) {
    try {
      if (backup && await Validator.checkFileExists(filepath)) {
        const backupPath = `${filepath}.backup`;
        await fs.copyFile(filepath, backupPath);
        Logger.info(`Backup créé: ${backupPath}`);
      }
      
      await fs.writeFile(filepath, content, "utf8");
      return true;
    } catch (error) {
      throw new ConfigError(
        `Erreur écriture fichier ${filepath}`,
        { error: error.message }
      );
    }
  }

  static async readFileIfExists(filepath) {
    try {
      return await fs.readFile(filepath, "utf8");
    } catch {
      return "";
    }
  }

  static async ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  static async copyDirectory(src, dest) {
    await this.ensureDir(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// ==================== GESTION DE PROJET ====================
class ProjectManager {
  static async createProject(projectName, template = "empty") {
    const projectPath = path.join(process.cwd(), projectName);

    // Vérifier si le dossier existe déjà
    if (await Validator.checkDirectoryExists(projectPath)) {
      throw new ConfigError(
        `Le dossier "${projectName}" existe déjà`,
        { projectPath }
      );
    }

    Logger.step(`Création du projet Astro: ${projectName}...`);

    try {
      // Créer le projet Astro avec npm create
      SafeExecutor.exec(
        `npm create astro@latest ${projectName} -- --template ${template} --install --git --typescript strict --no-dry-run`,
        { silent: false }
      );

      Logger.success(`Projet "${projectName}" créé avec succès`);
      return projectPath;
    } catch (error) {
      throw new ConfigError(
        `Échec de la création du projet Astro`,
        { error: error.message }
      );
    }
  }

  static async updatePackageJson(projectDir, projectName) {
    const packagePath = path.join(projectDir, "package.json");
    
    try {
      const packageContent = await fs.readFile(packagePath, "utf8");
      const pkg = JSON.parse(packageContent);

      // Mettre à jour le nom et ajouter des métadonnées
      pkg.name = projectName;
      pkg.version = "0.1.0";
      pkg.description = `${projectName} - Projet Astro avec Starterkit optimisé`;
      pkg.author = "";
      pkg.license = "MIT";
      
      // Ajouter des scripts utiles
      pkg.scripts = {
        ...pkg.scripts,
        "dev": "astro dev",
        "build": "astro check && astro build",
        "preview": "astro preview",
        "astro": "astro",
        "check": "astro check",
        "sync": "astro sync",
      };

      await FileManager.safeWriteFile(
        packagePath,
        JSON.stringify(pkg, null, 2),
        false
      );

      Logger.success("package.json mis à jour");
    } catch (error) {
      Logger.warn(`Impossible de mettre à jour package.json: ${error.message}`);
    }
  }

  static async createReadme(projectDir, projectName, config) {
    const readmeContent = `# ${projectName}

Projet Astro créé avec le Starterkit optimisé 2025.

## 🚀 Stack Technique

- **Framework**: Astro 5.14+
${config.framework !== 'none' ? `- **UI Framework**: ${config.framework}` : ''}
${config.useTailwind ? '- **Styles**: TailwindCSS' : ''}
${config.useSanity ? '- **CMS**: Sanity' : ''}
${config.useMedusa ? '- **E-commerce**: Medusa' : ''}
${config.deployment !== 'none' ? `- **Déploiement**: ${config.deployment}` : ''}

## 📦 Installation

\`\`\`bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Builder pour la production
npm run build
\`\`\`

## 🛠️ Commandes disponibles

| Commande | Description |
|----------|-------------|
| \`npm run dev\` | Démarre le serveur de développement sur \`localhost:4321\` |
| \`npm run build\` | Build le site pour la production dans \`./dist/\` |
| \`npm run preview\` | Prévisualise le build localement avant déploiement |
| \`npm run check\` | Vérifie les erreurs TypeScript et Astro |
| \`npm run sync\` | Synchronise les types Astro |

## 📁 Structure du projet

\`\`\`
${projectName}/
├── public/          # Fichiers statiques
├── src/
│   ├── components/  # Composants Astro/React/Vue
│   ├── layouts/     # Layouts de pages
│   ├── pages/       # Pages du site (routing basé sur les fichiers)
│   ├── lib/         # Utilitaires et clients (Medusa, Sanity)
│   └── styles/      # Styles globaux
├── astro.config.mjs # Configuration Astro
└── package.json
\`\`\`

## 🧩 Composants générés

${config.useMedusa ? `
### E-commerce (Medusa)
- \`Header.astro\` - En-tête avec panier
- \`ProductCard.astro\` - Carte produit
- \`ProductList.astro\` - Liste de produits
- \`Cart.astro\` - Panier d'achat
- \`lib/medusa.ts\` - Client Medusa
` : ''}

${config.useSanity ? `
### CMS (Sanity)
- \`BlogCard.astro\` - Carte article de blog
- \`SanityImage.astro\` - Image optimisée Sanity
- \`lib/sanity.ts\` - Client Sanity
` : ''}

## 🔧 Configuration

${config.useMedusa ? `
### Medusa
Configurez les variables d'environnement dans \`.env\`:
\`\`\`env
PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
PUBLIC_MEDUSA_PUBLISHABLE_KEY=your_key
\`\`\`
` : ''}

${config.useSanity ? `
### Sanity
Configurez les variables d'environnement dans \`.env\`:
\`\`\`env
PUBLIC_SANITY_PROJECT_ID=your_project_id
PUBLIC_SANITY_DATASET=production
\`\`\`
` : ''}

## 📚 Documentation

- [Documentation Astro](https://docs.astro.build)
${config.framework !== 'none' ? `- [Documentation ${config.framework}](https://docs.astro.build/en/guides/integrations-guide/${config.framework}/)` : ''}
${config.useSanity ? '- [Documentation Sanity](https://www.sanity.io/docs)' : ''}
${config.useMedusa ? '- [Documentation Medusa](https://docs.medusajs.com)' : ''}

## 📝 License

MIT

---

Créé avec ❤️ par le Starterkit Astro optimisé 2025
`;

    await FileManager.safeWriteFile(
      path.join(projectDir, "README.md"),
      readmeContent,
      false
    );

    Logger.success("README.md créé");
  }

  static async createGitignore(projectDir) {
    const gitignoreContent = `# build output
dist/
.output/

# dependencies
node_modules/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# environment variables
.env
.env.production
.env.local

# macOS-specific files
.DS_Store

# jetbrains setting folder
.idea/

# vs code setting folder
.vscode/

# Backup files
*.backup

# Medusa
backend/.env
backend/node_modules/
backend/dist/
backend/uploads/

# Sanity
sanity/node_modules/
sanity/dist/
`;

    await FileManager.safeWriteFile(
      path.join(projectDir, ".gitignore"),
      gitignoreContent,
      false
    );
  }
}

// ==================== EXÉCUTION SÉCURISÉE ====================
class SafeExecutor {
  static exec(command, options = {}) {
    try {
      Logger.step(`Exécution: ${command}`);
      
      const result = execSync(command, {
        stdio: options.silent ? "pipe" : "inherit",
        timeout: CONFIG.TIMEOUT,
        ...options,
      });
      
      return result?.toString() || "";
    } catch (error) {
      throw new ConfigError(
        `Échec commande: ${command}`,
        { error: error.message, stderr: error.stderr?.toString() }
      );
    }
  }

  static async execWithRetry(command, retries = 2, options = {}) {
    for (let i = 0; i <= retries; i++) {
      try {
        return this.exec(command, options);
      } catch (error) {
        if (i === retries) throw error;
        Logger.warn(`Tentative ${i + 1}/${retries + 1} échouée, nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
}

// ==================== GESTIONNAIRE DE COMPOSANTS ====================
class ComponentGenerator {
  static async createMedusaClient(projectDir) {
    const libDir = path.join(projectDir, "src", "lib");
    await FileManager.ensureDir(libDir);

    const clientContent = `// Medusa Client - Créé automatiquement
import Medusa from "@medusajs/medusa-js";

const medusaClient = new Medusa({
  baseUrl: import.meta.env.PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  maxRetries: 3,
  ...(import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY && {
    publishableApiKey: import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  }),
});

export default medusaClient;
`;

    await FileManager.safeWriteFile(
      path.join(libDir, "medusa.ts"),
      clientContent,
      false
    );
    
    Logger.success("Client Medusa créé dans src/lib/medusa.ts");
  }

  static async createSanityClient(projectDir) {
    const libDir = path.join(projectDir, "src", "lib");
    await FileManager.ensureDir(libDir);

    const clientContent = `// Sanity Client - Créé automatiquement
import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
  useCdn: import.meta.env.PROD,
  apiVersion: "2024-01-01",
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source) {
  return builder.image(source);
}

// Helper pour les requêtes GROQ
export async function sanityFetch({ query, params = {} }) {
  return sanityClient.fetch(query, params);
}
`;

    await FileManager.safeWriteFile(
      path.join(libDir, "sanity.ts"),
      clientContent,
      false
    );
    
    Logger.success("Client Sanity créé dans src/lib/sanity.ts");
  }

  static async createProductCard(projectDir, hasMedusa) {
    const componentDir = path.join(projectDir, "src", "components");
    await FileManager.ensureDir(componentDir);

    const componentContent = hasMedusa ? `---
// ProductCard.astro - Carte produit optimisée avec View Transitions
interface Props {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  currency?: string;
  handle?: string;
}

const { id, title, description, thumbnail, price, currency = "EUR", handle } = Astro.props;

const formatPrice = (amount: number, curr: string) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: curr
  }).format(amount / 100);
};
---

<article class="product-card" data-product-id={id}>
  <a href={\`/products/\${handle || id}\`} class="card-link">
    {thumbnail ? (
      <img 
        src={thumbnail} 
        alt={title}
        width="300"
        height="300"
        loading="lazy"
        decoding="async"
        class="product-image"
      />
    ) : (
      <div class="product-image-placeholder" role="img" aria-label="Image non disponible">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </div>
    )}
    
    <div class="product-info">
      <h3 class="product-title">{title}</h3>
      {description && (
        <p class="product-description">{description}</p>
      )}
      {price !== undefined && (
        <p class="product-price">{formatPrice(price, currency)}</p>
      )}
    </div>
  </a>
  
  <button 
    type="button"
    class="add-to-cart-btn"
    data-product-id={id}
    data-product-title={title}
    data-product-price={price}
    data-product-thumbnail={thumbnail}
    aria-label={\`Ajouter \${title} au panier\`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
    <span>Ajouter au panier</span>
  </button>
</article>

<script>
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.add-to-cart-btn');
    if (!btn) return;
    
    e.preventDefault();
    
    const product = {
      id: btn.getAttribute('data-product-id'),
      title: btn.getAttribute('data-product-title'),
      price: parseInt(btn.getAttribute('data-product-price') || '0'),
      thumbnail: btn.getAttribute('data-product-thumbnail'),
      variantId: btn.getAttribute('data-product-id'),
    };
    
    document.dispatchEvent(new CustomEvent('add-to-cart', { 
      detail: product 
    }));
  });
</script>

<style>
  .product-card {
    container-type: inline-size;
    border: 1px solid oklch(0.9 0 0);
    border-radius: 12px;
    overflow: hidden;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
    background: oklch(1 0 0);
  }
  
  .product-card:hover {
    box-shadow: 0 8px 24px oklch(0 0 0 / 0.12);
    transform: translateY(-2px);
  }
  
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }
  
  .product-image,
  .product-image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }
  
  .product-image-placeholder {
    background: oklch(0.95 0 0);
    display: flex;
    align-items: center;
    justify-content: center;
    color: oklch(0.7 0 0);
  }
  
  .product-info {
    padding: 1.25rem;
  }
  
  .product-title {
    margin: 0 0 0.5rem;
    font-size: clamp(1rem, 2cqi, 1.25rem);
    font-weight: 600;
    color: oklch(0.2 0 0);
    line-height: 1.3;
  }
  
  .product-description {
    margin: 0 0 0.75rem;
    font-size: clamp(0.875rem, 1.5cqi, 0.9375rem);
    color: oklch(0.5 0 0);
    line-height: 1.5;
  }
  
  .product-price {
    margin: 0;
    font-size: clamp(1.125rem, 2.5cqi, 1.375rem);
    font-weight: 700;
    color: oklch(0.55 0.15 145);
  }
  
  .add-to-cart-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    background: oklch(0.55 0.22 264);
    color: oklch(1 0 0);
    border: none;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .add-to-cart-btn:hover {
    background: oklch(0.5 0.22 264);
  }
  
  @media (prefers-reduced-motion: reduce) {
    .product-card {
      transition: none;
    }
    
    .product-card:hover {
      transform: none;
    }
  }
</style>
` : `---
// ProductCard.astro - Carte produit simple
interface Props {
  title: string;
  description?: string;
  image?: string;
  link?: string;
}

const { title, description, image, link = "#" } = Astro.props;
---

<article class="product-card">
  <a href={link} class="card-link">
    {image ? (
      <img 
        src={image} 
        alt={title}
        width="300"
        height="300"
        loading="lazy"
        decoding="async"
        class="product-image"
      />
    ) : (
      <div class="product-image-placeholder" role="img" aria-label="Image non disponible">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </div>
    )}
    
    <div class="product-info">
      <h3 class="product-title">{title}</h3>
      {description && (
        <p class="product-description">{description}</p>
      )}
    </div>
  </a>
</article>

<style>
  .product-card {
    container-type: inline-size;
    border: 1px solid oklch(0.9 0 0);
    border-radius: 12px;
    overflow: hidden;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
    background: oklch(1 0 0);
  }
  
  .product-card:hover {
    box-shadow: 0 8px 24px oklch(0 0 0 / 0.12);
    transform: translateY(-2px);
  }
  
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }
  
  .product-image,
  .product-image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }
  
  .product-image-placeholder {
    background: oklch(0.95 0 0);
    display: flex;
    align-items: center;
    justify-content: center;
    color: oklch(0.7 0 0);
  }
  
  .product-info {
    padding: 1.25rem;
  }
  
  .product-title {
    margin: 0 0 0.5rem;
    font-size: clamp(1rem, 2cqi, 1.25rem);
    font-weight: 600;
    color: oklch(0.2 0 0);
    line-height: 1.3;
  }
  
  .product-description {
    margin: 0;
    font-size: clamp(0.875rem, 1.5cqi, 0.9375rem);
    color: oklch(0.5 0 0);
    line-height: 1.5;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .product-card {
      transition: none;
    }
    
    .product-card:hover {
      transform: none;
    }
  }
</style>
`;

    await FileManager.safeWriteFile(
      path.join(componentDir, "ProductCard.astro"),
      componentContent,
      false
    );
    
    Logger.success("Component ProductCard.astro créé");
  }

  static async createHeader(projectDir, hasMedusa) {
    const componentDir = path.join(projectDir, "src", "components");
    await FileManager.ensureDir(componentDir);

    const componentContent = `---
// Header.astro - En-tête responsive optimisé
interface Props {
  showCart?: boolean;
}

const { showCart = ${hasMedusa} } = Astro.props;
---

<header class="site-header">
  <div class="header-container">
    <a href="/" class="logo" aria-label="Accueil">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <span>MonSite</span>
    </a>
    
    <button 
      class="mobile-menu-toggle" 
      aria-label="Toggle menu"
      aria-expanded="false"
      aria-controls="main-nav"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    
    <nav id="main-nav" class="main-nav" aria-label="Navigation principale">
      <ul role="list">
        <li><a href="/">Accueil</a></li>
        ${hasMedusa ? '<li><a href="/products">Produits</a></li>' : '<li><a href="/about">À propos</a></li>'}
        <li><a href="/blog">Blog</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
    
    ${hasMedusa ? `<div class="header-actions">
      <button class="icon-btn" aria-label="Recherche">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
      
      <button id="cart-toggle" class="icon-btn cart-btn" aria-label="Panier">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span class="cart-count" data-count="0">0</span>
      </button>
    </div>` : ''}
  </div>
</header>

<script>
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.main-nav');
  
  toggle?.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    toggle.classList.toggle('active');
    nav?.classList.toggle('active');
  });
</script>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: oklch(1 0 0 / 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid oklch(0.9 0 0);
  }
  
  .header-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: oklch(0.2 0 0);
    font-weight: 700;
    font-size: 1.25rem;
  }
  
  .main-nav ul {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .main-nav a {
    color: oklch(0.3 0 0);
    text-decoration: none;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .mobile-menu-toggle {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .main-nav {
      position: fixed;
      top: 0;
      right: 0;
      width: min(300px, 80vw);
      height: 100vh;
      background: oklch(1 0 0);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }
    
    .main-nav.active {
      transform: translateX(0);
    }
  }
</style>
`;

    await FileManager.safeWriteFile(
      path.join(componentDir, "Header.astro"),
      componentContent,
      false
    );
    
    Logger.success("Component Header.astro créé");
  }

  static async generateComponents(projectDir, options) {
    Logger.step("Génération des composants...");
    
    if (options.useMedusa) {
      await this.createMedusaClient(projectDir);
    }
    
    if (options.useSanity) {
      await this.createSanityClient(projectDir);
    }
    
    await this.createProductCard(projectDir, options.useMedusa);
    await this.createHeader(projectDir, options.useMedusa);
    
    Logger.success("Tous les composants ont été générés");
  }
}

// ==================== GESTIONNAIRES CMS/E-COMMERCE ====================
class SanityManager {
  static async setup(projectDir) {
    Logger.step("Configuration Sanity...");
    
    SafeExecutor.exec("npm install @sanity/client @sanity/image-url", {
      cwd: projectDir
    });
    
    SafeExecutor.exec("npx sanity init", {
      cwd: projectDir
    });
    
    Logger.success("Sanity configuré");
  }
}

class MedusaManager {
  static async setup(projectDir) {
    Logger.step("Configuration Medusa...");

    const response = await prompts([
      {
        type: "select",
        name: "setupType",
        message: "Configuration Medusa:",
        choices: [
          { title: "Installer le backend complet (recommandé)", value: "full" },
          { title: "Utiliser un backend existant", value: "existing" },
          { title: "Installer uniquement le client (configuration manuelle)", value: "client-only" },
        ],
      },
      {
        type: (prev) => prev === "existing" ? "text" : null,
        name: "backendUrl",
        message: "URL du backend Medusa existant:",
        initial: "http://localhost:9000",
        validate: (value) => value.startsWith("http") ? true : "URL invalide (doit commencer par http:// ou https://)",
      },
      {
        type: (prev, values) => values.setupType === "full" ? "text" : null,
        name: "backendDir",
        message: "Nom du dossier backend:",
        initial: "medusa-backend",
        validate: (value) => value && value.trim().length > 0 ? true : "Le nom ne peut pas être vide",
      },
      {
        type: (prev, values) => values.setupType === "full" ? "select" : null,
        name: "dbType",
        message: "Type de base de données:",
        choices: [
          { title: "PostgreSQL (recommandé)", value: "postgres" },
          { title: "SQLite (développement)", value: "sqlite" },
        ],
      },
      {
        type: (prev, values) => values.setupType === "full" && values.dbType === "postgres" ? "text" : null,
        name: "dbUrl",
        message: "URL PostgreSQL:",
        initial: "postgres://localhost/medusa-store",
        validate: (value) => value.includes("postgres://") ? true : "URL PostgreSQL invalide",
      },
    ]);

    if (!response.setupType) {
      Logger.warn("Configuration Medusa annulée");
      return;
    }

    // Installer le client JS dans tous les cas
    Logger.step("Installation du client Medusa JS...");
    SafeExecutor.exec("npm install @medusajs/medusa-js", {
      cwd: projectDir
    });

    let backendUrl = "http://localhost:9000";

    // Installation complète du backend
    if (response.setupType === "full") {
      await this.installBackend(projectDir, response);
      backendUrl = "http://localhost:9000";
    } else if (response.setupType === "existing") {
      backendUrl = response.backendUrl;
    }

    // Créer le fichier .env
    const envPath = path.join(projectDir, ".env");
    let envContent = await FileManager.readFileIfExists(envPath);

    const medusaVars = `
# Medusa Configuration
PUBLIC_MEDUSA_BACKEND_URL=${backendUrl}
# PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... (à ajouter après création dans l'admin)
`;

    if (!envContent.includes("PUBLIC_MEDUSA_BACKEND_URL")) {
      envContent += medusaVars;
      await FileManager.safeWriteFile(envPath, envContent, false);
      Logger.success("Variables Medusa ajoutées à .env");
    }

    // Instructions finales
    console.log("\n" + "=".repeat(60));
    Logger.success("✨ Medusa configuré avec succès!");
    console.log("=".repeat(60) + "\n");

    if (response.setupType === "full") {
      console.log("📦 Backend Medusa installé dans:", response.backendDir);
      console.log("\n🚀 Pour démarrer le backend:");
      console.log(`   cd ${response.backendDir}`);
      if (response.dbType === "postgres") {
        console.log("   # Assurez-vous que PostgreSQL est démarré");
      }
      console.log("   npm run dev");
      console.log("\n👤 Admin Medusa: http://localhost:7001");
      console.log("   Email: admin@medusa-test.com");
      console.log("   Password: supersecret");
    } else if (response.setupType === "existing") {
      console.log("🔗 Backend Medusa configuré:", backendUrl);
    } else {
      console.log("📝 Configuration manuelle requise:");
      console.log("   1. Installer le backend Medusa séparément");
      console.log("   2. Mettre à jour PUBLIC_MEDUSA_BACKEND_URL dans .env");
    }

    console.log("\n💡 Documentation: https://docs.medusajs.com\n");
  }

  static async installBackend(projectDir, config) {
    const backendPath = path.join(path.dirname(projectDir), config.backendDir);

    // Vérifier si le dossier existe
    if (await Validator.checkDirectoryExists(backendPath)) {
      Logger.warn(`Le dossier "${config.backendDir}" existe déjà`);
      const overwrite = await prompts({
        type: "confirm",
        name: "value",
        message: "Voulez-vous le supprimer et réinstaller?",
        initial: false,
      });

      if (!overwrite.value) {
        Logger.info("Installation du backend annulée");
        return;
      }

      await fs.rm(backendPath, { recursive: true, force: true });
    }

    Logger.step("Installation du backend Medusa (peut prendre 5-10 minutes)...");
    Logger.warn("⚠️  Cette étape nécessite une connexion internet stable");

    try {
      // Créer le dossier backend
      await FileManager.ensureDir(backendPath);

      // Installation selon le type de base de données
      if (config.dbType === "sqlite") {
        Logger.info("Installation avec SQLite (développement)...");
        SafeExecutor.exec(
          `npx create-medusa-app@latest --db-url sqlite://localhost/${config.backendDir}.db --skip-browser`,
          { cwd: backendPath }
        );
      } else {
        Logger.info("Installation avec PostgreSQL...");
        
        // Vérifier si PostgreSQL est accessible
        const dbCheck = await prompts({
          type: "confirm",
          name: "value",
          message: "PostgreSQL est-il démarré et accessible?",
          initial: true,
        });

        if (!dbCheck.value) {
          Logger.error("Démarrez PostgreSQL avant de continuer");
          Logger.info("Windows: Démarrer le service PostgreSQL");
          Logger.info("Mac: brew services start postgresql");
          Logger.info("Linux: sudo systemctl start postgresql");
          throw new ConfigError("PostgreSQL non accessible");
        }

        SafeExecutor.exec(
          `npx create-medusa-app@latest --db-url ${config.dbUrl} --skip-browser`,
          { cwd: backendPath }
        );
      }

      // Créer un script de démarrage rapide
      const startScript = config.dbType === "postgres" ? 
`#!/bin/bash
# Script de démarrage du backend Medusa

echo "🚀 Démarrage du backend Medusa..."

# Vérifier PostgreSQL
if ! pg_isready > /dev/null 2>&1; then
  echo "❌ PostgreSQL n'est pas démarré"
  echo "Démarrez-le avec: brew services start postgresql (Mac) ou sudo systemctl start postgresql (Linux)"
  exit 1
fi

# Démarrer Medusa
npm run dev
` : 
`#!/bin/bash
# Script de démarrage du backend Medusa

echo "🚀 Démarrage du backend Medusa (SQLite)..."
npm run dev
`;

      await FileManager.safeWriteFile(
        path.join(backendPath, "start.sh"),
        startScript,
        false
      );

      // Rendre le script exécutable (Unix)
      try {
        SafeExecutor.exec(`chmod +x start.sh`, { cwd: backendPath });
      } catch (e) {
        // Ignore sur Windows
      }

      Logger.success("Backend Medusa installé avec succès!");

      // Seeds de données de test
      const seedPrompt = await prompts({
        type: "confirm",
        name: "value",
        message: "Voulez-vous ajouter des données de test (produits de démo)?",
        initial: true,
      });

      if (seedPrompt.value) {
        Logger.step("Ajout des données de test...");
        try {
          SafeExecutor.exec("npm run seed", { cwd: backendPath });
          Logger.success("Données de test ajoutées");
        } catch (e) {
          Logger.warn("Impossible d'ajouter les données de test automatiquement");
          Logger.info("Vous pourrez les ajouter plus tard avec: npm run seed");
        }
      }

    } catch (error) {
      Logger.error("Échec de l'installation du backend Medusa");
      Logger.info("\n💡 Installation manuelle:");
      console.log("   1. Créer un dossier pour le backend");
      console.log("   2. Exécuter: npx create-medusa-app@latest");
      console.log("   3. Suivre les instructions interactives");
      console.log("   4. Documentation: https://docs.medusajs.com/create-medusa-app\n");
      
      // Continuer sans backend
      const continueWithout = await prompts({
        type: "confirm",
        name: "value",
        message: "Continuer sans backend Medusa?",
        initial: true,
      });

      if (!continueWithout.value) {
        throw error;
      }
    }
  }

  static async checkPostgres() {
    try {
      SafeExecutor.exec("pg_isready", { silent: true });
      return true;
    } catch {
      return false;
    }
  }
}

class DeploymentManager {
  static async setup(projectDir, platform) {
    if (platform === "none") return;

    Logger.step(`Configuration déploiement ${platform}...`);

    const handlers = {
      nodejs: () => SafeExecutor.exec("npm install @astrojs/node", { cwd: projectDir }),
      netlify: () => SafeExecutor.exec("npm install @astrojs/netlify", { cwd: projectDir }),
      vercel: () => SafeExecutor.exec("npm install @astrojs/vercel", { cwd: projectDir }),
    };

    await handlers[platform]();
    Logger.success(`Adaptateur ${platform} installé`);
  }
}

// ==================== FONCTION PRINCIPALE ====================
async function main() {
  console.log("\n🚀 Starterkit Astro - Configuration optimisée 2025\n");

  try {
    await Validator.checkNodeVersion();

    // ÉTAPE 1: Choix du nom du projet
    const projectResponse = await prompts([
      {
        type: "text",
        name: "projectName",
        message: "Nom du projet:",
        initial: "mon-projet-astro",
        validate: (value) => {
          const validation = Validator.validateProjectName(value);
          return validation === true ? true : validation;
        },
      },
      {
        type: "select",
        name: "template",
        message: "Template de départ:",
        choices: [
          { title: "Blog", value: "blog" },
          { title: "Portfolio", value: "portfolio" },
          { title: "Minimal", value: "minimal" },
        ],
      },
    ]);

    if (!projectResponse.projectName) {
      Logger.warn("Configuration annulée");
      return;
    }

    const { projectName, template } = projectResponse;

    // Vérifier si le dossier existe
    const projectPath = path.join(process.cwd(), projectName);
    if (await Validator.checkDirectoryExists(projectPath)) {
      Logger.error(`Le dossier "${projectName}" existe déjà`);
      const overwrite = await prompts({
        type: "confirm",
        name: "value",
        message: "Voulez-vous le supprimer et continuer?",
        initial: false,
      });

      if (!overwrite.value) {
        Logger.warn("Configuration annulée");
        return;
      }

      await fs.rm(projectPath, { recursive: true, force: true });
      Logger.info(`Dossier "${projectName}" supprimé`);
    }

    // ÉTAPE 2: Créer le projet Astro
    Logger.step(`Création du projet "${projectName}"...`);
    await ProjectManager.createProject(projectName, template);

    // ÉTAPE 3: Questions de configuration
    const configResponse = await prompts([
      {
        type: "select",
        name: "framework",
        message: "Framework UI à intégrer:",
        choices: [
          { title: "Aucun (Astro pur)", value: "none" },
          { title: "React", value: "react" },
          { title: "Vue", value: "vue" },
          { title: "Svelte", value: "svelte" },
          { title: "Solid", value: "solid" },
        ],
      },
      {
        type: "toggle",
        name: "useTailwind",
        message: "Installer TailwindCSS?",
        initial: true,
        active: "Oui",
        inactive: "Non",
      },
      {
        type: "toggle",
        name: "useSanity",
        message: "Intégrer Sanity CMS?",
        initial: false,
        active: "Oui",
        inactive: "Non",
      },
      {
        type: "toggle",
        name: "useMedusa",
        message: "Intégrer Medusa e-commerce?",
        initial: false,
        active: "Oui",
        inactive: "Non",
      },
      {
        type: "select",
        name: "deployment",
        message: "Plateforme de déploiement:",
        choices: [
          { title: "Aucune (statique)", value: "none" },
          { title: "Node.js (SSR)", value: "nodejs" },
          { title: "Netlify", value: "netlify" },
          { title: "Vercel", value: "vercel" },
        ],
      },
    ]);

    if (!configResponse.framework) {
      Logger.warn("Configuration annulée");
      return;
    }

    const config = { ...configResponse };

    // ÉTAPE 4: Configuration
    Logger.info(`\nConfiguration du projet dans: ${projectPath}\n`);

    // Changer le répertoire de travail
    process.chdir(projectPath);

    // Mettre à jour package.json
    await ProjectManager.updatePackageJson(projectPath, projectName);

    // Installer les intégrations
    if (config.framework !== "none") {
      Logger.step(`Installation ${config.framework}...`);
      SafeExecutor.exec(`npx astro add ${config.framework} --yes`, {
        cwd: projectPath
      });
    }

    if (config.useTailwind) {
      Logger.step("Installation TailwindCSS...");
      SafeExecutor.exec("npx astro add tailwind --yes", {
        cwd: projectPath
      });
    }

    if (config.useSanity) {
      await SanityManager.setup(projectPath);
    }

    if (config.useMedusa) {
      await MedusaManager.setup(projectPath);
    }

    // Générer les composants
    await ComponentGenerator.generateComponents(projectPath, config);

    // Configuration déploiement
    await DeploymentManager.setup(projectPath, config.deployment);

    // Créer README et .gitignore
    await ProjectManager.createReadme(projectPath, projectName, config);
    await ProjectManager.createGitignore(projectPath);

    // SUCCÈS
    console.log("\n" + "=".repeat(60));
    Logger.success("✨ Projet créé avec succès!");
    console.log("=".repeat(60) + "\n");

    console.log(`📁 Projet: ${projectName}`);
    console.log(`📍 Chemin: ${projectPath}\n`);

    console.log("📦 Composants générés:");
    console.log("   • Header.astro");
    console.log("   • ProductCard.astro");
    if (config.useMedusa) {
      console.log("   • lib/medusa.ts");
    }
    if (config.useSanity) {
      console.log("   • lib/sanity.ts");
    }

    console.log("\n🚀 Prochaines étapes:");
    console.log(`   cd ${projectName}`);
    console.log("   npm run dev\n");

    console.log("💡 Commandes utiles:");
    console.log("   npm run dev     - Serveur de développement");
    console.log("   npm run build   - Build production");
    console.log("   npm run preview - Prévisualiser le build\n");

  } catch (error) {
    console.log("\n" + "=".repeat(60));
    Logger.error("❌ Erreur durant la configuration");
    console.log("=".repeat(60) + "\n");

    if (error instanceof ConfigError) {
      Logger.error(error.message);
      if (error.details) {
        console.log("\nDétails:", JSON.stringify(error.details, null, 2));
      }
    } else {
      Logger.error(error.message);
      console.error(error);
    }

    console.log("\n💡 Conseils:");
    console.log("   • Vérifiez votre connexion internet");
    console.log("   • Essayez: npm cache clean --force");
    console.log("   • Vérifiez que le nom du projet est valide\n");

    process.exit(1);
  }
}

process.on("SIGINT", () => {
  Logger.warn("\nConfiguration interrompue");
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  Logger.error("Erreur non gérée:");
  console.error(error);
  process.exit(1);
});

main();
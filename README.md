# Market Intelligence Platform - Platform de Trading ISIN

Une plateforme moderne pour trader les ISIN avec affichage en temps réel des prix Bid/Ask/Last des ETFs Trade Republic.

## Fonctionnalités

- ✅ **Interface Trading** - Achetez/vendez les ISIN avec Bid/Ask/Last
- ✅ **Recherche rapide** - Par ISIN, symbole ou nom
- ✅ **Sessions persistantes** - Pas de SMS répétés pendant 30 jours
- ✅ **Données en temps réel** - Mise à jour des prix Trade Republic
- ✅ **Design épuré** - Interface minimaliste et efficace
- ✅ **Thème sombre/clair** - Adaptation automatique
- ✅ **Production ready** - TypeScript, Next.js 16, shadcn/ui

## Démarrage Rapide

### Installation

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev
```

Visitez `http://localhost:3000` et commencez à trader !

## Structure du Projet

```
├── app/
│   ├── auth/               # Page d'authentification
│   ├── dashboard/          # Dashboard principal avec trading
│   ├── api/                # Routes API (sessions, ETF)
│   └── layout.tsx
├── components/
│   ├── isin-trader.tsx     # Interface de trading principale
│   ├── etf-prices.tsx      # Affichage des prix ETF
│   ├── dashboard-nav.tsx   # Navigation
│   ├── auth-form.tsx       # Formulaire d'authentification
│   └── ui/                 # Composants shadcn/ui
├── lib/
│   ├── etf-data.ts         # Données ISIN + calculs
│   ├── session-manager.ts  # Gestion sessions encryptées
│   ├── api-service.ts      # Services API
│   └── constants.ts        # Constantes
├── scripts/
│   └── python_api_client.py # Client Python pour Excel
└── types/
    └── index.ts            # Types TypeScript
```

## Stack Technique

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Next.js API Routes
- **Sessions**: Stockage encrypté AES-256
- **Python**: Client pour export Excel avec xlwing

## Utilisation

### Page de Trading

1. **Authentification**: Login avec numéro de téléphone + PIN
2. **Recherche ISIN**: Trouvez rapidement l'actif à trader
3. **Sélectionner un ISIN**: Cliquez sur la liste pour voir les détails
4. **Spécifier la quantité**: Entrez le nombre d'unités
5. **Acheter/Vendre**: Boutons verts (achat) et rouges (vente)

### Données Affichées

Pour chaque ISIN:
- **ISIN & Nom** - Identifiant et nom complet
- **Bid** - Prix d'achat (ce que vous payez)
- **Ask** - Prix de vente (ce que vous recevez)
- **Last** - Dernier prix tradé
- **Spread** - Différence Bid/Ask en points et %
- **Devise** - USD ou EUR

### Sessions Persistantes

- Les sessions sont sauvegardées localement pendant 30 jours
- Pas besoin de SMS répétés pour chaque connexion
- Vérification automatique de validité au prochain login

### Export Excel (Python)

```bash
# Installation
bash scripts/setup-python.sh

# Activation
source venv/bin/activate

# Export des données ISIN
python scripts/python_api_client.py --export-excel

# Output: data/trade_republic_2026-03-08.xlsx
```

## Configuration

### Ajouter des ISIN

Éditez `lib/etf-data.ts`:

```typescript
export const MOCK_ETF_DATA: Record<string, ETFPrice> = {
  'IE00B4NCMG89': {
    isin: 'IE00B4NCMG89',
    name: 'Phys Silver',
    bid: 69.02,
    ask: 69.59,
    last: 69.02,
    currency: 'USD',
    // ...
  },
  // Ajouter d'autres ISIN ici
};
```

### Variables d'Environnement

Créez `.env.local`:

```env
# Optionnel - API Trade Republic
NEXT_PUBLIC_API_URL=https://api.traderepublic.com
```

## Composants Principaux

### ISINTrader
Interface complète de trading avec recherche, affichage des prix et formulaire d'ordre.

### ETFPrices
Tableau des prix ETF avec Bid/Ask/Last.

### DashboardNav
Navigation avec lien vers dashboard/market et logout.

### AuthForm
Formulaire d'authentification avec reprise de session.

## API Routes

### GET /api/auth/session
Vérifier ou créer une session utilisateur.

### GET /api/etf/snapshot
Récupérer tous les prix ETF.

### GET /api/market/snapshot
Snapshot des données Binance (Bid/Ask).

## Sécurité

- Sessions encryptées AES-256
- Pas d'exposition de secrets
- Validation des entrées
- Protection CORS
- HTTP-only cookies (recommandé pour production)

## Déploiement

### Vercel (Recommandé)

```bash
vercel
```

### Docker

```bash
docker build -t market-intelligence-platform .
docker run -p 3000:3000 market-intelligence-platform
```

### Production

```bash
pnpm build
pnpm start
```

## Troubleshooting

### Erreur de session
- Vérifier localStorage est activé
- Purger le cache navigateur
- Tester l'incognito

### ISIN ne s'affiche pas
- Vérifier le format ISIN dans etf-data.ts
- Consoler.log pour debug
- Vérifier la devise (USD/EUR)

### Excel n'exporte pas
- Installer xlwing: `pip install xlwing`
- Sur Windows: `python -m xlwing quickstart myapp`
- Vérifier le chemin d'export

## Performance

- Chargement dashboard: ~300ms
- Recherche ISIN: instantané (client-side)
- Export Excel: ~1-2s

## Support & Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Trade Republic API](https://github.com/NightOwl07/trade-republic-api)

---

Made for traders who want to trade efficiently. 🚀


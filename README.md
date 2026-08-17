# G-Boss Business Suite

# PROMPT POUR LOVABLE — Construction de G-Boss

## Contexte général

Construis **G-Boss**, une plateforme web privée (PWA - Progressive Web App) de gestion d'entreprise. Ce n'est **pas** une plateforme e-commerce : elle ne vend rien aux clients finaux, elle sert uniquement à gérer un business (données, tâches, communication interne, facturation, stock, rapports).

**Nom d'app dans les mockups existants : "G-Boss"** (à conserver comme nom technique interne si utile, mais la marque publique est **G-Boss**).

La plateforme doit être une **PWA installable** : sur téléphone (icône ajoutée à l'écran d'accueil, comme une app mobile) et sur Windows — sans développer d'application native séparée.

La base d'utilisateurs cible est mixte **iPhone et Android**. Toute fonctionnalité matérielle (impression, Bluetooth) doit donc être pensée pour fonctionner sur les deux, sachant que **Safari/iOS ne supporte pas le Web Bluetooth API**.

---

## 1. Architecture des comptes et abonnements

### 1.1 Types de comptes à l'inscription
Deux types de compte au choix : **Biznis** (Business) et **Institisyon** (école).

### 1.2 Plans d'abonnement (compte Biznis)
Trois plans mensuels, nommés façon Netflix Basic/Standard/Premium :

| Plan | Nom marketing | Prix | Capacité |
|---|---|---|---|
| Solo (1 personne) | **G-Esansyèl** | 350 HTG/mois | Dashboard perso, données jour/mois, revenus/dépenses, tâches, rapports, documents, notes — pas de chat d'équipe |
| Small Business (2-5 personnes) | **G-Estanda** | 630 HTG/mois | + jusqu'à 5 employés, chat interne, tâches/rapports par employé, audio/vidéoconférence, partage de documents, permissions admin/employé |
| Business/Enterprise (jusqu'à 20 personnes) | **G-Premyòm** | 1050 HTG/mois | + canaux par département, appels conférence, dashboard avancé, plusieurs niveaux admin, permissions avancées |

Le module **Rapò (Rapports)** doit être disponible dans les **3 plans**, pas seulement Enterprise. Idem pour le module **Facture** et le module **Estòk/Stock**.

### 1.3 Plan Institisyon
- Nom marketing : **G-Kanpis** — 75 HTG/mois par élève
- Deux sous-types au choix à l'inscription : **Lekòl Klasik** (primaire/secondaire/université) et **Lekòl Pwofesyonèl** (formation technique/vocationnelle)

### 1.4 Add-on Airbnb/Hotel
- Nom : **"Airbnb and Hotel"** — 1000 HTG/mois, add-on séparé (comme G-Kanpis), sélectionnable pendant l'inscription pour tout type de compte Biznis

### 1.5 Gestion de plusieurs business sous un seul compte
- Un utilisateur peut gérer **jusqu'à 2 business maximum** (pas 3) sous un seul compte/login — pas besoin de créer un compte séparé pour chaque business.
- Un switcher/menu déroulant (pas de déconnexion nécessaire) permet de changer de business en 1 clic. Chaque business garde ses données strictement séparées (Stock, Équipe, Rapports, Facturation, Clients propres à chaque business).
- Tarification : peu importe le plan choisi (G-Esansyèl / G-Estanda / G-Premyòm), s'il accepte de gérer 2 catégories de business, on ajoute **+30% sur le prix du plan choisi**. Exemple : G-Estanda (630 HTG) + 2 business → 630 × 1.30 = 819 HTG/mois.

### 1.6 Sectorisation automatique par type de business
- À l'inscription, l'utilisateur précise son secteur via un **menu déroulant avec les secteurs courants** (Restaurant, Boutique/Détail, Construction/Matériaux, Salon de beauté, Services professionnels, Automobile, Santé, etc.) **+ une option "Autre" en texte libre** si son secteur n'est pas dans la liste.
- Selon le secteur choisi, les catégories/étiquettes pré-remplies dans le module Estòk/Market doivent s'adapter automatiquement (ex. Restaurant → "Nourriture", "Boissons", "Matériel cuisine" ; Construction → "Matériaux de base", "Outils", "Finition"). L'utilisateur garde toujours la possibilité de modifier/ajouter/supprimer ces catégories manuellement — le pré-remplissage est un point de départ, pas une contrainte rigide.

### 1.7 Essai gratuit
- **8 jours d'essai gratuit** pour tout nouveau compte avant l'obligation de payer l'abonnement normal.
- Pendant les 8 jours, notifications formelles sur **2 canaux** : notification interne dans la plateforme + SMS/WhatsApp.
- Calendrier de rappels : jour 5, jour 7, notification finale jour 8.

### 1.8 Deux questions Oui/Non à l'inscription (indépendantes, pas d'activation automatique)
1. **"Vle itilize Kès/Vant pou bay kliyan resi ?"** (Veux-tu utiliser Caisse/Vente pour donner des reçus clients ?) → active le module Kès/Vant (POS) pour n'importe quel type de business (restaurant, boutique, service), avec TVA/taxe configurable si applicable, export PDF/JPEG/Impression.
2. **"Gen envantè/estòk pwodwi pou jere ?"** (As-tu un inventaire/stock de produits à gérer ?) → active le module Stock complet (SKU, scan code-barres, mouvements de stock).
- Un restaurant peut avoir Kès/Vant=Oui et Stock détaillé=Non. Un market répond Oui aux deux (Kès/Vant lié au Stock, une vente diminue le stock automatiquement). Un service sans vente directe (ex. une entreprise de construction) répond Non aux deux.

---

## 2. Authentification et sécurité

### 2.1 Connexion des comptes business
- Login classique email + mot de passe.
- **Support Sign in with Apple et Sign in with Google** en plus du login classique.
- Vérification de compte à l'inscription : l'utilisateur reçoit un **email avec un code** (pas un lien) à saisir dans la plateforme pour valider son compte. **Le code est valable 30 minutes.**
- Note : pour les comptes créés via Apple/Google, l'email est déjà vérifié par ces services — le flux de code par email peut être sauté dans ce cas, mais le reste du flux d'inscription (Type de compte / Plan / Info Business / Paiement) s'applique quand même après la première connexion Apple/Google.

### 2.2 Compte Super-Admin (créateur de la plateforme)
- **Email du Super-Admin : wildjyjean8@gmail.com**
- Le compte Super-Admin se connecte via **le même formulaire de login normal** que tous les autres comptes (pas de deuxième page de login séparée). Ce compte possède un **flag/rôle spécial "Super-Admin"** dans la base de données, qui redirige automatiquement le système vers le Dashboard Super-Admin au lieu du dashboard business normal.
- Ce compte **n'est pas créé via la page d'inscription publique** (qui crée des "business" avec un plan) — il est créé une seule fois directement dans la base de données.
- **Flux de première connexion Super-Admin** : l'email (déjà flaggé "Super-Admin" en base) est saisi dans le formulaire de login normal → le système le reconnaît → l'utilisateur crée son mot de passe pour la première fois → configure les mesures de sécurité additionnelles → connexion normale ensuite.
- **2FA obligatoire pour le Super-Admin via application Authenticator** (Google Authenticator, Authy, etc.) — pas de 2FA par SMS (plus vulnérable aux attaques SIM swap).

### 2.3 Sécurité générale recommandée
- Sessions du Super-Admin à expiration plus rapide que les comptes normaux (ex. déconnexion automatique après 30 min d'inactivité).
- Journal/historique de chaque action du Super-Admin (date/heure/action) pour traçabilité.

---

## 3. Dashboard Super-Admin

Accessible uniquement au Super-Admin (wildjyjean8@gmail.com). Doit inclure :
- **KPI principaux** : nombre total de business inscrits sur G-Boss, revenu total des abonnements, nouvelles inscriptions du mois, taux d'attrition (churn)
- **Répartition par plan** : graphique donut/bar montrant combien de business dans chaque plan (G-Esansyèl / G-Estanda / G-Premyòm / G-Kanpis / add-on Airbnb-Hotel)
- **Croissance mois par mois** : graphique montrant l'évolution du nombre de business + revenu sur les 6-12 derniers mois
- **Tableau des business inscrits** : liste complète avec nom du business/catégorie/plan/date d'inscription/statut (Actif/Essai/Restreint/Annulé)
- **Gestion directe des business** : le Super-Admin peut **suspendre/activer** un compte business directement depuis ce dashboard (pas seulement consulter les données)
- Paiements et facturation : quels business paient à temps vs en retard, revenu par mois, prochains paiements à venir
- Activité récente : nouvelles inscriptions, annulations, changements de plan

---

## 4. Design system (à respecter à l'identique sur TOUTE la plateforme)

### Typographie
- Titres : **Space Grotesk**
- Corps de texte : **Inter**
- Chiffres/SKU : **IBM Plex Mono**
- (Pour la page Inscription en particulier, un design system alternatif plus moderne a été validé comme référence : fonts **Sora/Inter/IBM Plex Mono**, icônes SVG style **Lucide**, navigation en sidebar avec étapes)

### Palette de couleurs (exacte, à respecter partout)
- Fond de page : `#F8F9FE`
- Sidebar : `#00113C`
- Cartes : `#FFFFFF`
- Bordures : `#EDF0F7`
- Accent marque : dégradé `#062997` → `#3B29DF` (à plat : `#3721FF`)
- Badge "G"/médaille : or `#FFBE28` / `#FCC11B`
- Couleurs KPI : bleu `#2A41FA`, vert `#04A84F`, orange `#FD8103`, rouge `#F91428`, violet `#6020F3`
- Texte titres : `#0A0A14`, texte muted : `#232532`, delta positif : `#094020`
- Badges de statut : "Disponib" `#E2F8EC` (vert), "Ba Estòk" `#FFF0DB` (orange), "Kritik" `#FEDBE2` (rouge)
- Donuts : bleu `#2A41FA`, violet `#6020F3`, magenta `#FF2488`, or `#FEAB03`, cyan `#51BFCE`

### Logo officiel
Lettre "G" stylisée en dégradé or/bleu avec des barres façon graphique de croissance intégrées, texte "G-BOSS" en bleu métallique avec des ailes dorées, slogan : **"Gérer. Organiser. Développer."**

### Principe important
Chaque onglet/catégorie de l'app réelle doit être **pleinement fonctionnel selon son nom** (pas juste décoratif comme dans un mockup), et **tous les graphiques doivent être calculés à partir de vraies données** — pas de chiffres statiques codés en dur.

---

## 5. Pages et modules à construire (spécifications détaillées)

### 5.1 Dashboard principal
Ticker de prix en haut, 4 KPI colorés, panneau Équipe (barres de progression), panneau Tâches en 3 colonnes, grille "Actions rapides", graphique Dépenses/Revenus sur 7 jours, aperçu Stock, section "Organiser une réunion", résumé général.

### 5.2 Faktirasyon (Facturation)
En-tête personnalisé ("Bonjour, [Nom]"), boutons Importer/Créer Facture, 5 KPI (Total/Payé/En attente/Expiré/Ce mois), graphique d'évolution des factures, donut par statut, panneau résumé rapide, tableau des dernières factures, panneau factures en retard + rappel. Formulaire de facture : logo/info business en haut (auto-rempli depuis le compte), zone de signature du dirigeant en bas.

### 5.3 Estòk/Market (Stock)
Onglets : Aperçu / Tous les produits / Entrées / Sorties / Mouvements / Rapport. 5 KPI, panneau Catégories, graphique combiné Entrées/Sorties/Valeur, produits en stock bas, top produits vendus, tableau produits (SKU/prix/stock/statut), donut catégories, 4 mini-panneaux (Entrées/Sorties du jour, Fournisseurs actifs, Valeur par dépôt). Scan code-barres. Taxe configurable par le propriétaire. Module disponible dans les 3 plans (pas seulement Enterprise).

### 5.4 Rapò (Rapports)
Sous-onglets : Aperçu / Ventes / Achats / Stock / Fournisseurs / Clients / Finances / Livraisons / Performance. Exports PDF/Excel/Custom. 5 KPI avec mini-graphiques, graphique combiné Ventes/Profit, donut catégories, tendance Commandes, panneau résumé, rapport rapide, 3 tableaux top (produits/clients/fournisseurs), activité récente, avertissements.

### 5.5 Fournisè (Fournisseurs)
En-tête + Export CSV/+Ajouter, 5 KPI, tableau fournisseurs (logo/note/catégorie/contact/statut/actions), panneau Contacter, Top Fournisseurs, distribution par catégorie, achats par mois, paiements en attente, dernière activité. Support de commande directe intégrée (fournisseur déjà sur G-Boss) ET bon de commande PDF envoyé via WhatsApp/email (fournisseur externe).

### 5.6 Ekip/Anplwaye (Équipe)
En-tête + Ajouter/Export, 5 KPI, tableau (avatar/rôle/département/statut/tâches/actions), panneaux (Performance Équipe, Distribution des rôles, Dernière activité, Présence/Horaire), profil individuel (contact, historique, performance, Désactiver). Gestion : l'admin désactive (ne supprime pas) un compte qui quitte, les tâches passent "sans assigné". Rôles personnalisables : Admin Principal, Manager, Employé Standard, Vendeur/Caissier, Comptable.

### 5.7 Tach (Tâches — vue Kanban)
En-tête + Créer Tâche + filtres + switch Kanban/Liste/Calendrier. 5 KPI. Colonnes : À faire / En cours / Fini (+ En révision/Bloqué pour le plan Enterprise). Carte de tâche (avatar/priorité/échéance/icônes/progression). Vue détail : description/assigné/sous-tâches (Enterprise)/documents attachés/chat de commentaires intégré/historique. Panneaux : Performance par personne, Tâches proches de l'échéance, Dernière activité. Inspiré de Trello + Asana + Slack.

### 5.8 Kès/Vant (POS — Point de vente)
Zone scan/recherche produit, grille de produits rapides, ticket avec lignes ajustables, sous-total + taxe auto-calculée + total final, choix du mode de paiement (Cash/MonCash/Carte), bouton "Finaliser la vente", export PDF/JPEG/Impression. La finalisation diminue le stock automatiquement et alimente les rapports.

### 5.9 Module Institisyon (école) — pour les comptes G-Kanpis
- Gestion des élèves (fiche/présence/historique académique)
- Bulletin scolaire (PDF, calcul de moyenne automatique)
- Diplôme (PDF)
- Devoirs (dépôt/soumission)
- Cours en appel vidéo (professeur animateur)
- **Professeurs/cours** : l'admin ajoute un professeur dans Équipe/Staff (rôle "Professeur"), assigne cours/matière/classe/horaire via une page "Cours" (tableau + vue Calendrier). Dashboard personnel du professeur avec bouton "Commencer le cours en vidéo" (contrôle micro/caméra des élèves, partage d'écran).
- **PAS d'enregistrement des sessions vidéo** (cours ni réunions), pour économiser l'espace de stockage.
- **Présence automatique** pendant le cours vidéo : automatique (absent si pas entré dans les 10-15 min, en retard si plus tard), mais le professeur garde le dernier mot pour corriger avant soumission finale → alimente l'historique de l'élève + assiduité du bulletin.
- **Accès élèves** : compte séparé de Équipe/Staff, créé par l'admin (import CSV) ou formulaire d'inscription en ligne. Login email+mot de passe (secondaire/université/pro) ou code numérique simple (primaire). Compte Parent/Tuteur optionnel (lecture seule : présence/notes/devoirs/communication, sans soumettre de devoirs ni entrer en cours vidéo). Dashboard élève limité (pas de visibilité sur les autres élèves ni les modules business).
- **Diplôme** : l'admin crée un ou plusieurs modèles, le système vérifie les conditions (moyenne/bulletin ou complétion de module+évaluation) ou approbation manuelle, l'admin sélectionne le(s) élève(s) → "Générer Diplôme" (auto : nom/date/programme/signature du directeur + numéro unique), export PDF haute qualité, archivé dans l'historique de l'élève.
- **Devoirs** : section commentaires sous chaque devoir, visible SEULEMENT par l'élève assigné et le professeur (pas les autres élèves).
- **Blocage non-paiement** : décision MANUELLE de l'admin uniquement (pas d'automatisation) via un switch "Actif/Restreint" sur le profil de l'élève. Un élève restreint perd l'accès au cours vidéo + soumission de devoirs, mais garde l'accès au bulletin/notes/devoirs déjà soumis. Une notification est envoyée à l'élève/parent.

### 5.10 Add-on "Airbnb and Hotel"
- Jusqu'à **4 personnes maximum** avec accès : 1 Admin + 3 autres. Rôle "Caissière" avec accès limité au check-in/check-out et fiche d'entrée (nombre de jours/moment où le client reste, montant encaissé par séjour). Deux autres rôles : Nettoyage/Entretien (chambres) + Superviseur général.
- Fiche client à l'enregistrement doit capturer : numéro de carte d'identité, nationalité, nom et prénom, et toute autre information d'identité complète. Photo/scan du document d'identité optionnel (pas obligatoire). Doit aussi inclure le nombre total de personnes du séjour (adultes + enfants) et s'il y a des enfants parmi eux.
- La fiche check-in/réservation doit inclure 2 conditions/règlements écrits : (1) le client est responsable de tout dommage pendant le séjour, (2) éviter le bruit pour ne pas déranger les appartements/voisins avoisinants.
- Les réservations peuvent arriver par téléphone, en personne, ou en ligne — mais le système de réservation en ligne n'est pas encore construit dans cette première version : toutes les réservations sont saisies manuellement par Admin/Caissière.
- Chaque chambre/unité a son propre prix par nuit (pas un prix fixe global) ; pour le MVP, un seul prix par nuit suffit (sans variation saison/weekend pour l'instant).
- Une unité peut être de plusieurs types : Chambre Simple, Studio, ou Appartement (1 à 3+ chambres avec salon+cuisine séparés). Structure de données de chaque unité : nom/étiquette, numéro (chaque appartement/unité a son propre numéro), nombre de chambres à coucher, présence Salon (Oui/Non), présence Cuisine (Oui/Non), nombre de toilettes, capacité maximale (adultes+enfants), liste d'équipements, photo(s), et prix par nuit propre à chaque unité.

---

## 6. Fonctionnalités transversales

### 6.1 Système AI intégré
- Disponible pour Admin, Professeur, et Élève — accès filtré selon les règles de permission du rôle, pour guider dans la plateforme.
- **Interdiction explicite : l'IA ne donne AUCUNE aide sur les devoirs** (ni explication de concepts, ni assistance aux devoirs pour les élèves) — protection de l'intégrité académique.

### 6.2 Langues
La plateforme doit être disponible en **4 langues : Kreyòl, Français, Anglais, Espagnol**, avec un sélecteur de langue visible.

### 6.3 Devise
Dans tous les modules, les business/institutions doivent pouvoir choisir quelle devise/monnaie utiliser (ex. facturer en dollars US), avec un taux de change configurable, saisi manuellement par l'Admin (pas automatique).

### 6.4 Mode Offline
Le mode Offline est une priorité importante pour tout G-Boss (pas seulement Airbnb/Hotel), même si cela demande plus de temps de développement. Même en mode offline, si le paiement de l'abonnement n'est pas honoré, l'accès du business est coupé/bloqué quand même (le blocage de paiement ne dépend pas de la connexion internet). Période de grâce choisie : **7 jours sans internet avant blocage automatique**.

### 6.5 Impression des documents (toute la plateforme)
- Pour Kès/Vant (POS), les business peuvent choisir entre imprimante thermique (petit rouleau 58/80mm) ou imprimante A4 normale — les deux options doivent être supportées.
- Pour la fiche check-in Airbnb/Hotel et la Facturation, même choix entre format petit reçu (58/80mm) ou A4 normal.
- **Stratégie technique recommandée** : privilégier l'impression via **WiFi/réseau local** comme méthode principale (fonctionne sur Android ET iPhone, car cela ne passe pas par le Web Bluetooth API qui n'est pas supporté sur iOS). Le Bluetooth direct reste une option secondaire, disponible uniquement sur Android (Web Bluetooth API fonctionne sur Chrome/Edge). Une option "Télécharger/Partager en PDF" doit toujours être disponible pour imprimer depuis un autre appareil.
- **Avis automatique pour les utilisateurs iPhone** dans la section Enpresyon (Paramètres Imprimante) : quand le système détecte que l'utilisateur est sur Safari/iOS, afficher un avis expliquant que le Bluetooth n'est pas disponible sur iOS et qu'il faut connecter l'imprimante au même réseau WiFi que l'appareil. Ce texte doit exister dans les 4 langues de la plateforme (Kreyòl/Français/Anglais/Espagnol).

### 6.6 Paiements
- G-Boss elle-même **ne reçoit/ne manipule jamais l'argent des transactions clientes** des business — elle stocke seulement les données/chiffres. Seul le Super-Admin reçoit l'argent des abonnements des business, via **MonCash Connect / API REST Digicel**.
- Intégration de **Didit** (vérification d'identité/KYB) prévue plus tard, pas dans cette première version.

---

## 7. Ce que je te demande de faire

1. Construis d'abord la structure de navigation générale (sidebar + routing) avec le design system exact décrit en section 4.
2. Construis la page d'inscription complète (stepper à étapes : Type de compte → Choix du plan → Info Business → Vérification → Paiement), avec le sélecteur de secteur (menu déroulant + "Autre"), les 2 questions Oui/Non (Kès/Vant, Stock), le choix add-on (G-Kanpis ou Airbnb/Hotel), et le sélecteur de langue.
3. Construis le flux d'authentification complet : login normal (email/mot de passe), Sign in with Apple, Sign in with Google, vérification par code email (30 min), et la logique de redirection spéciale pour le compte Super-Admin (wildjyjean8@gmail.com) avec configuration 2FA par application Authenticator au premier login.
4. Construis chaque module listé en section 5, avec des données réelles/dynamiques (pas de contenu statique), en respectant fidèlement chaque spécification donnée.
5. Construis le Dashboard Super-Admin (section 3), accessible uniquement au compte flaggé Super-Admin.
6. Implémente la logique multi-business (max 2 par compte, +30% sur le plan choisi, switcher sans déconnexion, données strictement séparées par business).
7. Implémente la logique d'impression avec détection iPhone/Android et l'avis multilingue décrit en 6.5.

Merci de ne rien improviser en dehors de ce qui est précisé ici — si un détail manque, pose la question plutôt que de deviner.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/28afa5e6-84e9-4b72-843a-0ccf74472f39).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

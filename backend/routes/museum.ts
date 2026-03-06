import { Router } from 'express';

const router = Router();

// ==================== DADOS DO ALMANAQUE BOTÂNICO ====================

const CATEGORIES = [
  { id: 'medicinal', name: 'Medicinais', icon: '💊', color: '#4CAF50', description: 'Plantas com propriedades medicinais' },
  { id: 'ornamental', name: 'Ornamentais', icon: '🌸', color: '#E91E63', description: 'Plantas decorativas e flores' },
  { id: 'edible', name: 'Comestíveis', icon: '🍎', color: '#FF9800', description: 'Plantas alimentícias' },
  { id: 'aromatic', name: 'Aromáticas', icon: '🌿', color: '#8BC34A', description: 'Ervas e plantas aromáticas' },
  { id: 'succulent', name: 'Suculentas', icon: '🌵', color: '#009688', description: 'Cactos e suculentas' },
  { id: 'aquatic', name: 'Aquáticas', icon: '🌊', color: '#03A9F4', description: 'Plantas de ambientes aquáticos' },
  { id: 'rare', name: 'Raras', icon: '💎', color: '#9C27B0', description: 'Espécies raras e ameaçadas' },
  { id: 'native', name: 'Nativas', icon: '🇧🇷', color: '#4CAF50', description: 'Plantas nativas do Brasil' }
];

const REGIONS = [
  { id: 'amazonia', name: 'Amazônia', icon: '🌴' },
  { id: 'atlantic', name: 'Mata Atlântica', icon: '🌳' },
  { id: 'cerrado', name: 'Cerrado', icon: '🌾' },
  { id: 'caatinga', name: 'Caatinga', icon: '🌵' },
  { id: 'pantanal', name: 'Pantanal', icon: '🌿' },
  { id: 'pampa', name: 'Pampa', icon: '🍃' }
];

const CONSERVATION_STATUS: Record<string, { label: string; color: string }> = {
  extinct: { label: 'Extinto', color: '#f44336' },
  critically_endangered: { label: 'Criticamente Ameaçado', color: '#d32f2f' },
  endangered: { label: 'Em Perigo', color: '#ff5722' },
  vulnerable: { label: 'Vulnerável', color: '#ff9800' },
  near_threatened: { label: 'Quase Ameaçado', color: '#ffc107' },
  least_concern: { label: 'Pouco Preocupante', color: '#4caf50' },
  not_evaluated: { label: 'Não Avaliado', color: '#9e9e9e' }
};

const FAMILIES = [
  { id: 'fam-001', name: 'Orquídeas', scientificName: 'Orchidaceae', description: 'Família com mais de 25.000 espécies', characteristics: ['Flores assimétricas', 'Polínias', 'Sementes minúsculas'], coverImage: 'https://images.unsplash.com/photo-1566836610593-62a64888c216?w=800', speciesCount: 156, featured: true, category: 'ornamental' },
  { id: 'fam-002', name: 'Bromélias', scientificName: 'Bromeliaceae', description: 'Família nativa das Américas', characteristics: ['Folhas em roseta', 'Flores vistosas', 'Epífitas'], coverImage: 'https://images.unsplash.com/photo-1597055181300-e3633a917b90?w=800', speciesCount: 89, featured: true, category: 'ornamental' },
  { id: 'fam-003', name: 'Palmeiras', scientificName: 'Arecaceae', description: 'Plantas monocotiledôneas tropicais', characteristics: ['Caule estipe', 'Folhas pinadas', 'Frutos drupáceos'], coverImage: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800', speciesCount: 234, featured: true, category: 'edible' },
  { id: 'fam-004', name: 'Cactos', scientificName: 'Cactaceae', description: 'Plantas suculentas de ambientes áridos', characteristics: ['Caules suculentos', 'Espinhos', 'Metabolismo CAM'], coverImage: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800', speciesCount: 178, featured: false, category: 'succulent' },
  { id: 'fam-005', name: 'Ervas Medicinais', scientificName: 'Lamiaceae', description: 'Família das ervas aromáticas', characteristics: ['Caule quadrangular', 'Folhas opostas', 'Óleos essenciais'], coverImage: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?w=800', speciesCount: 120, featured: true, category: 'medicinal' },
  { id: 'fam-006', name: 'Leguminosas', scientificName: 'Fabaceae', description: 'Família de grande importância econômica', characteristics: ['Frutos legumes', 'Fixação de nitrogênio', 'Sementes variadas'], coverImage: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800', speciesCount: 280, featured: false, category: 'edible' }
];

const SPECIES: any[] = [
  { id: 'sp-001', familyId: 'fam-001', commonName: 'Orquídea-brasil', scientificName: 'Cattleya labiata', description: 'A "Rainha das Orquídeas", símbolo das orquidófilos brasileiros.', imageUrl: 'https://images.unsplash.com/photo-1566836610593-62a64888c216?w=800', origin: 'Mata Atlântica', habitat: 'Florestas tropicais úmidas', floweringSeason: 'Outono-Inverno', conservationStatus: 'vulnerable', height: '30-60cm', category: 'ornamental', region: 'atlantic', tags: ['orquídea', 'epífita', 'mata atlântica', 'flor'], views: 15420, likes: 892, featured: true },
  { id: 'sp-002', familyId: 'fam-002', commonName: 'Bromélia-imperial', scientificName: 'Alcantarea imperialis', description: 'Uma das maiores bromélias, endêmica de inselbergs.', imageUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a917b90?w=800', origin: 'Espírito Santo', habitat: 'Inselbergs rochosos', floweringSeason: 'Verão', conservationStatus: 'endangered', height: '100-150cm', category: 'ornamental', region: 'atlantic', tags: ['bromélia', 'endêmica', 'gigante'], views: 28930, likes: 1543, featured: true },
  { id: 'sp-003', familyId: 'fam-003', commonName: 'Açaizeiro', scientificName: 'Euterpe oleracea', description: 'Palmeira de grande importância econômica na Amazônia.', imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800', origin: 'Amazônia', habitat: 'Várzeas e igapós', floweringSeason: 'Ano todo', conservationStatus: 'least_concern', height: '15-25m', category: 'edible', region: 'amazonia', tags: ['palmeira', 'açaí', 'comestível'], views: 42650, likes: 2721, featured: true },
  { id: 'sp-004', familyId: 'fam-004', commonName: 'Mandacaru', scientificName: 'Cereus jamacaru', description: 'Cacto colunar típico da Caatinga brasileira.', imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800', origin: 'Caatinga', habitat: 'Caatinga e cerrado', floweringSeason: 'Primavera-Verão', conservationStatus: 'least_concern', height: '4-10m', category: 'succulent', region: 'caatinga', tags: ['cacto', 'caatinga', 'xerófita', 'noturna'], views: 12540, likes: 687, featured: true },
  { id: 'sp-005', familyId: 'fam-005', commonName: 'Alecrim', scientificName: 'Rosmarinus officinalis', description: 'Erva aromática com propriedades medicinais.', imageUrl: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?w=800', origin: 'Mediterrâneo', habitat: 'Clima temperado', floweringSeason: 'Primavera', conservationStatus: 'least_concern', height: '50-150cm', category: 'medicinal', region: 'pampa', tags: ['aromática', 'medicinal', 'culinária'], views: 18920, likes: 1023, featured: true },
  { id: 'sp-006', familyId: 'fam-003', commonName: 'Palmito-juçara', scientificName: 'Euterpe edulis', description: 'Palmeira nativa produtora do melhor palmito.', imageUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800', origin: 'Mata Atlântica', habitat: 'Florestas ombrófilas', floweringSeason: 'Ano todo', conservationStatus: 'endangered', height: '10-15m', category: 'edible', region: 'atlantic', tags: ['palmeira', 'palmito', 'ameaçada'], views: 18920, likes: 1023, featured: false },
  { id: 'sp-007', familyId: 'fam-006', commonName: 'Feijão-andu', scientificName: 'Cajanus cajan', description: 'Leguminosa importante para alimentação.', imageUrl: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800', origin: 'África/Índia', habitat: 'Clima tropical', floweringSeason: 'Verão', conservationStatus: 'least_concern', height: '1-3m', category: 'edible', region: 'cerrado', tags: ['leguminosa', 'comestível', 'proteína'], views: 8750, likes: 423, featured: false },
  { id: 'sp-008', familyId: 'fam-001', commonName: 'Orquídea-das-pedras', scientificName: 'Laelia rupicola', description: 'Orquídea litófita do cerrado brasileiro.', imageUrl: 'https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=800', origin: 'Cerrado', habitat: 'Afloramentos rochosos', floweringSeason: 'Primavera', conservationStatus: 'near_threatened', height: '20-40cm', category: 'ornamental', region: 'cerrado', tags: ['orquídea', 'litófita', 'cerrado'], views: 9870, likes: 534, featured: false },
  { id: 'sp-009', familyId: 'fam-002', commonName: 'Abacaxi', scientificName: 'Ananas comosus', description: 'Fruta tropical de grande importância econômica.', imageUrl: 'https://images.unsplash.com/photo-1550258987-190a1d41a3e0?w=800', origin: 'América do Sul', habitat: 'Clima tropical', floweringSeason: 'Verão', conservationStatus: 'least_concern', height: '50-100cm', category: 'edible', region: 'atlantic', tags: ['bromélia', 'fruta', 'tropical'], views: 25630, likes: 1432, featured: true },
  { id: 'sp-010', familyId: 'fam-005', commonName: 'Hortelã', scientificName: 'Mentha spicata', description: 'Erva aromática muito usada na culinária.', imageUrl: 'https://images.unsplash.com/photo-1628844989553-5a89bd7b4f64?w=800', origin: 'Europa/Ásia', habitat: 'Úmido', floweringSeason: 'Verão', conservationStatus: 'least_concern', height: '30-60cm', category: 'aromatic', region: 'pampa', tags: ['aromática', 'culinária', 'medicinal'], views: 21340, likes: 1198, featured: true }
];

const EXPEDITIONS = [
  { id: 'exp-001', title: 'Expedição Mata Atlântica', description: 'Viagem pela biodiversidade da Mata Atlântica', coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800', startDate: '2024-09-01', endDate: '2024-12-31', species: ['sp-001', 'sp-006'], curator: 'Dr. Paulo Botânico', status: 'active', location: 'Costa brasileira', region: 'atlantic' },
  { id: 'exp-002', title: 'Orquídeas do Cerrado', description: 'Exploração de orquídeas raras do cerrado', coverImage: 'https://images.unsplash.com/photo-1566836610593-62a64888c216?w=800', startDate: '2024-10-15', endDate: '2025-03-31', species: ['sp-008'], curator: 'Dr. Ricardo Orquidea', status: 'active', location: 'Goiás e Minas Gerais', region: 'cerrado' },
  { id: 'exp-003', title: 'Tesouros da Amazônia', description: 'Catalogando espécies da maior floresta tropical', coverImage: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800', startDate: '2025-05-01', endDate: '2025-10-31', species: ['sp-003'], curator: 'Dra. Amélia Tropica', status: 'upcoming', location: 'Bacia Amazônica', region: 'amazonia' }
];

const EVENTS = [
  { id: 'evt-001', title: 'Identificação de Orquídeas', description: 'Workshop prático de identificação', type: 'workshop', date: '2024-12-15', time: '09:00', duration: 180, capacity: 30, registered: 22, imageUrl: 'https://images.unsplash.com/photo-1566836610593-62a64888c216?w=800', speaker: 'Dr. Ricardo Orquidea', online: true, category: 'ornamental' },
  { id: 'evt-002', title: 'Excursão: Bromélias', description: 'Observação de bromélias na natureza', type: 'field_trip', date: '2024-12-20', time: '07:00', duration: 480, capacity: 15, registered: 12, imageUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a917b90?w=800', speaker: 'Dra. Clara Bromélia', online: false, location: 'Serra do Mar - SP', category: 'ornamental' },
  { id: 'evt-003', title: 'Plantas Medicinais Brasileiras', description: 'Potencial medicinal da flora brasileira', type: 'lecture', date: '2025-01-10', time: '19:00', duration: 120, capacity: 200, registered: 87, imageUrl: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?w=800', speaker: 'Prof. Manuel Ervas', online: true, category: 'medicinal' }
];

// ==================== ROTAS ====================

router.get('/', (_req, res) => {
  res.json({
    name: 'Almanaque Botânico LabGrandisol',
    description: 'Enciclopédia digital de plantas e expedições botânicas',
    stats: { totalFamilies: FAMILIES.length, totalSpecies: SPECIES.length, totalExpeditions: EXPEDITIONS.filter(e => e.status === 'active').length, totalViews: SPECIES.reduce((a, s) => a + s.views, 0) },
    categories: CATEGORIES,
    regions: REGIONS,
    featured: { families: FAMILIES.filter(f => f.featured).slice(0, 3), species: SPECIES.filter(s => s.featured).slice(0, 4), expeditions: EXPEDITIONS.filter(e => e.status === 'active').slice(0, 2) }
  });
});

router.get('/categories', (_req, res) => res.json({ total: CATEGORIES.length, categories: CATEGORIES }));
router.get('/regions', (_req, res) => res.json({ total: REGIONS.length, regions: REGIONS }));
router.get('/conservation-status', (_req, res) => res.json(CONSERVATION_STATUS));

router.get('/families', (req, res) => {
  let { category, featured, limit = 20, offset = 0 } = req.query;
  let filtered = [...FAMILIES];
  if (category) filtered = filtered.filter(f => f.category === category);
  if (featured === 'true') filtered = filtered.filter(f => f.featured);
  res.json({ total: filtered.length, families: filtered.slice(+offset, +offset + +limit) });
});

router.get('/families/:id', (req, res) => {
  const family = FAMILIES.find(f => f.id === req.params.id);
  if (!family) { res.status(404).json({ error: 'Família não encontrada' }); return; }
  res.json({ ...family, species: SPECIES.filter(s => s.familyId === family.id) });
});

router.get('/species', (req, res) => {
  let { familyId, category, region, featured, search, status, sortBy = 'views', limit = 20, offset = 0 } = req.query;
  let filtered = [...SPECIES];
  if (familyId) filtered = filtered.filter(s => s.familyId === familyId);
  if (category) filtered = filtered.filter(s => s.category === category);
  if (region) filtered = filtered.filter(s => s.region === region);
  if (featured === 'true') filtered = filtered.filter(s => s.featured);
  if (status) filtered = filtered.filter(s => s.conservationStatus === status);
  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(s => s.commonName.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q) || s.tags.some((t: string) => t.includes(q)));
  }
  if (sortBy === 'views') filtered.sort((a, b) => b.views - a.views);
  else if (sortBy === 'likes') filtered.sort((a, b) => b.likes - a.likes);
  else if (sortBy === 'name') filtered.sort((a, b) => a.commonName.localeCompare(b.commonName));
  res.json({ total: filtered.length, species: filtered.slice(+offset, +offset + +limit) });
});

router.get('/species/:id', (req, res) => {
  const species = SPECIES.find(s => s.id === req.params.id);
  if (!species) { res.status(404).json({ error: 'Espécie não encontrada' }); return; }
  species.views++;
  const family = FAMILIES.find(f => f.id === species.familyId);
  res.json({ ...species, family, related: SPECIES.filter(s => s.familyId === species.familyId && s.id !== species.id).slice(0, 4) });
});

router.post('/species/:id/like', (req, res) => {
  const species = SPECIES.find(s => s.id === req.params.id);
  if (!species) { res.status(404).json({ error: 'Espécie não encontrada' }); return; }
  species.likes++;
  res.json({ success: true, likes: species.likes });
});

router.get('/expeditions', (req, res) => {
  let { status, region, limit = 20, offset = 0 } = req.query;
  let filtered = [...EXPEDITIONS];
  if (status) filtered = filtered.filter(e => e.status === status);
  if (region) filtered = filtered.filter(e => e.region === region);
  res.json({ total: filtered.length, expeditions: filtered.slice(+offset, +offset + +limit) });
});

router.get('/expeditions/:id', (req, res) => {
  const exp = EXPEDITIONS.find(e => e.id === req.params.id);
  if (!exp) { res.status(404).json({ error: 'Expedição não encontrada' }); return; }
  res.json({ ...exp, speciesDetails: exp.species.map(sid => SPECIES.find(s => s.id === sid)).filter(Boolean) });
});

router.get('/events', (req, res) => {
  let { type, category, upcoming = 'true', limit = 20, offset = 0 } = req.query;
  let filtered = [...EVENTS];
  if (type) filtered = filtered.filter(e => e.type === type);
  if (category) filtered = filtered.filter(e => e.category === category);
  if (upcoming === 'true') filtered = filtered.filter(e => new Date(e.date) >= new Date());
  filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json({ total: filtered.length, events: filtered.slice(+offset, +offset + +limit) });
});

router.post('/events/:id/register', (req, res) => {
  const event = EVENTS.find(e => e.id === req.params.id);
  if (!event) { res.status(404).json({ error: 'Evento não encontrado' }); return; }
  if (event.registered >= event.capacity) { res.status(400).json({ error: 'Evento lotado' }); return; }
  event.registered++;
  res.json({ success: true, event: { id: event.id, title: event.title, date: event.date } });
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) { res.status(400).json({ error: 'Parâmetro q obrigatório' }); return; }
  const query = (q as string).toLowerCase();
  res.json({
    query: q,
    results: {
      families: FAMILIES.filter(f => f.name.toLowerCase().includes(query) || f.scientificName.toLowerCase().includes(query)),
      species: SPECIES.filter(s => s.commonName.toLowerCase().includes(query) || s.scientificName.toLowerCase().includes(query) || s.tags.some((t: string) => t.includes(query))),
      expeditions: EXPEDITIONS.filter(e => e.title.toLowerCase().includes(query))
    }
  });
});

// Compatibilidade
router.get('/collections', (req, res) => {
  let { featured, limit = 20, offset = 0 } = req.query;
  let filtered = [...FAMILIES];
  if (featured === 'true') filtered = filtered.filter(f => f.featured);
  res.json({ total: filtered.length, collections: filtered.slice(+offset, +offset + +limit).map(f => ({ ...f, itemCount: f.speciesCount, curator: 'Curador' })) });
});

router.get('/collections/:id', (req, res) => {
  const family = FAMILIES.find(f => f.id === req.params.id);
  if (!family) { res.status(404).json({ error: 'Coleção não encontrada' }); return; }
  res.json({ ...family, items: SPECIES.filter(s => s.familyId === family.id) });
});

router.get('/items', (req, res) => {
  let { collectionId, featured, search, limit = 20, offset = 0 } = req.query;
  let filtered = [...SPECIES];
  if (collectionId) filtered = filtered.filter(s => s.familyId === collectionId);
  if (featured === 'true') filtered = filtered.filter(s => s.featured);
  if (search) filtered = filtered.filter(s => s.commonName.toLowerCase().includes((search as string).toLowerCase()));
  res.json({ total: filtered.length, items: filtered.slice(+offset, +offset + +limit).map(s => ({ ...s, title: s.commonName })) });
});

router.get('/items/:id', (req, res) => {
  const species = SPECIES.find(s => s.id === req.params.id);
  if (!species) { res.status(404).json({ error: 'Item não encontrado' }); return; }
  species.views++;
  res.json({ ...species, title: species.commonName, related: SPECIES.filter(s => s.familyId === species.familyId && s.id !== species.id).slice(0, 4) });
});

router.post('/items/:id/like', (req, res) => {
  const species = SPECIES.find(s => s.id === req.params.id);
  if (!species) { res.status(404).json({ error: 'Item não encontrado' }); return; }
  species.likes++;
  res.json({ success: true, likes: species.likes });
});

router.get('/exhibits', (_req, res) => {
  res.json({ total: SPECIES.filter(s => s.featured).length, exhibits: SPECIES.filter(s => s.featured).map(s => ({ ...s, title: s.commonName, period: s.floweringSeason, condition: CONSERVATION_STATUS[s.conservationStatus]?.label })) });
});

export default router;
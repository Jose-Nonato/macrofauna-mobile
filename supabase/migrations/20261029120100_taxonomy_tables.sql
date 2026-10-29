-- Fase 1: classes taxonômicas, pesos do IQMS e contagens normalizadas.

create table if not exists public.taxon_classes (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  code text not null unique,
  names jsonb not null default '{}',
  descriptions jsonb not null default '{}',
  weight_vi numeric not null check (weight_vi >= 0),
  icon_url text,
  image_urls text[] not null default '{}',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger taxon_classes_updated_at before update on public.taxon_classes
  for each row execute function public.set_updated_at();

-- Linha única com os parâmetros globais do cálculo do IQMS.
create table if not exists public.iqms_config (
  id int primary key default 1 check (id = 1),
  weight_den numeric not null default 24.74,
  weight_rt numeric not null default 27.88,
  monolith_factor numeric not null default 16,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.iqms_config (id) values (1) on conflict do nothing;

-- Contagem por classe de cada registro de profundidade (public.insect).
create table if not exists public.sample_counts (
  id uuid primary key default gen_random_uuid(),
  insect_id uuid not null references public.insect(id) on delete cascade,
  taxon_id uuid not null references public.taxon_classes(id),
  count int not null default 0 check (count >= 0),
  unique (insect_id, taxon_id)
);
create index if not exists sample_counts_taxon_idx on public.sample_counts (taxon_id);

alter table public.taxon_classes enable row level security;
alter table public.iqms_config enable row level security;
alter table public.sample_counts enable row level security;

create policy "logados leem classes" on public.taxon_classes
  for select to authenticated using (true);
create policy "admin gerencia classes" on public.taxon_classes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "logados leem config iqms" on public.iqms_config
  for select to authenticated using (true);
create policy "admin gerencia config iqms" on public.iqms_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "dono ou admin le contagens" on public.sample_counts
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.insect i join public.samples s on s.id = i.sample_id
      where i.id = sample_counts.insect_id and s.user_id = auth.uid()));
create policy "dono ou admin grava contagens" on public.sample_counts
  for all to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.insect i join public.samples s on s.id = i.sample_id
      where i.id = sample_counts.insect_id and s.user_id = auth.uid()))
  with check (
    public.is_admin() or exists (
      select 1 from public.insect i join public.samples s on s.id = i.sample_id
      where i.id = sample_counts.insect_id and s.user_id = auth.uid()));

-- Classes atuais do app (pesos Vi da planilha do Taller Patrick).
insert into public.taxon_classes (key, code, weight_vi, sort_order, names, descriptions) values
  ('earthworm', 'EWM', 18.3, 1, $j${"pt":"Minhoca","en":"Earthworm","es":"Lombriz","fr":"Ver de terre"}$j$::jsonb, $j${"pt":"Minhocas são fundamentais para a estrutura e fertilidade do solo, promovendo aeração e ciclagem de nutrientes.","en":"Earthworms are key to soil structure and fertility, promoting aeration and nutrient cycling.","es":"Las lombrices son fundamentales para la estructura y fertilidad del suelo, promoviendo la aireación y el ciclo de nutrientes.","fr":"Les vers de terre sont essentiels à la structure et à la fertilité du sol, favorisant l'aération et le cycle des nutriments."}$j$::jsonb),
  ('ant', 'ANT', 16.83, 2, $j${"pt":"Formiga","en":"Ant","es":"Hormiga","fr":"Fourmi"}$j$::jsonb, $j${"pt":"Formigas contribuem para a ciclagem de nutrientes, dispersão de sementes e aeração do solo.","en":"Ants contribute to nutrient cycling, seed dispersal and soil aeration.","es":"Las hormigas contribuyen al ciclo de nutrientes, la dispersión de semillas y la aireación del suelo.","fr":"Les fourmis contribuent au cycle des nutriments, à la dispersion des graines et à l'aération du sol."}$j$::jsonb),
  ('isoptera', 'TER', 9.2, 3, $j${"pt":"Cupim","en":"Termite","es":"Termita","fr":"Termite"}$j$::jsonb, $j${"pt":"Cupins atuam na decomposição de matéria orgânica lignificada, sendo engenheiros fundamentais do ecossistema do solo.","en":"Termites decompose lignified organic matter and are key ecosystem engineers of the soil.","es":"Las termitas descomponen materia orgánica lignificada y son ingenieras fundamentales del ecosistema del suelo.","fr":"Les termites décomposent la matière organique lignifiée et sont des ingénieurs essentiels de l'écosystème du sol."}$j$::jsonb),
  ('coleoptera', 'COL', 19.62, 4, $j${"pt":"Besouro","en":"Beetle","es":"Escarabajo","fr":"Coléoptère"}$j$::jsonb, $j${"pt":"Besouros possuem diversas funções ecológicas, incluindo decomposição, predação, polinização e bioturbação do solo.","en":"Beetles have diverse ecological roles, including decomposition, predation, pollination and soil bioturbation.","es":"Los escarabajos tienen diversas funciones ecológicas, como descomposición, depredación, polinización y bioturbación del suelo.","fr":"Les coléoptères ont diverses fonctions écologiques : décomposition, prédation, pollinisation et bioturbation du sol."}$j$::jsonb),
  ('chilopoda', 'CHILO', 20.12, 5, $j${"pt":"Centípede","en":"Centipede","es":"Ciempiés","fr":"Chilopode"}$j$::jsonb, $j${"pt":"Quilópodes (centopeias) são predadores ágeis do solo, controlando populações de pequenos invertebrados e contribuindo para o equilíbrio da fauna edáfica.","en":"Centipedes are agile soil predators that control small invertebrate populations and help balance the soil fauna.","es":"Los quilópodos (ciempiés) son depredadores ágiles del suelo que controlan poblaciones de pequeños invertebrados y contribuyen al equilibrio de la fauna edáfica.","fr":"Les chilopodes (scolopendres) sont des prédateurs agiles du sol qui contrôlent les petits invertébrés et contribuent à l'équilibre de la faune du sol."}$j$::jsonb),
  ('diplopoda', 'DIPLO', 18.78, 6, $j${"pt":"Milípede","en":"Millipede","es":"Milpiés","fr":"Mille-pattes"}$j$::jsonb, $j${"pt":"Diplópodes (piolhos-de-cobra) ajudam na decomposição de resíduos vegetais, fragmentando a serapilheira e acelerando a ciclagem de nutrientes.","en":"Millipedes help decompose plant residues, fragmenting litter and speeding up nutrient cycling.","es":"Los diplópodos (milpiés) ayudan a descomponer residuos vegetales, fragmentando la hojarasca y acelerando el ciclo de nutrientes.","fr":"Les diplopodes (mille-pattes) aident à décomposer les résidus végétaux, en fragmentant la litière et en accélérant le cycle des nutriments."}$j$::jsonb),
  ('diptera_larvae', 'DIPT', 16.31, 7, $j${"pt":"Larva de Díptero","en":"Fly Larvae","es":"Larva de Díptero","fr":"Larve de diptère"}$j$::jsonb, $j${"pt":"Larvas de dípteros (moscas e mosquitos) vivem na serapilheira e no solo, onde se alimentam de matéria orgânica em decomposição e auxiliam na sua fragmentação.","en":"Dipteran larvae (flies and mosquitoes) live in litter and soil, feeding on decaying organic matter and helping to break it down.","es":"Las larvas de dípteros (moscas y mosquitos) viven en la hojarasca y el suelo, donde se alimentan de materia orgánica en descomposición y ayudan a fragmentarla.","fr":"Les larves de diptères (mouches et moustiques) vivent dans la litière et le sol, où elles se nourrissent de matière organique en décomposition et aident à la fragmenter."}$j$::jsonb),
  ('blattaria', 'BLA', 7.69, 8, $j${"pt":"Barata","en":"Cockroach","es":"Cucaracha","fr":"Blatte"}$j$::jsonb, $j${"pt":"Baratas participam ativamente da decomposição de matéria orgânica, contribuindo para a reciclagem de nutrientes no solo.","en":"Cockroaches take an active part in decomposing organic matter, helping recycle nutrients in the soil.","es":"Las cucarachas participan activamente en la descomposición de materia orgánica, contribuyendo al reciclaje de nutrientes en el suelo.","fr":"Les blattes participent activement à la décomposition de la matière organique, contribuant au recyclage des nutriments dans le sol."}$j$::jsonb),
  ('hemiptera', 'HEMI', 11.29, 9, $j${"pt":"Hemíptera","en":"True Bug","es":"Hemíptero","fr":"Punaise"}$j$::jsonb, $j${"pt":"Percevejos (Hemiptera) possuem variados hábitos alimentares — fitófagos, predadores ou detritívoros — desempenhando papéis distintos nas cadeias tróficas do solo.","en":"True bugs (Hemiptera) have varied feeding habits — plant feeders, predators or detritivores — and play distinct roles in soil food webs.","es":"Las chinches (Hemiptera) tienen hábitos alimentarios variados —fitófagos, depredadores o detritívoros— y cumplen distintos papeles en las cadenas tróficas del suelo.","fr":"Les punaises (Hemiptera) ont des régimes variés — phytophages, prédateurs ou détritivores — et jouent des rôles distincts dans les chaînes trophiques du sol."}$j$::jsonb),
  ('dermaptera', 'DERM', 7.58, 10, $j${"pt":"Tesourinha","en":"Earwig","es":"Tijereta","fr":"Perce-oreille"}$j$::jsonb, $j${"pt":"Tesourinhas são onívoras e oportunistas, alimentando-se de matéria orgânica em decomposição, fungos e pequenos invertebrados, contribuindo para o equilíbrio da macrofauna.","en":"Earwigs are omnivorous opportunists that feed on decaying organic matter, fungi and small invertebrates, helping balance the macrofauna.","es":"Las tijeretas son omnívoras y oportunistas; se alimentan de materia orgánica en descomposición, hongos y pequeños invertebrados, contribuyendo al equilibrio de la macrofauna.","fr":"Les perce-oreilles sont omnivores et opportunistes ; ils se nourrissent de matière organique en décomposition, de champignons et de petits invertébrés, contribuant à l'équilibre de la macrofaune."}$j$::jsonb),
  ('lepidoptera', 'LEPI', 9.15, 11, $j${"pt":"Borboleta","en":"Butterfly/Moth","es":"Mariposa","fr":"Papillon"}$j$::jsonb, $j${"pt":"Lagartas são larvas de lepidópteros herbívoras que influenciam a biomassa vegetal e, quando presentes no solo, contribuem para a bioturbação e ciclagem de matéria orgânica.","en":"Caterpillars are herbivorous lepidopteran larvae that affect plant biomass and, when in the soil, contribute to bioturbation and organic matter cycling.","es":"Las orugas son larvas herbívoras de lepidópteros que influyen en la biomasa vegetal y, cuando están en el suelo, contribuyen a la bioturbación y al ciclo de la materia orgánica.","fr":"Les chenilles sont des larves herbivores de lépidoptères qui influencent la biomasse végétale et, dans le sol, contribuent à la bioturbation et au cycle de la matière organique."}$j$::jsonb),
  ('gasteropoda', 'GAST', 15.08, 12, $j${"pt":"Gastrópode","en":"Gastropod","es":"Gasterópodo","fr":"Gastéropode"}$j$::jsonb, $j${"pt":"Moluscos terrestres (lesmas e caracóis) participam da decomposição de matéria orgânica vegetal e são importantes elos nas cadeias alimentares do solo.","en":"Land molluscs (slugs and snails) take part in decomposing plant matter and are important links in soil food chains.","es":"Los moluscos terrestres (babosas y caracoles) participan en la descomposición de materia vegetal y son eslabones importantes en las cadenas tróficas del suelo.","fr":"Les mollusques terrestres (limaces et escargots) participent à la décomposition de la matière végétale et sont des maillons importants des chaînes trophiques du sol."}$j$::jsonb),
  ('arachnida', 'ARAC', 15.09, 13, $j${"pt":"Aranha","en":"Spider","es":"Araña","fr":"Araignée"}$j$::jsonb, $j${"pt":"Aranhas são predadoras importantes que regulam populações de insetos e outros invertebrados no solo e na vegetação.","en":"Spiders are important predators that regulate populations of insects and other invertebrates in the soil and vegetation.","es":"Las arañas son depredadores importantes que regulan las poblaciones de insectos y otros invertebrados en el suelo y la vegetación.","fr":"Les araignées sont d'importants prédateurs qui régulent les populations d'insectes et d'autres invertébrés dans le sol et la végétation."}$j$::jsonb),
  ('others', 'OTH', 19.82, 14, $j${"pt":"Outros","en":"Others","es":"Otros","fr":"Autres"}$j$::jsonb, $j${"pt":"Outros organismos do solo, como isópodes (tatuzinhos), ortópteros (grilos e gafanhotos), himenópteros não formigas, colêmbolos e ácaros, que desempenham funções ecológicas variadas na macrofauna edáfica.","en":"Other soil organisms, such as isopods (woodlice), orthopterans (crickets and grasshoppers), non-ant hymenopterans, springtails and mites, which perform varied ecological functions in the soil macrofauna.","es":"Otros organismos del suelo, como isópodos (cochinillas de humedad), ortópteros (grillos y saltamontes), himenópteros no hormigas, colémbolos y ácaros, que cumplen diversas funciones ecológicas en la macrofauna edáfica.","fr":"Autres organismes du sol, comme les isopodes (cloportes), les orthoptères (grillons et sauterelles), les hyménoptères non fourmis, les collemboles et les acariens, aux fonctions écologiques variées dans la macrofaune du sol."}$j$::jsonb)
on conflict (key) do nothing;

-- Bucket público para ícones e fotos das classes; só admin escreve.
insert into storage.buckets (id, name, public) values ('taxon-assets', 'taxon-assets', true)
on conflict (id) do nothing;

create policy "admin envia taxon-assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'taxon-assets' and public.is_admin());
create policy "admin altera taxon-assets" on storage.objects
  for update to authenticated using (bucket_id = 'taxon-assets' and public.is_admin());
create policy "admin remove taxon-assets" on storage.objects
  for delete to authenticated using (bucket_id = 'taxon-assets' and public.is_admin());

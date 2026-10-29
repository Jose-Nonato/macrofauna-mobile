-- Copia as contagens das colunas fixas de public.insect para public.sample_counts
-- (uma linha por registro de profundidade e classe). Não altera nem apaga public.insect.
-- "others" soma também as colunas legadas isopoda e orthoptera, como othersWithLegacy() no app.
-- Idempotente: pode ser reexecutada sem duplicar.
insert into public.sample_counts (insect_id, taxon_id, count)
select i.id, t.id,
  case t.key
    when 'earthworm' then coalesce(i.earthworm, 0)
    when 'ant' then coalesce(i.ant, 0)
    when 'isoptera' then coalesce(i.isoptera, 0)
    when 'coleoptera' then coalesce(i.coleoptera, 0)
    when 'chilopoda' then coalesce(i.chilopoda, 0)
    when 'diplopoda' then coalesce(i.diplopoda, 0)
    when 'diptera_larvae' then coalesce(i.diptera_larvae, 0)
    when 'blattaria' then coalesce(i.blattaria, 0)
    when 'hemiptera' then coalesce(i.hemiptera, 0)
    when 'dermaptera' then coalesce(i.dermaptera, 0)
    when 'lepidoptera' then coalesce(i.lepidoptera, 0)
    when 'gasteropoda' then coalesce(i.gasteropoda, 0)
    when 'arachnida' then coalesce(i.arachnida, 0)
    when 'others' then coalesce(i.others, 0) + coalesce(i.isopoda, 0) + coalesce(i.orthoptera, 0)
  end::int
from public.insect i
cross join public.taxon_classes t
on conflict (insect_id, taxon_id) do nothing;

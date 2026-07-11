export const locations = {
  Brasil: {
    "Acre": ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira"],
    "Alagoas": ["Maceió", "Rio Largo", "Marechal Deodoro"],
    "Amapá": ["Macapá", "Santana", "Oiapoque"],
    "Amazonas": ["Manaus", "Parintins", "Itacoatiara"],
    "Bahia": ["Salvador", "Feira de Santana", "Vitória da Conquista"],
    "Ceará": ["Fortaleza", "Caucaia", "Juazeiro do Norte"],
    "Distrito Federal": ["Brasília"],
    "Espírito Santo": ["Vitória", "Vila Velha", "Serra"],
    "Goiás": ["Goiânia", "Anápolis", "Aparecida de Goiânia"],
    "Maranhão": ["São Luís", "Imperatriz", "Timon"],
    "Mato Grosso": ["Cuiabá", "Várzea Grande", "Rondonópolis"],
    "Mato Grosso do Sul": ["Campo Grande", "Dourados", "Três Lagoas"],
    "Minas Gerais": ["Belo Horizonte", "Uberlândia", "Contagem"],
    "Pará": ["Belém", "Ananindeua", "Santarém"],
    "Paraíba": ["João Pessoa", "Campina Grande", "Santa Rita"],
    "Paraná": ["Curitiba", "Londrina", "Maringá"],
    "Pernambuco": ["Recife", "Jaboatão dos Guararapes", "Olinda"],
    "Piauí": ["Teresina", "Parnaíba", "Picos"],
    "Rio de Janeiro": ["Rio de Janeiro", "Niterói", "Duque de Caxias"],
    "Rio Grande do Norte": ["Natal", "Mossoró", "Parnamirim"],
    "Rio Grande do Sul": ["Porto Alegre", "Caxias do Sul", "Pelotas"],
    "Rondônia": ["Porto Velho", "Ariquemes", "Ji-Paraná"],
    "Roraima": ["Boa Vista", "Caracaraí", "Rorainópolis"],
    "Santa Catarina": ["Florianópolis", "Joinville", "Blumenau"],
    "São Paulo": ["São Paulo", "Campinas", "Santos"],
    "Sergipe": ["Aracaju", "Nossa Senhora do Socorro", "Lagarto"],
    "Tocantins": ["Palmas", "Araguaína", "Gurupi"],
  },
};

export const countries = Object.keys(locations);

export function getStates(country: string): string[] {
  return Object.keys(locations[country as keyof typeof locations] || {});
}

export function getCities(country: string, state: string): string[] {
  const countryData = locations[country as keyof typeof locations];
  if (!countryData) return [];
  return countryData[state as keyof typeof countryData] || [];
}

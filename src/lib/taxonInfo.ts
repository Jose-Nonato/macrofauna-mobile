import type { ImageSourcePropType } from "react-native";

// Ícones brancos (fundo transparente) — devem ser exibidos sobre fundo verde.
export const TAXON_ICONS: Record<string, ImageSourcePropType> = {
  earthworm: require("../../assets/taxons/earthworm.png"),
  ant: require("../../assets/taxons/ant.png"),
  isoptera: require("../../assets/taxons/isoptera.png"),
  blattaria: require("../../assets/taxons/blattaria.png"),
  coleoptera: require("../../assets/taxons/coleoptera.png"),
  arachnida: require("../../assets/taxons/arachnida.png"),
  diplopoda: require("../../assets/taxons/diplopoda.png"),
  chilopoda: require("../../assets/taxons/chilopoda.png"),
  hemiptera: require("../../assets/taxons/hemiptera.png"),
  dermaptera: require("../../assets/taxons/dermaptera.png"),
  lepidoptera: require("../../assets/taxons/lepidoptera.png"),
  gasteropoda: require("../../assets/taxons/gasteropoda.png"),
  diptera_larvae: require("../../assets/taxons/diptera_larvae.png"),
  others: require("../../assets/taxons/others.png"),
};

export const TAXON_IMAGES: Record<string, string[]> = {
  earthworm: [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlp_lc6NMrY8XVTaRVpe7fsYOzFV2HjMUrPg&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLidOrD6gGIncQuMHSOrek_wfMLe-Dk0RhSA&s",
  ],
  ant: [
    "https://super.abril.com.br/wp-content/uploads/2013/07/formiga.png?w=720&h=440&crop=1",
    "https://img.odcdn.com.br/wp-content/uploads/2022/06/formiga-de-fogo.jpg",
  ],
  isoptera: [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHdBuLpXORk1C6FEcpicMiFAbK1uzmEGKLjw&s",
    "https://i0.wp.com/cleantec.com.br/wp-content/uploads/2021/11/o-que-sao-isopteras-e-o-impacto-dos-cupins-na-natureza-e-na-economia.jpg",
  ],
  blattaria: [
    "https://kelldrin.com.br/wp-content/uploads/2020/11/barata.jpg",
    "https://agrodedetizadora.com.br/wp-content/uploads/2018/04/barata-1200x600.jpg",
  ],
  coleoptera: [
    "https://terramagna.com.br/wp-content/uploads/2022/07/Femea-besouro-veado-ambiente-natural-galho.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFMKFza6XWB9xA0mkIwbH9PE65eHIfRkh48Q&s",
  ],
  arachnida: [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRshtOWxIsIL3SsCE1NSEQwgZgB6SvP3xdMw&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTp78wd9S5DSMHRn9UeJ7LS2N0RDhAtN_oRMQ&s",
  ],
  diplopoda: [
    "https://t4.ftcdn.net/jpg/00/14/35/33/360_F_14353302_bgLxl9vweLmIMIBgQP5nkkkdrLYrYuR0.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9b-oiH4tPsacsVPSwPwcAZzrOcCxxyiuwjQ&s",
  ],
  chilopoda: [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3eiDIqpPqyk_0gsq08QLzbBAjY2gIdlqo4A&s",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Scolopendra_heros_dorsal_view.jpg/250px-Scolopendra_heros_dorsal_view.jpg",
  ],
  hemiptera: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bed_bug%2C_Cimex_lectularius.jpg/330px-Bed_bug%2C_Cimex_lectularius.jpg",
    "https://www.ferwer.pt/img/blog/prsty-stenice-stadia.webp",
  ],
  dermaptera: [
    "https://chb.com.br/storage/blog/172801.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxCIZuNGI9o8fOwdmwtwHXSO7vGNijH5TDig&s",
  ],
  lepidoptera: [
    "https://maisagro.syngenta.com.br/media/uploads/2023/11/IMAGEM03-glossario-de-alvos-lagarta-militar_0-1.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Ij7c-n39t57R4V3-SboRM833V8ck7Zujpw&s",
  ],
  gasteropoda: [
    "https://s2.static.brasilescola.uol.com.br/be/2020/11/caracol.jpg",
    "https://static.escolakids.uol.com.br/2020/10/gastropode.jpg",
  ],
  others: [
    "https://agrodedetizadora.com.br/wp-content/uploads/2018/04/tatuzinho-1200x600.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR63NaAnowUAsSV5jjSNwkOopWx0TR8RDvryQ&s",
  ],
};

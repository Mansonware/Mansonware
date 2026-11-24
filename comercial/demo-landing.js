"use strict";
const niches = {
  estetica: {
    label: "Clínica de estética", name: "Sua clínica", kicker: "ESTÉTICA E BEM-ESTAR",
    headline: "Apresente seus cuidados com clareza.",
    description: "Uma página para explicar procedimentos, apresentar informações e facilitar o pedido de avaliação.",
    symbol: "✳", caption: "Cuidado, informação e atendimento em um só lugar.",
    cards: [["Procedimentos","Explique seus serviços de forma simples e objetiva."],["Como funciona","Apresente etapas, informações e orientações importantes."],["Agendamento","Facilite o primeiro contato com sua equipe."]],
    cta: "Solicitar avaliação", goal: "receber pedidos de avaliação"
  },
  solar: {
    label: "Energia solar", name: "Sua empresa", kicker: "ENERGIA SOLAR",
    headline: "Explique seu projeto. Facilite o orçamento.",
    description: "Uma página para apresentar soluções de energia solar e orientar o visitante sobre como solicitar uma avaliação.",
    symbol: "☼", caption: "Informação clara para iniciar uma conversa.",
    cards: [["Residencial","Apresente soluções para casas e pequenos imóveis."],["Comercial","Explique opções para empresas e estabelecimentos."],["Simulação","Direcione interessados para solicitar uma avaliação."]],
    cta: "Solicitar avaliação", goal: "receber pedidos de avaliação"
  },
  oficina: {
    label: "Oficina mecânica", name: "Sua oficina", kicker: "MANUTENÇÃO AUTOMOTIVA",
    headline: "Mostre seus serviços e facilite o contato.",
    description: "Uma página para apresentar os serviços da oficina, explicar o atendimento e receber pedidos de orçamento.",
    symbol: "⌁", caption: "Serviços organizados em uma apresentação objetiva.",
    cards: [["Manutenção","Apresente os serviços de manutenção oferecidos."],["Diagnóstico","Explique como funciona a avaliação do veículo."],["Orçamento","Facilite o primeiro contato com a oficina."]],
    cta: "Solicitar orçamento", goal: "receber pedidos de orçamento"
  },
  imobiliaria: {
    label: "Imobiliária", name: "Sua imobiliária", kicker: "IMÓVEIS E OPORTUNIDADES",
    headline: "Apresente imóveis e aproxime interessados.",
    description: "Uma página para destacar imóveis, explicar condições e facilitar o agendamento de uma conversa ou visita.",
    symbol: "⌂", caption: "Uma vitrine digital para iniciar novas conversas.",
    cards: [["Imóveis","Organize os imóveis e suas informações principais."],["Atendimento","Explique como funciona o processo de compra ou locação."],["Visitas","Facilite o agendamento de uma visita."]],
    cta: "Consultar imóveis", goal: "receber contatos de interessados"
  },
  arquitetura: {
    label: "Arquitetura", name: "Seu escritório", kicker: "ARQUITETURA E INTERIORES",
    headline: "Seu trabalho merece uma apresentação clara.",
    description: "Uma página para apresentar o escritório, organizar projetos e facilitar pedidos de orçamento.",
    symbol: "⌗", caption: "Projetos, processo e contato em uma só página.",
    cards: [["Projetos","Apresente trabalhos e imagens autorizadas."],["Processo","Explique etapas e formas de trabalho."],["Orçamento","Abra um canal direto para novos projetos."]],
    cta: "Conversar sobre um projeto", goal: "receber pedidos de orçamento"
  },
  odontologia: {
    label: "Clínica odontológica", name: "Sua clínica", kicker: "SAÚDE E ODONTOLOGIA",
    headline: "Informações claras para o próximo agendamento.",
    description: "Uma página para apresentar tratamentos, orientar pacientes e facilitar o contato com a equipe.",
    symbol: "＋", caption: "Tratamentos e informações em uma apresentação acessível.",
    cards: [["Tratamentos","Apresente os tratamentos e informações gerais."],["A clínica","Compartilhe estrutura, equipe e orientações reais."],["Agendamento","Facilite o contato para marcar uma consulta."]],
    cta: "Solicitar agendamento", goal: "receber pedidos de agendamento"
  },
  servicos: {
    label: "Prestador de serviços", name: "Sua empresa", kicker: "SERVIÇOS PROFISSIONAIS",
    headline: "Explique o que você faz e facilite o próximo passo.",
    description: "Uma página para apresentar seus serviços, explicar como funciona o atendimento e receber novos contatos.",
    symbol: "↗", caption: "Sua oferta em destaque, com contato sem complicação.",
    cards: [["Serviços","Organize as principais soluções que você oferece."],["Diferenciais","Explique seu processo e o que está incluído."],["Contato","Facilite pedidos de informação e orçamento."]],
    cta: "Pedir orçamento", goal: "receber pedidos de orçamento"
  }
};
const selector = document.getElementById("segment");
const params = new URLSearchParams(location.search);
const valid = (key) => Object.prototype.hasOwnProperty.call(niches, key);
selector.value = valid(params.get("nicho")) ? params.get("nicho") : "estetica";
const byId = (id) => document.getElementById(id);
function contactUrl(item) {
  const url = new URL("https://wa.me/5512996335539");
  url.searchParams.set("text", [
    "Olá, Manson! Vi a demonstração da Mansonware.",
    "Segmento: " + item.label + ".",
    "Quero uma landing page para " + item.goal + ".",
    "Gostaria de conversar sobre o projeto a partir de R$ 297."
  ].join("\n"));
  return url.href;
}
function render() {
  const item = niches[selector.value];
  byId("business-name").innerHTML = item.name + "<span>.</span>";
  byId("footer-name").textContent = item.name;
  byId("business-kicker").textContent = item.kicker;
  byId("business-headline").textContent = item.headline;
  byId("business-description").textContent = item.description;
  byId("symbol").textContent = item.symbol;
  byId("visual-caption").textContent = item.caption;
  byId("preview-cta").textContent = item.cta + " ↗";
  byId("nav-cta").textContent = "Fale conosco ↗";
  byId("contact-headline").textContent = item.cta + "?";
  byId("contact-description").textContent = "O visitante encontra um caminho simples para " + item.goal + ".";
  byId("solution-grid").replaceChildren(...item.cards.map(([title, description], index) => {
    const card = document.createElement("article");
    card.className = "solution-card";
    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    const heading = document.createElement("h4");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = description;
    card.append(number, heading, copy);
    return card;
  }));
  const url = contactUrl(item);
  byId("manson-cta").href = url;
  byId("sample-feedback").hidden = true;
  const current = new URL(location.href);
  current.searchParams.set("nicho", selector.value);
  history.replaceState({}, "", current);
}
selector.addEventListener("change", render);
byId("sample-cta").addEventListener("click", () => {
  byId("sample-feedback").hidden = false;
});
render();
